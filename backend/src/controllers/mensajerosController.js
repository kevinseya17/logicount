const { supabase } = require('../prisma/db');
const { v4: uuidv4 } = require('uuid');

async function getAll(req, res) {
  const { data } = await supabase.from('mensajeros').select('*').order('nombre', { ascending: true });
  res.json(data || []);
}

async function getById(req, res) {
  const { data } = await supabase.from('mensajeros').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ error: 'Mensajero no encontrado' });
  res.json(data);
}

async function create(req, res) {
  const { nombre, cedula, telefono } = req.body;
  if (!nombre || !cedula)
    return res.status(400).json({ error: 'Nombre y cédula son requeridos' });

  const { data: exists } = await supabase.from('mensajeros').select('id').eq('cedula', cedula).maybeSingle();
  if (exists) return res.status(409).json({ error: 'Ya existe un mensajero con esa cédula' });

  const id = uuidv4();
  const { error } = await supabase.from('mensajeros').insert({ id, nombre, cedula, telefono: telefono || null });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id, nombre, cedula, telefono, activo: 1 });
}

async function update(req, res) {
  const { nombre, cedula, telefono, activo } = req.body;
  const { data: existing } = await supabase.from('mensajeros').select('*').eq('id', req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Mensajero no encontrado' });

  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (cedula !== undefined) updates.cedula = cedula;
  if (telefono !== undefined) updates.telefono = telefono;
  if (activo !== undefined) updates.activo = activo;

  const { error } = await supabase.from('mensajeros').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...existing, ...updates });
}

async function toggleActive(req, res) {
  const { data: row } = await supabase.from('mensajeros').select('*').eq('id', req.params.id).maybeSingle();
  if (!row) return res.status(404).json({ error: 'Mensajero no encontrado' });
  const newState = row.activo === 1 ? 0 : 1;
  await supabase.from('mensajeros').update({ activo: newState }).eq('id', req.params.id);
  res.json({ ...row, activo: newState });
}

async function remove(req, res) {
  const { data: row } = await supabase.from('mensajeros').select('id').eq('id', req.params.id).maybeSingle();
  if (!row) return res.status(404).json({ error: 'Mensajero no encontrado' });
  await supabase.from('mensajeros').delete().eq('id', req.params.id);
  res.json({ message: 'Mensajero eliminado' });
}

module.exports = { getAll, getById, create, update, toggleActive, remove };
