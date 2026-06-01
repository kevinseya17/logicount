const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../logicount.db');

function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mensajeros (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      cedula TEXT UNIQUE NOT NULL,
      telefono TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jornadas (
      id TEXT PRIMARY KEY,
      fecha TEXT NOT NULL,
      paquetes_recibidos INTEGER DEFAULT 0,
      estado TEXT DEFAULT 'abierta',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS asignaciones (
      id TEXT PRIMARY KEY,
      jornada_id TEXT NOT NULL,
      mensajero_id TEXT NOT NULL,
      paquetes_asignados INTEGER DEFAULT 0,
      paquetes_entregados INTEGER DEFAULT 0,
      paquetes_devueltos INTEGER DEFAULT 0,
      paquetes_pendientes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
      FOREIGN KEY (mensajero_id) REFERENCES mensajeros(id)
    );

    CREATE TABLE IF NOT EXISTS cierres (
      id TEXT PRIMARY KEY,
      jornada_id TEXT NOT NULL UNIQUE,
      total_entregados INTEGER DEFAULT 0,
      total_devueltos INTEGER DEFAULT 0,
      total_pendientes INTEGER DEFAULT 0,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (jornada_id) REFERENCES jornadas(id)
    );
  `);

  // Seed admin user
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const { v4: uuidv4 } = require('uuid');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)').run(
      uuidv4(), 'admin', hash, 'admin'
    );
    console.log('✅ Admin user created: admin / admin123');
  }

  console.log('✅ Database initialized at', DB_PATH);
  db.close();
}

module.exports = { initDB, DB_PATH };
