import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { LayoutDashboard, LogOut, Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const W = 210

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const { T, dark, toggle } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  const isDash = location.pathname === '/dashboard'

  const SidebarInner = ({ isMobile = false }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Logo ── */}
      <div style={{ padding:'16px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <div style={{ width:30, height:30, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>✈️</div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color:T.text, whiteSpace:'nowrap' }}>TripSync</span>
        </Link>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)}
            style={{ width:28, height:28, borderRadius:7, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMid, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={13}/>
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding:'10px 10px 6px', flexShrink:0 }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:2.2, textTransform:'uppercase', color:T.textMuted, padding:'0 10px', marginBottom:6, display:'block' }}>
          Navigation
        </span>
        <Link to="/dashboard" onClick={() => setMobileOpen(false)}
          style={{
            display:'flex', alignItems:'center', gap:9, padding:'9px 12px',
            borderRadius:9, textDecoration:'none', fontWeight:600, fontSize:13,
            transition:'all .15s',
            background:  isDash ? T.activeBg  : 'none',
            color:       isDash ? T.deepTeal  : T.textMuted,
            borderLeft: `2px solid ${isDash ? T.deepTeal : 'transparent'}`,
          }}
          onMouseEnter={e => { if (!isDash) { e.currentTarget.style.background=T.bgAlt; e.currentTarget.style.color=T.textMid } }}
          onMouseLeave={e => { if (!isDash) { e.currentTarget.style.background='none';  e.currentTarget.style.color=T.textMuted } }}>
          <LayoutDashboard size={14}/> My Trips
        </Link>
      </nav>

      <div style={{ flex:1 }}/>

      {/* ── Theme toggle ── */}
      <div style={{ padding:'0 10px 8px', flexShrink:0 }}>
        <button onClick={toggle}
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:9,
            padding:'9px 12px', borderRadius:9, border:`1px solid ${T.border}`,
            background:'none', color:T.textMuted, fontSize:13, fontWeight:500,
            cursor:'pointer', transition:'all .2s', fontFamily:"'DM Sans',sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background=T.bgAlt; e.currentTarget.style.color=T.deepTeal; e.currentTarget.style.borderColor=T.deepTeal }}
          onMouseLeave={e => { e.currentTarget.style.background='none';  e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
          {dark ? <Sun size={14}/> : <Moon size={14}/>}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      {/* ── User + logout ── */}
      <div style={{ padding:'8px 10px 12px', borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:10, background:T.sidebarAlt, border:`1px solid ${T.border}` }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0, overflow:'hidden' }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
              : user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
            <p style={{ fontSize:10, color:T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Log out"
            style={{ background:'none', border:'none', color:T.textMuted, cursor:'pointer', padding:4, display:'flex', alignItems:'center', transition:'color .15s', flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
            onMouseLeave={e => e.currentTarget.style.color=T.textMuted}>
            <LogOut size={14}/>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", transition:'background .25s, color .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }

        .ts-sidebar {
          position:fixed; top:0; left:0; height:100vh; width:${W}px;
          background:${T.sidebar}; border-right:1px solid ${T.border};
          z-index:50; transition:background .25s, border-color .25s;
          box-shadow: 2px 0 16px ${T.shadow};
        }
        .ts-main { margin-left:${W}px; flex:1; min-width:0; }
        .ts-topbar { display:none; }

        .ts-drawer {
          position:fixed; top:0; left:0; height:100vh; width:${W}px;
          background:${T.sidebar}; border-right:1px solid ${T.border};
          z-index:60; transform:translateX(-100%);
          transition:transform .22s cubic-bezier(.4,0,.2,1), background .25s;
          box-shadow:4px 0 24px ${T.shadow};
        }
        .ts-drawer.open { transform:translateX(0); }

        @media(max-width:768px){
          .ts-sidebar { display:none; }
          .ts-main    { margin-left:0; }
          .ts-topbar  { display:flex !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(14,26,28,0.5)', zIndex:55, backdropFilter:'blur(3px)' }}/>
      )}

      {/* Desktop sidebar */}
      <aside className="ts-sidebar" style={{ background:T.sidebar, borderRight:`1px solid ${T.border}` }}>
        <SidebarInner/>
      </aside>

      {/* Mobile drawer */}
      <aside className={`ts-drawer${mobileOpen?' open':''}`} style={{ background:T.sidebar, borderRight:`1px solid ${T.border}` }}>
        <SidebarInner isMobile/>
      </aside>

      {/* Main */}
      <div className="ts-main" style={{ background:T.bg, minHeight:'100vh', transition:'background .25s' }}>

        {/* Mobile topbar */}
        <header className="ts-topbar"
          style={{ alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:52,
            background:T.sidebar, borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, zIndex:30,
            transition:'background .25s, border-color .25s' }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:9, color:T.textMid, cursor:'pointer' }}>
            <Menu size={16}/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:24, height:24, background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✈️</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:700, color:T.text }}>TripSync</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <button onClick={toggle}
              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMid, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              {dark ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', overflow:'hidden' }}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : user?.name?.[0]?.toUpperCase()||'U'}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}