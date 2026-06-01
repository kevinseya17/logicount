const { getDB } = require('../prisma/db');
const ExcelJS = require('exceljs');

// HU-06: Dashboard operativo
function dashboard(req, res) {
  const db = getDB();

  const totalMensajeros = db.prepare('SELECT COUNT(*) as total FROM mensajeros WHERE activo = 1').get();
  const jornadasHoy = db.prepare("SELECT COUNT(*) as total FROM jornadas WHERE fecha = date('now')").get();
  const resumenMes = db.prepare(`
    SELECT 
      COUNT(DISTINCT j.id) as jornadas,
      SUM(c.total_entregados) as entregados,
      SUM(c.total_devueltos) as devueltos,
      SUM(c.total_pendientes) as pendientes
    FROM jornadas j
    LEFT JOIN cierres c ON c.jornada_id = j.id
    WHERE strftime('%Y-%m', j.fecha) = strftime('%Y-%m', 'now')
  `).get();

  const ultimas7 = db.prepare(`
    SELECT j.fecha,
      COALESCE(c.total_entregados, 0) as entregados,
      COALESCE(c.total_devueltos, 0) as devueltos,
      COALESCE(c.total_pendientes, 0) as pendientes
    FROM jornadas j
    LEFT JOIN cierres c ON c.jornada_id = j.id
    WHERE j.estado = 'cerrada'
    ORDER BY j.fecha DESC LIMIT 7
  `).all().reverse();

  const topMensajeros = db.prepare(`
    SELECT m.nombre, SUM(a.paquetes_entregados) as total_entregados
    FROM asignaciones a
    JOIN mensajeros m ON m.id = a.mensajero_id
    GROUP BY a.mensajero_id
    ORDER BY total_entregados DESC LIMIT 5
  `).all();

  // HU-09: Alertas
  const alertas = db.prepare(`
    SELECT m.nombre, 
      ROUND(CAST(SUM(a.paquetes_entregados) AS FLOAT) / NULLIF(SUM(a.paquetes_asignados), 0) * 100, 1) as tasa
    FROM asignaciones a
    JOIN mensajeros m ON m.id = a.mensajero_id
    JOIN jornadas j ON j.id = a.jornada_id
    WHERE j.fecha >= date('now', '-7 days')
    GROUP BY a.mensajero_id
    HAVING tasa < 70 AND tasa IS NOT NULL
  `).all();

  res.json({
    totalMensajeros: totalMensajeros.total,
    jornadasHoy: jornadasHoy.total,
    resumenMes,
    ultimas7,
    topMensajeros,
    alertas
  });
}

// HU-07: Exportar reporte Excel
async function exportarExcel(req, res) {
  const db = getDB();
  const { desde, hasta } = req.query;

  const jornadas = db.prepare(`
    SELECT j.fecha, j.paquetes_recibidos,
      COALESCE(c.total_entregados, 0) as total_entregados,
      COALESCE(c.total_devueltos, 0) as total_devueltos,
      COALESCE(c.total_pendientes, 0) as total_pendientes,
      c.observaciones
    FROM jornadas j
    LEFT JOIN cierres c ON c.jornada_id = j.id
    WHERE j.estado = 'cerrada'
    ${desde ? "AND j.fecha >= '" + desde + "'" : ''}
    ${hasta ? "AND j.fecha <= '" + hasta + "'" : ''}
    ORDER BY j.fecha DESC
  `).all();

  const detalle = db.prepare(`
    SELECT j.fecha, m.nombre as mensajero, m.cedula,
      a.paquetes_asignados, a.paquetes_entregados, a.paquetes_devueltos, a.paquetes_pendientes
    FROM asignaciones a
    JOIN jornadas j ON j.id = a.jornada_id
    JOIN mensajeros m ON m.id = a.mensajero_id
    WHERE j.estado = 'cerrada'
    ${desde ? "AND j.fecha >= '" + desde + "'" : ''}
    ${hasta ? "AND j.fecha <= '" + hasta + "'" : ''}
    ORDER BY j.fecha DESC, m.nombre ASC
  `).all();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LogiCount';

  // Sheet 1: Resumen por jornada
  const ws1 = workbook.addWorksheet('Resumen Jornadas');
  ws1.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Recibidos', key: 'paquetes_recibidos', width: 12 },
    { header: 'Entregados', key: 'total_entregados', width: 12 },
    { header: 'Devueltos', key: 'total_devueltos', width: 12 },
    { header: 'Pendientes', key: 'total_pendientes', width: 12 },
    { header: 'Observaciones', key: 'observaciones', width: 30 },
  ];
  ws1.getRow(1).font = { bold: true };
  ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  jornadas.forEach(j => ws1.addRow(j));

  // Sheet 2: Detalle por mensajero
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
  ws2.getRow(1).font = { bold: true };
  ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  detalle.forEach(d => ws2.addRow(d));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=logicount_reporte_${new Date().toISOString().slice(0,10)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { dashboard, exportarExcel };
