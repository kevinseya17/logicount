/* -- Ejecutar en: Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensajeros (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  telefono TEXT,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jornadas (
  id TEXT PRIMARY KEY,
  fecha DATE NOT NULL,
  paquetes_recibidos INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'abierta',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS asignaciones (
  id TEXT PRIMARY KEY,
  jornada_id TEXT NOT NULL REFERENCES jornadas(id),
  mensajero_id TEXT NOT NULL REFERENCES mensajeros(id),
  paquetes_asignados INTEGER DEFAULT 0,
  paquetes_entregados INTEGER DEFAULT 0,
  paquetes_devueltos INTEGER DEFAULT 0,
  paquetes_pendientes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cierres (
  id TEXT PRIMARY KEY,
  jornada_id TEXT NOT NULL UNIQUE REFERENCES jornadas(id),
  total_entregados INTEGER DEFAULT 0,
  total_devueltos INTEGER DEFAULT 0,
  total_pendientes INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desactivar RLS (el backend maneja la autenticación con JWT)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mensajeros DISABLE ROW LEVEL SECURITY;
ALTER TABLE jornadas DISABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE cierres DISABLE ROW LEVEL SECURITY;
 */