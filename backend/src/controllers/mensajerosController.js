const { getDB } = require('../prisma/db');
const { v4: uuidv4 } = require('uuid');

function getAll(req, res) {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM mensajeros ORDER BY nombre ASC').all();
  res.json(rows);
}

function getById(req, res) {
  const db = getDB();
  const row = db.prepare('SELECT * FROM mensajeros WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Mensajero no encontrado' });
  res.json(row);
}

function create(req, res) {
  const { nombre, cedula, telefono } = req.body;
  if (!nombre || !cedula)
    return res.status(400).json({ error: 'Nombre y cédula son requeridos' });

  const db = getDB();
  const exists = db.prepare('SELECT id FROM mensajeros WHERE cedula = ?').get(cedula);
  if (exists) return res.status(409).json({ error: 'Ya existe un mensajero con esa cédula' });

  const id = uuidv4();
  db.prepare('INSERT INTO mensajeros (id, nombre, cedula, telefono) VALUES (?, ?, ?, ?)').run(
    id, nombre, cedula, telefono || null
  );
  res.status(201).json({ id, nombre, cedula, telefono, activo: 1 });
}

function update(req, res) {
  const { nombre, cedula, telefono, activo } = req.body;
  const db = getDB();
  const existing = db.prepare('SELECT * FROM mensajeros WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Mensajero no encontrado' });

  db.prepare(`UPDATE mensajeros SET 
    nombre = COALESCE(?, nombre),
    cedula = COALESCE(?, cedula),
    telefono = COALESCE(?, telefono),
    activo = COALESCE(?, activo)
    WHERE id = ?`).run(nombre, cedula, telefono, activo !== undefined ? activo : null, req.params.id);

  res.json({ ...existing, nombre, cedula, telefono, activo });
}

function toggleActive(req, res) {
  const db = getDB();
  const row = db.prepare('SELECT * FROM mensajeros WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Mensajero no encontrado' });
  const newState = row.activo === 1 ? 0 : 1;
  db.prepare('UPDATE mensajeros SET activo = ? WHERE id = ?').run(newState, req.params.id);
  res.json({ ...row, activo: newState });
}

function remove(req, res) {
  const db = getDB();
  const row = db.prepare('SELECT id FROM mensajeros WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Mensajero no encontrado' });
  db.prepare('DELETE FROM mensajeros WHERE id = ?').run(req.params.id);
  res.json({ message: 'Mensajero eliminado' });
}

module.exports = { getAll, getById, create, update, toggleActive, remove };
