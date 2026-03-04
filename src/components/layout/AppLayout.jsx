import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { LayoutDashboard, LogOut, Menu, X, ChevronRight } from 'lucide-react'

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07070f', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Mobile overlay */}
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 220,
        background: '#0a0a15', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform 0.2s ease',
      }}
        className="sidebar-desktop"
      >
        {/* Brand */}
        <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-sm">✈</span>
          </div>

          <span className="text-white text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trip
            </span>
            Sync
          </span>
        </div>
          </Link>
          <button onClick={() => setOpen(false)} style={{ display: 'none', background: 'none', border: 'none', color: '#606080', cursor: 'pointer' }} className="close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#404060', letterSpacing: 2, textTransform: 'uppercase', padding: '4px 10px', marginBottom: 4 }}>Navigation</p>
          <Link to="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
            background: isActive('/dashboard') ? 'rgba(79,142,247,0.1)' : 'none',
            borderLeft: `2px solid ${isActive('/dashboard') ? '#4f8ef7' : 'transparent'}`,
            color: isActive('/dashboard') ? '#90b8f8' : '#606080',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (!isActive('/dashboard')) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#c0c0d8' } }}
            onMouseLeave={e => { if (!isActive('/dashboard')) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#606080' } }}
          >
            <LayoutDashboard size={15} /> My Trips
          </Link>
        </nav>

        {/* User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#e0e0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: '#404060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: '#404060', cursor: 'pointer', padding: 2, flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#404060'}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 220 }}>
        {/* Mobile topbar */}
        <header style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#0a0a15', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }} className="mobile-header">
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: '#c0c0d8', cursor: 'pointer' }}><Menu size={20} /></button>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#f0f0f5' }}>TripSync</span>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>

        <style>{`
          @media (max-width: 768px) {
            .sidebar-desktop { transform: translateX(-100%); }
            .sidebar-desktop.open { transform: translateX(0); }
            .close-btn { display: flex !important; }
            .mobile-header { display: flex !important; }
            div[style*="margin-left: 220px"] { margin-left: 0 !important; }
          }
        `}</style>

        {children}
      </div>
    </div>
  )
}