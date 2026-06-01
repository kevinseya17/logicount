import { useState } from 'react'
import api from '../services/api'

export default function Reportes() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleExportar() {
    setLoading(true)
    setMsg('')
    try {
      const params = new URLSearchParams()
      if (desde) params.append('desde', desde)
      if (hasta) params.append('hasta', hasta)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/dashboard/exportar?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logicount_reporte_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      setMsg('Reporte descargado exitosamente')
    } catch {
      setMsg('Error al exportar el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display font-800 text-2xl text-white">Reportes exportables</h1>
        <p className="text-white/40 text-sm mt-1">Genera y descarga reportes en Excel</p>
      </div>

      <div className="max-w-lg">
        <div className="card space-y-5">
          <div>
            <p className="font-display font-700 text-white mb-1">Reporte operativo</p>
            <p className="text-white/40 text-xs">Incluye resumen de jornadas y detalle por mensajero</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha desde</label>
              <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha hasta</label>
              <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>

          <p className="text-white/30 text-xs">Si no seleccionas fechas, se exportan todas las jornadas cerradas.</p>

          {msg && (
            <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
              {msg}
            </div>
          )}

          <button onClick={handleExportar} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" /> Generando...</>
            ) : '↓ Exportar Excel'}
          </button>
        </div>

        <div className="card mt-4">
          <p className="font-display font-700 text-white text-sm mb-3">El archivo Excel incluye:</p>
          <ul className="space-y-2 text-white/50 text-sm">
            <li className="flex items-center gap-2"><span className="text-accent">◈</span> Hoja 1: Resumen por jornada</li>
            <li className="flex items-center gap-2"><span className="text-accent">◈</span> Hoja 2: Detalle por mensajero</li>
            <li className="flex items-center gap-2"><span className="text-accent">◈</span> Totales de entregados, devueltos y pendientes</li>
            <li className="flex items-center gap-2"><span className="text-accent">◈</span> Observaciones del cierre</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
