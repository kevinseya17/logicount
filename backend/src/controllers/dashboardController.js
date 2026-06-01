const { supabase } = require('../prisma/db');
const ExcelJS = require('exceljs');

async function dashboard(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    { count: totalMensajeros },
    { count: jornadasHoy },
    { data: jornadasMes },
    { data: ultimas7Raw },
    { data: asigTodo },
    { data: jornadasRecientes }
  ] = await Promise.all([
    supabase.from('mensajeros').select('*', { count: 'exact', head: true }).eq('activo', 1),
    supabase.from('jornadas').select('*', { count: 'exact', head: true }).eq('fecha', today),
    supabase.from('jornadas').select('id, cierres (total_entregados, total_devueltos, total_pendientes)').gte('fecha', firstOfMonth),
    supabase.from('jornadas').select('fecha, cierres (total_entregados, total_devueltos, total_pendientes)').eq('estado', 'cerrada').order('fecha', { ascending: false }).limit(7),
    supabase.from('asignaciones').select('mensajero_id, paquetes_entregados, mensajeros (nombre)'),
    supabase.from('jornadas').select('id').gte('fecha', hace7dias)
  ]);

  const resumenMes = (jornadasMes || []).reduce((acc, j) => ({
    jornadas: acc.jornadas + 1,
    entregados: acc.entregados + (j.cierres?.total_entregados || 0),
    devueltos: acc.devueltos + (j.cierres?.total_devueltos || 0),
    pendientes: acc.pendientes + (j.cierres?.total_pendientes || 0)
  }), { jornadas: 0, entregados: 0, devueltos: 0, pendientes: 0 });

  const ultimas7 = (ultimas7Raw || []).map(j => ({
    fecha: j.fecha,
    entregados: j.cierres?.total_entregados || 0,
    devueltos: j.cierres?.total_devueltos || 0,
    pendientes: j.cierres?.total_pendientes || 0
  })).reverse();

  const mensajeroMap = {};
  (asigTodo || []).forEach(a => {
    if (!mensajeroMap[a.mensajero_id])
      mensajeroMap[a.mensajero_id] = { nombre: a.mensajeros?.nombre, total_entregados: 0 };
    mensajeroMap[a.mensajero_id].total_entregados += a.paquetes_entregados || 0;
  });
  const topMensajeros = Object.values(mensajeroMap).sort((a, b) => b.total_entregados - a.total_entregados).slice(0, 5);

  let alertas = [];
  const jornadaIds = (jornadasRecientes || []).map(j => j.id);
  if (jornadaIds.length > 0) {
    const { data: asigRec } = await supabase
      .from('asignaciones').select('mensajero_id, paquetes_entregados, paquetes_asignados, mensajeros (nombre)').in('jornada_id', jornadaIds);
    const alertMap = {};
    (asigRec || []).forEach(a => {
      if (!alertMap[a.mensajero_id])
        alertMap[a.mensajero_id] = { nombre: a.mensajeros?.nombre, entregados: 0, asignados: 0 };
      alertMap[a.mensajero_id].entregados += a.paquetes_entregados || 0;
      alertMap[a.mensajero_id].asignados += a.paquetes_asignados || 0;
    });
    alertas = Object.values(alertMap)
      .map(m => ({ nombre: m.nombre, tasa: m.asignados > 0 ? Math.round(m.entregados / m.asignados * 1000) / 10 : 0 }))
      .filter(m => m.tasa < 70);
  }

  res.json({ totalMensajeros, jornadasHoy, resumenMes, ultimas7, topMensajeros, alertas });
}

async function exportarExcel(req, res) {
  const { desde, hasta } = req.query;

  let qJornadas = supabase.from('jornadas')
    .select('fecha, paquetes_recibidos, cierres (total_entregados, total_devueltos, total_pendientes, observaciones)')
    .eq('estado', 'cerrada').order('fecha', { ascending: false });
  if (desde) qJornadas = qJornadas.gte('fecha', desde);
  if (hasta) qJornadas = qJornadas.lte('fecha', hasta);

  let qDetalle = supabase.from('asignaciones')
    .select('paquetes_asignados, paquetes_entregados, paquetes_devueltos, paquetes_pendientes, jornadas!inner (fecha, estado), mensajeros (nombre, cedula)')
    .eq('jornadas.estado', 'cerrada').order('jornadas(fecha)', { ascending: false });
  if (desde) qDetalle = qDetalle.gte('jornadas.fecha', desde);
  if (hasta) qDetalle = qDetalle.lte('jornadas.fecha', hasta);

  const [{ data: jornadas }, { data: detalleRaw }] = await Promise.all([qJornadas, qDetalle]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LogiCount';

  const ws1 = workbook.addWorksheet('Resumen Jornadas');
  ws1.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Recibidos', key: 'paquetes_recibidos', width: 12 },
    { header: 'Entregados', key: 'total_entregados', width: 12 },
    { header: 'Devueltos', key: 'total_devueltos', width: 12 },
    { header: 'Pendientes', key: 'total_pendientes', width: 12 },
    { header: 'Observaciones', key: 'observaciones', width: 30 },
  ];
  ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  (jornadas || []).forEach(j => ws1.addRow({
    fecha: j.fecha, paquetes_recibidos: j.paquetes_recibidos,
    total_entregados: j.cierres?.total_entregados || 0,
    total_devueltos: j.cierres?.total_devueltos || 0,
    total_pendientes: j.cierres?.total_pendientes || 0,
    observaciones: j.cierres?.observaciones || ''
  }));

  const ws2 = workbook.addWorksheet('Detalle Mensajeros');
  ws2.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Mensajero', key: 'mensajero', width: 20 },
    { header: 'Cédula', key: 'cedula', width: 14 },
    { header: 'Asignados', key: 'paquetes_asignados', width: 12 },
    { header: 'Entregados', key: 'paquetes_entregados', width: 12 },
    { header: 'Devueltos', key: 'paquetes_devueltos', width: 12 },
    { header: 'Pendientes', key: 'paquetes_pendientes', width: 12 },
  ];
  ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  (detalleRaw || []).forEach(d => ws2.addRow({
    fecha: d.jornadas?.fecha, mensajero: d.mensajeros?.nombre, cedula: d.mensajeros?.cedula,
    paquetes_asignados: d.paquetes_asignados, paquetes_entregados: d.paquetes_entregados,
    paquetes_devueltos: d.paquetes_devueltos, paquetes_pendientes: d.paquetes_pendientes
  }));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=logicount_reporte_${new Date().toISOString().slice(0, 10)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { dashboard, exportarExcel };
