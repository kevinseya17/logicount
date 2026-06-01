import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../services/api'

function StatCard({ label, value, sub, color = 'accent' }) {
  const colors = {
    accent: 'text-accent',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  }
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className={`font-display font-800 text-3xl ${colors[color]} mt-1`}>{value ?? '—'}</p>
      {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-700 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-white/60 mb-2 font-display font-600">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-800 text-2xl text-white">Dashboard operativo</h1>
        <p className="text-white/40 text-sm mt-1">Resumen de operaciones — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Alertas HU-09 */}
      {data?.alertas?.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="font-display font-700 text-amber-400 text-sm mb-2">⚠ Alerta de rendimiento bajo</p>
          <div className="flex flex-wrap gap-2">
            {data.alertas.map(a => (
              <span key={a.nombre} className="badge-yellow">{a.nombre} — {a.tasa}%</span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mensajeros activos" value={data?.totalMensajeros} color="blue" />
        <StatCard label="Entregados este mes" value={data?.resumenMes?.entregados ?? 0} color="emerald" />
        <StatCard label="Devueltos este mes" value={data?.resumenMes?.devueltos ?? 0} color="red" />
        <StatCard label="Pendientes este mes" value={data?.resumenMes?.pendientes ?? 0} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica últimos 7 días */}
        <div className="card lg:col-span-2">
          <p className="font-display font-700 text-white mb-4">Últimos 7 días</p>
          {data?.ultimas7?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.ultimas7} barGap={2}>
                <XAxis dataKey="fecha" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="entregados" name="Entregados" fill="#34d399" radius={[4,4,0,0]} />
                <Bar dataKey="devueltos" name="Devueltos" fill="#f87171" radius={[4,4,0,0]} />
                <Bar dataKey="pendientes" name="Pendientes" fill="#f0a500" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">Sin datos aún</div>
          )}
        </div>

        {/* Top mensajeros */}
        <div className="card">
          <p className="font-display font-700 text-white mb-4">Top mensajeros</p>
          {data?.topMensajeros?.length > 0 ? (
            <div className="space-y-3">
              {data.topMensajeros.map((m, i) => (
                <div key={m.nombre} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-display font-700 flex items-center justify-center">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-600 truncate">{m.nombre}</p>
                    <div className="h-1 bg-navy-700 rounded-full mt-1">
                      <div className="h-1 bg-accent rounded-full" style={{ width: `${Math.min((m.total_entregados / (data.topMensajeros[0].total_entregados || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-accent text-xs font-display font-700">{m.total_entregados}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-white/20 text-sm">Sin datos aún</div>
          )}
        </div>
      </div>
    </div>
  )
}
