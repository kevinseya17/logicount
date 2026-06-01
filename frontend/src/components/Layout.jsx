import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/jornada', label: 'Jornada', icon: '◉' },
  { to: '/mensajeros', label: 'Mensajeros', icon: '◎' },
  { to: '/historial', label: 'Historial', icon: '◷' },
  { to: '/reportes', label: 'Reportes', icon: '◫' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-navy-900">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-800 border-r border-white/8 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-navy-900 font-display font-800 text-lg">L</div>
            <div>
              <p className="font-display font-700 text-white text-sm leading-none">LogiCount</p>
              <p className="text-white/30 text-xs mt-0.5">PackTrack Solutions</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-accent/15 text-accent font-display font-600'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/8">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center text-accent font-display font-700 text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-600 truncate">{user?.username}</p>
              <p className="text-white/30 text-xs capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-white/30 hover:text-red-400 transition-colors text-xs">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
