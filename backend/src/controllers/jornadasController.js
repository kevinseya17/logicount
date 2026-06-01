const { getDB } = require('../prisma/db');
const { v4: uuidv4 } = require('uuid');

// HU-02: Registro apertura de jornada
function abrir(req, res) {
  const { fecha, paquetes_recibidos } = req.body;
  if (!fecha || paquetes_recibidos === undefined)
    return res.status(400).json({ error: 'Fecha y paquetes recibidos son requeridos' });

  const db = getDB();
  const abierta = db.prepare("SELECT id FROM jornadas WHERE fecha = ? AND estado = 'abierta'").get(fecha);
  if (abierta) return res.status(409).json({ error: 'Ya existe una jornada abierta para esa fecha' });

  const id = uuidv4();
  db.prepare('INSERT INTO jornadas (id, fecha, paquetes_recibidos, estado, created_by) VALUES (?, ?, ?, ?, ?)').run(
    id, fecha, paquetes_recibidos, 'abierta', req.user.id
  );
  res.status(201).json({ id, fecha, paquetes_recibidos, estado: 'abierta' });
}

// HU-03: Asignación de paquetes
function asignar(req, res) {
  const { jornada_id, mensajero_id, paquetes_asignados } = req.body;
  if (!jornada_id || !mensajero_id || !paquetes_asignados)
    return res.status(400).json({ error: 'Datos incompletos' });

  const db = getDB();
  const jornada = db.prepare("SELECT * FROM jornadas WHERE id = ? AND estado = 'abierta'").get(jornada_id);
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada o cerrada' });

  // Check if already assigned
  const existing = db.prepare('SELECT id FROM asignaciones WHERE jornada_id = ? AND mensajero_id = ?').get(jornada_id, mensajero_id);
  if (existing) {
    db.prepare('UPDATE asignaciones SET paquetes_asignados = ? WHERE id = ?').run(paquetes_asignados, existing.id);
    return res.json({ ...existing, paquetes_asignados });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO asignaciones (id, jornada_id, mensajero_id, paquetes_asignados) VALUES (?, ?, ?, ?)').run(
    id, jornada_id, mensajero_id, paquetes_asignados
  );
  res.status(201).json({ id, jornada_id, mensajero_id, paquetes_asignados });
}

// HU-04: Cierre operativo diario
function cerrar(req, res) {
  const { jornada_id, resultados, observaciones } = req.body;
  if (!jornada_id || !resultados)
    return res.status(400).json({ error: 'Datos de cierre incompletos' });

  const db = getDB();
  const jornada = db.prepare("SELECT * FROM jornadas WHERE id = ? AND estado = 'abierta'").get(jornada_id);
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada o ya cerrada' });

  let totalEntregados = 0, totalDevueltos = 0, totalPendientes = 0;

  const updateAsig = db.prepare(`UPDATE asignaciones SET 
    paquetes_entregados = ?, paquetes_devueltos = ?, paquetes_pendientes = ? 
    WHERE jornada_id = ? AND mensajero_id = ?`);

  const updateMany = db.transaction(() => {
    for (const r of resultados) {
      updateAsig.run(r.entregados, r.devueltos, r.pendientes, jornada_id, r.mensajero_id);
      totalEntregados += r.entregados || 0;
      totalDevueltos += r.devueltos || 0;
      totalPendientes += r.pendientes || 0;
    }
  });
  updateMany();

  const cierre_id = uuidv4();
  db.prepare('INSERT INTO cierres (id, jornada_id, total_entregados, total_devueltos, total_pendientes, observaciones) VALUES (?, ?, ?, ?, ?, ?)').run(
    cierre_id, jornada_id, totalEntregados, totalDevueltos, totalPendientes, observaciones || null
  );

  db.prepare("UPDATE jornadas SET estado = 'cerrada', closed_at = datetime('now') WHERE id = ?").run(jornada_id);

  res.json({ cierre_id, jornada_id, totalEntregados, totalDevueltos, totalPendientes });
}

// HU-05: Historial operativo
function historial(req, res) {
  const db = getDB();
  const rows = db.prepare(`
    SELECT j.id, j.fecha, j.paquetes_recibidos, j.estado, j.created_at, j.closed_at,
           c.total_entregados, c.total_devueltos, c.total_pendientes, c.observaciones
    FROM jornadas j
    LEFT JOIN cierres c ON c.jornada_id = j.id
    ORDER BY j.fecha DESC
  `).all();
  res.json(rows);
}

function getJornada(req, res) {
  const db = getDB();
  const jornada = db.prepare(`
    SELECT j.*, c.total_entregados, c.total_devueltos, c.total_pendientes, c.observaciones
    FROM jornadas j LEFT JOIN cierres c ON c.jornada_id = j.id
    WHERE j.id = ?
  `).get(req.params.id);
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' });

  const asignaciones = db.prepare(`
    SELECT a.*, m.nombre as mensajero_nombre, m.cedula
    FROM asignaciones a
    JOIN mensajeros m ON m.id = a.mensajero_id
    WHERE a.jornada_id = ?
  `).all(req.params.id);

  res.json({ ...jornada, asignaciones });
}

function getActiva(req, res) {
  const db = getDB();
  const jornada = db.prepare("SELECT * FROM jornadas WHERE estado = 'abierta' ORDER BY created_at DESC LIMIT 1").get();
  if (!jornada) return res.json(null);

  const asignaciones = db.prepare(`
    SELECT a.*, m.nombre as mensajero_nombre
    FROM asignaciones a
    JOIN mensajeros m ON m.id = a.mensajero_id
    WHERE a.jornada_id = ?
  `).all(jornada.id);

  res.json({ ...jornada, asignaciones });
}

module.exports = { abrir, asignar, cerrar, historial, getJornada, getActiva };
