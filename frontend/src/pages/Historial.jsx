import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Historial() {
  const [jornadas, setJornadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get('/jornadas').then(r => setJornadas(r.data)).finally(() => setLoading(false))
  }, [])

  async function loadDetail(id) {
    setDetail(null)
    setSelected(id)
    const r = await api.get(`/jornadas/${id}`)
    setDetail(r.data)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-display font-800 text-2xl text-white">Historial operativo</h1>
        <p className="text-white/40 text-sm mt-1">Registro de todas las jornadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lista */}
        <div className="lg:col-span-2 card p-0 overflow-hidden h-fit">
          {loading ? (
            <div className="py-12 text-center text-white/30 text-sm">Cargando...</div>
          ) : jornadas.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">Sin jornadas registradas</div>
          ) : jornadas.map(j => (
            <button
              key={j.id}
              onClick={() => loadDetail(j.id)}
              className={`w-full text-left px-5 py-4 border-b border-white/5 hover:bg-white/4 transition-colors ${selected === j.id ? 'bg-accent/8 border-l-2 border-l-accent' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-700 text-white text-sm">{j.fecha}</span>
                <span className={j.estado === 'cerrada' ? 'badge-green text-xs' : 'badge-yellow text-xs'}>
                  {j.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>↑ {j.paquetes_recibidos} recibidos</span>
                {j.total_entregados != null && <span className="text-emerald-400">✓ {j.total_entregados}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Detalle */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card h-64 flex items-center justify-center text-white/20 text-sm">
              Selecciona una jornada para ver el detalle
            </div>
          ) : !detail ? (
            <div className="card h-64 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="label">Jornada</p>
                    <p className="font-display font-800 text-xl text-white">{detail.fecha}</p>
                  </div>
                  <span className={detail.estado === 'cerrada' ? 'badge-green' : 'badge-yellow'}>
                    {detail.estado}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { l: 'Recibidos', v: detail.paquetes_recibidos, c: 'text-blue-400' },
                    { l: 'Entregados', v: detail.total_entregados ?? '—', c: 'text-emerald-400' },
                    { l: 'Devueltos', v: detail.total_devueltos ?? '—', c: 'text-red-400' },
                    { l: 'Pendientes', v: detail.total_pendientes ?? '—', c: 'text-amber-400' },
                  ].map(s => (
                    <div key={s.l} className="bg-navy-700/60 rounded-xl p-3 text-center">
                      <p className={`font-display font-800 text-xl ${s.c}`}>{s.v}</p>
                      <p className="text-white/40 text-xs mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
                {detail.observaciones && (
                  <p className="mt-4 text-white/50 text-sm bg-navy-700/40 rounded-xl p-3">{detail.observaciones}</p>
                )}
              </div>

              {detail.asignaciones?.length > 0 && (
                <div className="card p-0 overflow-hidden mt-4">
                  <p className="font-display font-700 text-white px-5 py-4 border-b border-white/8">Detalle por mensajero</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                      <tr className="border-b border-white/5">
                        {['Mensajero', 'Asignados', 'Entregados', 'Devueltos', 'Pendientes'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-white/30 font-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.asignaciones.map(a => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/2">
                          <td className="px-5 py-3 text-white font-500">{a.mensajero_nombre}</td>
                          <td className="px-5 py-3 text-blue-400">{a.paquetes_asignados}</td>
                          <td className="px-5 py-3 text-emerald-400">{a.paquetes_entregados}</td>
                          <td className="px-5 py-3 text-red-400">{a.paquetes_devueltos}</td>
                          <td className="px-5 py-3 text-amber-400">{a.paquetes_pendientes}</td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
