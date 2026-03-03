import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { LayoutDashboard, Map, LogOut, Menu, X, ChevronRight } from 'lucide-react'

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800
        flex flex-col z-30 transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Brand */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">✈️</div>
            <span className="font-bold text-white text-lg">TripSync</span>
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1">
          <Link to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition
              ${location.pathname === '/dashboard'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <LayoutDashboard size={16} />
            My Trips
          </Link>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition flex-shrink-0" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-10 flex items-center justify-between
          px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400">
            <Menu size={20} />
          </button>
          <span className="font-bold text-white">TripSync</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
