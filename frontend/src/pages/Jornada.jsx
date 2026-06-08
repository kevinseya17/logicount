import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Jornada() {
  const [jornada, setJornada] = useState(null)
  const [mensajeros, setMensajeros] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('idle') // idle | abrir | asignar | cerrar
  const [formAbrir, setFormAbrir] = useState({ fecha: new Date().toISOString().slice(0,10), paquetes_recibidos: '' })
  const [formAsignar, setFormAsignar] = useState({ mensajero_id: '', paquetes_asignados: '' })
  const [formCierre, setFormCierre] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  function refresh() {
    Promise.all([
      api.get('/jornadas/activa'),
      api.get('/mensajeros'),
    ]).then(([j, m]) => {
      setJornada(j.data)
      setMensajeros(m.data.filter(x => x.activo === 1))
    }).finally(() => setLoading(false))
  }
  useEffect(() => { refresh() }, [])

  async function handleAbrir() {
    setErr('')
    try {
      await api.post('/jornadas/abrir', { fecha: formAbrir.fecha, paquetes_recibidos: Number(formAbrir.paquetes_recibidos) })
      setMsg('Jornada abierta exitosamente')
      setStep('idle')
      refresh()
    } catch (e) { setErr(e.response?.data?.error || 'Error') }
  }

  async function handleAsignar() {
    setErr('')
    try {
      await api.post('/jornadas/asignar', {
        jornada_id: jornada.id,
        mensajero_id: formAsignar.mensajero_id,
        paquetes_asignados: Number(formAsignar.paquetes_asignados),
      })
      setMsg('Asignación guardada')
      setFormAsignar({ mensajero_id: '', paquetes_asignados: '' })
      refresh()
    } catch (e) { setErr(e.response?.data?.error || 'Error') }
  }

  async function handleCerrar() {
    setErr('')
    const resultados = jornada.asignaciones.map(a => ({
      mensajero_id: a.mensajero_id,
      entregados: Number(formCierre[a.mensajero_id]?.entregados || 0),
      devueltos: Number(formCierre[a.mensajero_id]?.devueltos || 0),
      pendientes: Number(formCierre[a.mensajero_id]?.pendientes || 0),
    }))
    try {
      await api.post('/jornadas/cerrar', { jornada_id: jornada.id, resultados, observaciones })
      setMsg('Jornada cerrada exitosamente')
      setStep('idle')
      refresh()
    } catch (e) { setErr(e.response?.data?.error || 'Error') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-white">Jornada operativa</h1>
        <p className="text-white/40 text-sm mt-1">Apertura, asignación y cierre diario</p>
      </div>

      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm flex justify-between"><span>✓ {msg}</span><button onClick={() => setMsg('')}>✕</button></div>}
      {err && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between"><span>✕ {err}</span><button onClick={() => setErr('')}>✕</button></div>}

      {/* Estado actual */}
      {jornada ? (
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label">Jornada activa</p>
              <p className="font-display font-800 text-xl text-white">{jornada.fecha}</p>
              <p className="text-white/40 text-sm mt-1">{jornada.paquetes_recibidos} paquetes recibidos</p>
            </div>
            <span className="badge-green">● Abierta</span>
          </div>

          {jornada.asignaciones?.length > 0 && (
            <div className="mt-4 border-t border-white/8 pt-4">
              <p className="label mb-3">Asignaciones actuales</p>
              <div className="space-y-2">
                {jornada.asignaciones.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-navy-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-navy-600 rounded-lg flex items-center justify-center text-accent font-700 text-xs">{a.mensajero_nombre[0]}</div>
                      <span className="text-white text-sm">{a.mensajero_nombre}</span>
                    </div>
                    <span className="badge-blue">{a.paquetes_asignados} paquetes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => { setStep('asignar'); setErr('') }} className="btn-secondary flex-1">Asignar paquetes</button>
            <button onClick={() => { setStep('cerrar'); setErr('') }} className="bg-red-600/20 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-lg hover:bg-red-600/30 transition-all text-sm flex-1">Cerrar jornada</button>
          </div>
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-white/40 text-sm mb-4">No hay jornada activa</p>
          <button onClick={() => { setStep('abrir'); setErr('') }} className="btn-primary">Abrir jornada</button>
        </div>
      )}

      {/* Step: Abrir jornada */}
      {step === 'abrir' && (
        <div className="card">
          <p className="font-display font-700 text-white mb-4">Abrir nueva jornada</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input" value={formAbrir.fecha} onChange={e => setFormAbrir(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div>
              <label className="label">Paquetes recibidos</label>
              <input type="number" className="input" min="0" value={formAbrir.paquetes_recibidos} onChange={e => setFormAbrir(f => ({ ...f, paquetes_recibidos: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleAbrir} className="btn-primary flex-1">Abrir jornada</button>
          </div>
        </div>
      )}

      {/* Step: Asignar */}
      {step === 'asignar' && jornada && (
        <div className="card">
          <p className="font-display font-700 text-white mb-4">Asignar paquetes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Mensajero</label>
              <select className="input" value={formAsignar.mensajero_id} onChange={e => setFormAsignar(f => ({ ...f, mensajero_id: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {mensajeros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cantidad de paquetes</label>
              <input type="number" className="input" min="1" value={formAsignar.paquetes_asignados} onChange={e => setFormAsignar(f => ({ ...f, paquetes_asignados: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')} className="btn-secondary flex-1">Cerrar</button>
            <button onClick={handleAsignar} className="btn-primary flex-1">Asignar</button>
          </div>
        </div>
      )}

      {/* Step: Cerrar */}
      {step === 'cerrar' && jornada && (
        <div className="card">
          <p className="font-display font-700 text-white mb-4">Cierre operativo</p>
          {jornada.asignaciones?.length === 0 ? (
            <p className="text-white/40 text-sm mb-4">No hay asignaciones para cerrar</p>
          ) : (
            <div className="space-y-4 mb-4">
              {jornada.asignaciones.map(a => (
                <div key={a.id} className="bg-navy-700/50 rounded-xl p-4">
                  <p className="font-display font-600 text-white text-sm mb-3">{a.mensajero_nombre} <span className="text-white/40">— {a.paquetes_asignados} asignados</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['entregados', 'devueltos', 'pendientes'].map(k => (
                      <div key={k}>
                        <label className="label">{k}</label>
                        <input type="number" className="input" min="0" value={formCierre[a.mensajero_id]?.[k] || ''}
                          onChange={e => setFormCierre(f => ({ ...f, [a.mensajero_id]: { ...(f[a.mensajero_id] || {}), [k]: e.target.value } }))}
                          placeholder="0" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mb-4">
            <label className="label">Observaciones</label>
            <textarea className="input resize-none h-20" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Notas adicionales..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCerrar} className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-500 transition-all text-sm flex-1 font-display font-600">Confirmar cierre</button>
          </div>
        </div>
      )}
    </div>
  )
}
