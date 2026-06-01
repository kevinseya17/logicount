import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Mensajeros from './pages/Mensajeros'
import Jornada from './pages/Jornada'
import Historial from './pages/Historial'
import Reportes from './pages/Reportes'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="mensajeros" element={<Mensajeros />} />
            <Route path="jornada" element={<Jornada />} />
            <Route path="historial" element={<Historial />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
