import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { LayoutDashboard, LogOut, Menu, X, ChevronRight, MapPin, Calendar, Circle } from 'lucide-react'

const fetchTrips = () => api.get('/trips').then(r => r.data.data)

function tripStatus(trip) {
  const now = new Date(), s = new Date(trip.startDate), e = new Date(trip.endDate)
  if (now >= s && now <= e) return 'ongoing'
  if (now < s) return 'upcoming'
  return 'past'
}

const STATUS_DOT = { ongoing: '#34d399', upcoming: '#60a5fa', past: '#4b5563' }

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  const { data: trips = [] } = useQuery({ queryKey: ['trips'], queryFn: fetchTrips })

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  const isDash = location.pathname === '/dashboard'

  const sidebarStyle = {
    position: 'fixed', top: 0, left: 0, height: '100vh', width: 228,
    background: '#08080f',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', flexDirection: 'column', zIndex: 50,
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07070f', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .sidebar-link:hover { background: rgba(255,255,255,0.05) !important; color: #c0c0d8 !important; }
        .trip-sidebar-item:hover { background: rgba(255,255,255,0.05) !important; }
        .logout-btn:hover { color: #f87171 !important; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%) !important; }
          .sidebar.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
          .mobile-bar { display: flex !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} onClick={() => setOpen(false)} />}

      {/* ── Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`} style={sidebarStyle}>

        {/* Brand */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✈️</div>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#f0f0f5', fontFamily: "'Playfair Display', serif" }}>TripSync</span>
          </Link>
          <button className="close-btn" onClick={() => setOpen(false)} style={{ display: 'none', background: 'none', border: 'none', color: '#606080', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Main nav */}
        <nav style={{ padding: '10px 10px 0' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#353555', letterSpacing: 2, textTransform: 'uppercase', padding: '6px 10px', marginBottom: 4 }}>Navigation</p>
          <Link to="/dashboard" className="sidebar-link" style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
            borderRadius: 9, textDecoration: 'none',
            background: isDash ? 'rgba(79,142,247,0.1)' : 'none',
            borderLeft: `2px solid ${isDash ? '#4f8ef7' : 'transparent'}`,
            color: isDash ? '#90b8f8' : '#606080',
            fontSize: 13, fontWeight: 600, transition: 'all .15s',
          }}>
            <LayoutDashboard size={15} /> My Trips
          </Link>
        </nav>

        {/* ── Trip list in sidebar */}
        {trips.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 10px 8px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#353555', letterSpacing: 2, textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>Your Trips</p>

            {trips.slice(0, 8).map(trip => {
              const status = tripStatus(trip)
              const dot    = STATUS_DOT[status]
              const active = location.pathname === `/trips/${trip._id}`
              const start  = new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
              const end    = new Date(trip.endDate).toLocaleDateString('en',   { month: 'short', day: 'numeric' })

              return (
                <Link key={trip._id} to={`/trips/${trip._id}`} className="trip-sidebar-item" style={{
                  display: 'block', padding: '9px 12px', borderRadius: 10,
                  textDecoration: 'none', marginBottom: 2,
                  background: active ? 'rgba(79,142,247,0.08)' : 'none',
                  border: `1px solid ${active ? 'rgba(79,142,247,0.2)' : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Status dot */}
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: status === 'ongoing' ? `0 0 6px ${dot}` : 'none' }} />
                    {/* Cover thumbnail or gradient circle */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                      background: trip.coverImage ? undefined : 'linear-gradient(135deg,#1e3a5f,#2d1b4e)',
                    }}>
                      {trip.coverImage && <img src={trip.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      {!trip.coverImage && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✈️</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: active ? '#90b8f8' : '#c0c0d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{trip.title}</p>
                      <p style={{ fontSize: 10, color: '#404060', lineHeight: 1.4 }}>{start} – {end}</p>
                    </div>
                    {active && <ChevronRight size={12} color="#4f8ef7" />}
                  </div>

                  {/* Members count */}
                  {active && (
                    <div style={{ marginTop: 8, paddingLeft: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex' }}>
                        {trip.members?.slice(0, 3).map((m, i) => (
                          <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: i > 0 ? -5 : 0, background: `hsl(${[220,270,200][i%3]},55%,48%)`, border: '1.5px solid #08080f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                            {m.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: '#404060' }}>{trip.members?.length} member{trip.members?.length !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: 9, color: dot, marginLeft: 'auto', fontWeight: 600, textTransform: 'capitalize' }}>{status}</span>
                    </div>
                  )}
                </Link>
              )
            })}

            {trips.length > 8 && (
              <Link to="/dashboard" style={{ display: 'block', padding: '7px 12px', fontSize: 11, color: '#404060', textDecoration: 'none', textAlign: 'center' }}>
                +{trips.length - 8} more trips
              </Link>
            )}
          </div>
        )}

        {trips.length === 0 && <div style={{ flex: 1 }} />}

        {/* User profile */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#e0e0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: '#404060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: '#404060', cursor: 'pointer', padding: 4, flexShrink: 0, transition: 'color .15s' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content */}
      <div className="main-content" style={{ flex: 1, marginLeft: 228, minWidth: 0 }}>
        {/* Mobile topbar */}
        <header className="mobile-bar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#08080f', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: '#c0c0d8', cursor: 'pointer' }}><Menu size={20} /></button>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#f0f0f5' }}>TripSync</span>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}