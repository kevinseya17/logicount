require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./prisma/init');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;

// Init DB
initDB();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mensajeros', require('./routes/mensajeros'));
app.use('/api/jornadas', require('./routes/jornadas'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// HU-09: Cron para alertas (cada día a las 6pm)
cron.schedule('0 18 * * *', () => {
  const { getDB } = require('./prisma/db');
  const db = getDB();
  const alertas = db.prepare(`
    SELECT m.nombre, 
      ROUND(CAST(SUM(a.paquetes_entregados) AS FLOAT) / NULLIF(SUM(a.paquetes_asignados), 0) * 100, 1) as tasa
    FROM asignaciones a
    JOIN mensajeros m ON m.id = a.mensajero_id
    JOIN jornadas j ON j.id = a.jornada_id
    WHERE j.fecha = date('now')
    GROUP BY a.mensajero_id
    HAVING tasa < 70
  `).all();
  if (alertas.length > 0) {
    console.log('⚠️  ALERTA RENDIMIENTO BAJO:', alertas);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LogiCount API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
