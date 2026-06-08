require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./prisma/init');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;

// Init DB
initDB();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mensajeros', require('./routes/mensajeros'));
app.use('/api/jornadas', require('./routes/jornadas'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// HU-09: Cron para alertas (cada día a las 6pm)
cron.schedule('0 18 * * *', async () => {
  const { supabase } = require('./prisma/db');
  const today = new Date().toISOString().slice(0, 10);
  const { data: jornadas } = await supabase.from('jornadas').select('id').eq('fecha', today);
  const ids = (jornadas || []).map(j => j.id);
  if (ids.length === 0) return;
  const { data: asig } = await supabase
    .from('asignaciones')
    .select('mensajero_id, paquetes_entregados, paquetes_asignados, mensajeros (nombre)')
    .in('jornada_id', ids);
  const map = {};
  (asig || []).forEach(a => {
    if (!map[a.mensajero_id]) map[a.mensajero_id] = { nombre: a.mensajeros?.nombre, e: 0, a: 0 };
    map[a.mensajero_id].e += a.paquetes_entregados || 0;
    map[a.mensajero_id].a += a.paquetes_asignados || 0;
  });
  const alertas = Object.values(map).filter(m => m.a > 0 && (m.e / m.a * 100) < 70);
  if (alertas.length > 0) console.log('⚠️  ALERTA RENDIMIENTO BAJO:', alertas.map(m => m.nombre));
});

app.listen(PORT, () => {
  console.log(`🚀 LogiCount API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
