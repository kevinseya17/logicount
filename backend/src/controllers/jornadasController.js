const { supabase } = require('../prisma/db');
const { v4: uuidv4 } = require('uuid');

async function abrir(req, res) {
  const { fecha, paquetes_recibidos } = req.body;
  if (!fecha || paquetes_recibidos === undefined)
    return res.status(400).json({ error: 'Fecha y paquetes recibidos son requeridos' });

  const { data: abierta } = await supabase
    .from('jornadas').select('id').eq('fecha', fecha).eq('estado', 'abierta').maybeSingle();
  if (abierta) return res.status(409).json({ error: 'Ya existe una jornada abierta para esa fecha' });

  const id = uuidv4();
  const { error } = await supabase.from('jornadas').insert({
    id, fecha, paquetes_recibidos, estado: 'abierta', created_by: req.user.id
  });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id, fecha, paquetes_recibidos, estado: 'abierta' });
}

async function asignar(req, res) {
  const { jornada_id, mensajero_id, paquetes_asignados } = req.body;
  if (!jornada_id || !mensajero_id || !paquetes_asignados)
    return res.status(400).json({ error: 'Datos incompletos' });

  const { data: jornada } = await supabase
    .from('jornadas').select('*').eq('id', jornada_id).eq('estado', 'abierta').maybeSingle();
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada o cerrada' });

  const { data: existing } = await supabase
    .from('asignaciones').select('id').eq('jornada_id', jornada_id).eq('mensajero_id', mensajero_id).maybeSingle();

  if (existing) {
    await supabase.from('asignaciones').update({ paquetes_asignados }).eq('id', existing.id);
    return res.json({ ...existing, paquetes_asignados });
  }

  const id = uuidv4();
  await supabase.from('asignaciones').insert({ id, jornada_id, mensajero_id, paquetes_asignados });
  res.status(201).json({ id, jornada_id, mensajero_id, paquetes_asignados });
}

async function cerrar(req, res) {
  const { jornada_id, resultados, observaciones } = req.body;
  if (!jornada_id || !resultados)
    return res.status(400).json({ error: 'Datos de cierre incompletos' });

  const { data: jornada } = await supabase
    .from('jornadas').select('*').eq('id', jornada_id).eq('estado', 'abierta').maybeSingle();
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada o ya cerrada' });

  let totalEntregados = 0, totalDevueltos = 0, totalPendientes = 0;

  for (const r of resultados) {
    await supabase.from('asignaciones').update({
      paquetes_entregados: r.entregados,
      paquetes_devueltos: r.devueltos,
      paquetes_pendientes: r.pendientes
    }).eq('jornada_id', jornada_id).eq('mensajero_id', r.mensajero_id);
    totalEntregados += r.entregados || 0;
    totalDevueltos += r.devueltos || 0;
    totalPendientes += r.pendientes || 0;
  }

  const cierre_id = uuidv4();
  await supabase.from('cierres').insert({
    id: cierre_id, jornada_id,
    total_entregados: totalEntregados,
    total_devueltos: totalDevueltos,
    total_pendientes: totalPendientes,
    observaciones: observaciones || null
  });

  await supabase.from('jornadas').update({
    estado: 'cerrada', closed_at: new Date().toISOString()
  }).eq('id', jornada_id);

  res.json({ cierre_id, jornada_id, totalEntregados, totalDevueltos, totalPendientes });
}

async function historial(req, res) {
  const { data: rows } = await supabase
    .from('jornadas')
    .select('id, fecha, paquetes_recibidos, estado, created_at, closed_at, cierres (total_entregados, total_devueltos, total_pendientes, observaciones)')
    .order('fecha', { ascending: false });

  const result = (rows || []).map(j => ({
    ...j, ...(j.cierres || {}), cierres: undefined
  }));
  res.json(result);
}

async function getJornada(req, res) {
  const { data: jornada } = await supabase
    .from('jornadas')
    .select('*, cierres (total_entregados, total_devueltos, total_pendientes, observaciones)')
    .eq('id', req.params.id).maybeSingle();
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' });

  const { data: asignaciones } = await supabase
    .from('asignaciones').select('*, mensajeros (nombre, cedula)').eq('jornada_id', req.params.id);

  const flat = (asignaciones || []).map(a => ({
    ...a, mensajero_nombre: a.mensajeros?.nombre, cedula: a.mensajeros?.cedula, mensajeros: undefined
  }));

  res.json({ ...jornada, ...(jornada.cierres || {}), cierres: undefined, asignaciones: flat });
}

async function getActiva(req, res) {
  const { data: jornada } = await supabase
    .from('jornadas').select('*').eq('estado', 'abierta')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!jornada) return res.json(null);

  const { data: asignaciones } = await supabase
    .from('asignaciones').select('*, mensajeros (nombre)').eq('jornada_id', jornada.id);

  const flat = (asignaciones || []).map(a => ({
    ...a, mensajero_nombre: a.mensajeros?.nombre, mensajeros: undefined
  }));

  res.json({ ...jornada, asignaciones: flat });
}

module.exports = { abrir, asignar, cerrar, historial, getJornada, getActiva };
