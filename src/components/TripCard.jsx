import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, MapPin, Wallet, ChevronRight, ImagePlus } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const GRADIENTS = [
  'linear-gradient(135deg,#1C6B72,#3E5A5C)',
  'linear-gradient(135deg,#3E5A5C,#4a6a50)',
  'linear-gradient(135deg,#2a6060,#1C6B72)',
  'linear-gradient(135deg,#4a5a3a,#3E5A5C)',
  'linear-gradient(135deg,#1a5060,#2a6858)',
]

function tripStatus(trip) {
  if (trip.status === 'archived') return 'archived'
  const now = new Date(), s = new Date(trip.startDate), e = new Date(trip.endDate)
  if (now >= s && now <= e) return 'ongoing'
  if (now < s) return 'upcoming'
  return 'past'
}

export default function TripCard({ trip }) {
  const navigate = useNavigate()
  const { T } = useTheme()

  const role = trip.members?.find(
    m => m.user?.toString() === trip.owner?._id?.toString()
  )?.role || 'viewer'

  const duration = Math.ceil(
    (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
  ) + 1

  const status = tripStatus(trip)
  const grad   = GRADIENTS[parseInt(trip._id?.slice(-2), 16) % GRADIENTS.length]
  const daysLeft = Math.ceil((new Date(trip.startDate) - new Date()) / 86400000)

  const STATUS_CFG = {
    ongoing:  { label: 'Live',     color: T.sage,     bg: `${T.sage}18`,     border: `${T.sage}40`     },
    upcoming: { label: 'Upcoming', color: T.skyTeal,  bg: `${T.skyTeal}18`,  border: `${T.skyTeal}40`  },
    past:     { label: 'Past',     color: T.textMuted, bg:`${T.textMuted}12`, border:`${T.textMuted}28` },
    archived: { label: 'Archived', color: T.textMuted, bg:`${T.textMuted}12`, border:`${T.textMuted}28` },
    active:   { label: 'Active',   color: T.sage,     bg: `${T.sage}18`,     border: `${T.sage}40`     },
    draft:    { label: 'Draft',    color: '#d97706',  bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)' },
  }

  const ROLE_CFG = {
    owner:  { color: T.sage    },
    editor: { color: T.skyTeal },
    viewer: { color: T.textMuted },
  }

  const scfg   = STATUS_CFG[status] || STATUS_CFG[trip.status] || STATUS_CFG.past
  const rcfg   = ROLE_CFG[role] || ROLE_CFG.viewer

  return (
    <div
      onClick={() => navigate(`/trips/${trip._id}`)}
      style={{
        background:   T.bgCard,
        border:       `1px solid ${T.borderCard}`,
        borderRadius: 16,
        overflow:     'hidden',
        cursor:       'pointer',
        transition:   'transform .2s, box-shadow .2s, border-color .2s',
        fontFamily:   "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform    = 'translateY(-3px)'
        e.currentTarget.style.boxShadow    = `0 10px 32px ${T.shadow}`
        e.currentTarget.style.borderColor  = `${T.deepTeal}40`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform    = 'translateY(0)'
        e.currentTarget.style.boxShadow    = 'none'
        e.currentTarget.style.borderColor  = T.borderCard
      }}
    >
      {/* ── Cover ── */}
      <div style={{
        height:     140,
        background: trip.coverImage ? undefined : grad,
        position:   'relative',
        overflow:   'hidden',
      }}>
        {trip.coverImage && (
          <img src={trip.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        )}
        {/* scrim */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(22,34,36,.6) 0%, transparent 55%)' }} />

        {/* Status badge */}
        <span style={{
          position:'absolute', top:11, left:12,
          fontSize:10, fontWeight:700, letterSpacing:.4,
          padding:'3px 9px', borderRadius:100,
          background: scfg.bg, color: scfg.color, border:`1px solid ${scfg.border}`,
          fontFamily:"'DM Sans',sans-serif",
          display:'flex', alignItems:'center', gap:5,
        }}>
          {status === 'ongoing' && (
            <span style={{ width:5, height:5, borderRadius:'50%', background:T.sage, display:'inline-block',
              animation:'ts-pulse 1.5s ease-in-out infinite' }} />
          )}
          {scfg.label}
        </span>

        {/* Countdown / live tag */}
        {status === 'upcoming' && daysLeft > 0 && daysLeft <= 60 && (
          <span style={{ position:'absolute', bottom:10, right:11, fontSize:10, color:'#fff',
            background:`${T.skyTeal}cc`, padding:'2px 8px', borderRadius:6, fontWeight:600 }}>
            {daysLeft}d away
          </span>
        )}
        {status === 'ongoing' && (
          <span style={{ position:'absolute', bottom:10, right:11, fontSize:10, color:'#fff',
            background:`${T.sage}cc`, padding:'2px 8px', borderRadius:6, fontWeight:600,
            display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#fff', display:'inline-block' }}/>
            In progress
          </span>
        )}

        {/* No cover placeholder */}
        {!trip.coverImage && (
          <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
            display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:7,
            background:'rgba(22,34,36,0.4)', border:'1px dashed rgba(255,255,255,0.2)',
            color:'rgba(255,255,255,0.45)', fontSize:11, whiteSpace:'nowrap', pointerEvents:'none' }}>
            <ImagePlus size={10}/> Add cover
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding:'14px 15px 16px' }}>
        <h3 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:16, fontWeight:700, color:T.text,
          marginBottom:3, lineHeight:1.2, letterSpacing:'-.2px',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {trip.title}
        </h3>

        {trip.description && (
          <p style={{ fontSize:12, color:T.textMuted, marginBottom:10, lineHeight:1.5,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {trip.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:9, fontSize:12, color:T.textMuted, marginBottom:13 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Calendar size={11} color={T.skyTeal}/>
            {format(new Date(trip.startDate), 'dd MMM')} – {format(new Date(trip.endDate), 'dd MMM yyyy')}
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <MapPin size={11} color={T.sage}/>
            {duration} day{duration !== 1 ? 's' : ''}
          </span>
          {trip.budgetLimit > 0 && (
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Wallet size={11} color={T.deepTeal}/>
              {trip.currency} {trip.budgetLimit.toLocaleString()}
            </span>
          )}
        </div>

        {/* Bottom row: avatars + role + chevron */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {/* Avatars */}
            <div style={{ display:'flex' }}>
              {trip.members?.slice(0, 5).map((m, i) => (
                <div key={m._id || i} title={m.user?.name}
                  style={{
                    width:24, height:24, borderRadius:'50%',
                    marginLeft: i > 0 ? -7 : 0,
                    background: [`${T.deepTeal}cc`,`${T.sage}cc`,`${T.skyTeal}cc`,`${T.deepTeal}99`,`${T.sage}99`][i%5],
                    border:`2px solid ${T.bgCard}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700, color:'#fff', flexShrink:0,
                    overflow:'hidden',
                  }}>
                  {m.user?.avatar
                    ? <img src={m.user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
                    : m.user?.name?.[0]?.toUpperCase() || '?'
                  }
                </div>
              ))}
            </div>
            <span style={{ fontSize:11, color:T.textMuted }}>
              {trip.members?.length} member{trip.members?.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {/* Role pill */}
            <span style={{ fontSize:10, fontWeight:700, color:rcfg.color,
              background:`${rcfg.color}14`, padding:'2px 8px', borderRadius:20,
              textTransform:'capitalize', letterSpacing:.3 }}>
              {role}
            </span>
            <ChevronRight size={13} color={T.textMuted}/>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ts-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}