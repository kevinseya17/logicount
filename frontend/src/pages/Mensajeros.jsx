import { useState, useEffect } from 'react'
import api from '../services/api'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="font-display font-700 text-white">{title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function Mensajeros() {
  const [mensajeros, setMensajeros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function fetchAll() {
    api.get('/mensajeros').then(r => setMensajeros(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { fetchAll() }, [])

  function openCreate() {
    setForm({ nombre: '', cedula: '', telefono: '' })
    setEditing(null)
    setError('')
    setModal('form')
  }

  function openEdit(m) {
    setForm({ nombre: m.nombre, cedula: m.cedula, telefono: m.telefono || '' })
    setEditing(m)
    setError('')
    setModal('form')
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/mensajeros/${editing.id}`, form)
      } else {
        await api.post('/mensajeros', form)
      }
      setModal(null)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(m) {
    await api.patch(`/mensajeros/${m.id}/toggle`)
    fetchAll()
  }

  async function handleDelete(m) {
    if (!confirm(`¿Eliminar a ${m.nombre}?`)) return
    await api.delete(`/mensajeros/${m.id}`)
    fetchAll()
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-800 text-2xl text-white">Mensajeros</h1>
          <p className="text-white/40 text-sm mt-1">Gestión del equipo de reparto</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto">+ Nuevo mensajero</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-6 py-4 text-white/40 font-display font-600 text-xs uppercase tracking-widest">Nombre</th>
              <th className="text-left px-6 py-4 text-white/40 font-display font-600 text-xs uppercase tracking-widest">Cédula</th>
              <th className="text-left px-6 py-4 text-white/40 font-display font-600 text-xs uppercase tracking-widest">Teléfono</th>
              <th className="text-left px-6 py-4 text-white/40 font-display font-600 text-xs uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-white/30">Cargando...</td></tr>
            ) : mensajeros.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-white/30">No hay mensajeros registrados</td></tr>
            ) : mensajeros.map((m, i) => (
              <tr key={m.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center text-accent font-display font-700 text-sm">
                      {m.nombre[0]}
                    </div>
                    <span className="text-white font-500">{m.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60">{m.cedula}</td>
                <td className="px-6 py-4 text-white/60">{m.telefono || '—'}</td>
                <td className="px-6 py-4">
                  {m.activo ? <span className="badge-green">● Activo</span> : <span className="badge-red">● Inactivo</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(m)} className="btn-secondary py-1.5 px-3 text-xs">Editar</button>
                    <button onClick={() => handleToggle(m)} className="btn-secondary py-1.5 px-3 text-xs">
                      {m.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDelete(m)} className="btn-danger py-1.5 px-3 text-xs">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Editar mensajero' : 'Nuevo mensajero'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="label">Cédula</label>
              <input className="input" value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} placeholder="12345678" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="3001234567" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
