import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import { useTheme } from '../context/ThemeContext'
import ItineraryBoard from '../components/itinerary/ItineraryBoard'
import MembersPanel from '../components/trip/MembersPanel'
import BudgetPanel from '../components/budget/BudgetPanel'
import ChecklistPanel from '../components/checklist/ChecklistPanel'
import ReservationsPanel from '../components/reservations/ReservationsPanel'
import TripChat from '../components/TripChat'
import {
  ArrowLeft, Users, Calendar, Wallet,
  CheckSquare, Hotel, Loader2, MessageCircle,
  MapPin, Clock,
} from 'lucide-react'

const TABS = [
  { id: 'itinerary',    label: 'Itinerary',   shortLabel: 'Plan',   icon: Calendar      },
  { id: 'budget',       label: 'Budget',       shortLabel: 'Budget', icon: Wallet        },
  { id: 'checklists',   label: 'Checklists',   shortLabel: 'Lists',  icon: CheckSquare   },
  { id: 'reservations', label: 'Reservations', shortLabel: 'Stays',  icon: Hotel         },
  { id: 'members',      label: 'Members',      shortLabel: 'People', icon: Users         },
  { id: 'chat',         label: 'Chat',         shortLabel: 'Chat',   icon: MessageCircle },
]

function tripStatus(trip) {
  if (trip.status === 'archived') return 'archived'
  const now = new Date(), s = new Date(trip.startDate), e = new Date(trip.endDate)
  if (now >= s && now <= e) return 'ongoing'
  if (now < s) return 'upcoming'
  return 'past'
}

export default function TripDetail() {
  const { id }   = useParams()
  const { user } = useAuthStore()
  const { T }    = useTheme()
  const [activeTab, setActiveTab] = useState('itinerary')
  useSocket(id)

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.get(`/trips/${id}`).then(r => r.data.data),
  })

  /* ── Loading ── */
  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:T.bg }}>
      <Loader2 size={26} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  /* ── Error ── */
  if (isError || !trip) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16, background:T.bg }}>
      <div style={{ width:56, height:56, borderRadius:16, background:`${T.deepTeal}12`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🗺️</div>
      <p style={{ color:T.textMuted, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>Trip not found or you don't have access.</p>
      <Link to="/dashboard" style={{ color:T.deepTeal, fontSize:13, fontFamily:"'DM Sans',sans-serif", textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
        <ArrowLeft size={13}/> Back to Dashboard
      </Link>
    </div>
  )

  const myMember = trip.members?.find(m => m.user?._id === user?._id || m.user === user?._id)
  const role     = myMember?.role || 'viewer'
  const status   = tripStatus(trip)

  const startStr = new Date(trip.startDate).toLocaleDateString('en', { month:'short', day:'numeric' })
  const endStr   = new Date(trip.endDate).toLocaleDateString('en',   { month:'short', day:'numeric', year:'numeric' })

  const daysLeft = Math.ceil((new Date(trip.startDate) - new Date()) / 86400000)
  const totalDays = trip.days?.length || 0

  const ROLE_CFG = {
    owner:  { bg:`${T.sage}18`,     color:T.sage,     label:'Owner'  },
    editor: { bg:`${T.skyTeal}18`,  color:T.skyTeal,  label:'Editor' },
    viewer: { bg:`${T.textMuted}14`,color:T.textMuted,label:'Viewer' },
  }
  const roleCfg = ROLE_CFG[role] || ROLE_CFG.viewer

  const STATUS_CFG = {
    ongoing:  { color:T.sage,    label:'Live now',  dot:true  },
    upcoming: { color:T.skyTeal, label:`${daysLeft > 0 ? daysLeft+'d away' : 'Starting soon'}`, dot:false },
    past:     { color:T.textMuted,label:'Completed', dot:false },
    archived: { color:T.textMuted,label:'Archived',  dot:false },
  }
  const statusCfg = STATUS_CFG[status] || STATUS_CFG.past

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", transition:'background .25s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }

        .trip-tabs { display:flex; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none }
        .trip-tabs::-webkit-scrollbar { display:none }

        .trip-tab-btn {
          display:flex; align-items:center; gap:7px;
          padding:0 18px; height:46px;
          font-size:13px; font-weight:600; white-space:nowrap;
          background:none; border:none; border-bottom:2px solid transparent;
          cursor:pointer; transition:all .15s;
          font-family:'DM Sans',sans-serif; flex-shrink:0;
        }

        .tab-label-short { display:none }
        @media(max-width:600px) {
          .tab-label-full  { display:none }
          .tab-label-short { display:inline }
          .trip-tab-btn    { padding:0 12px; font-size:11px }
          .trip-header-details { display:none !important }
          .trip-cover { height:120px !important }
        }
      `}</style>

      {/* ══ HERO HEADER ══════════════════════════════════════════ */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.border}`, flexShrink:0, transition:'background .25s, border-color .25s' }}>

        {/* Cover strip */}
        <div className="trip-cover" style={{ height:160, position:'relative', overflow:'hidden',
          background: trip.coverImage ? undefined : `linear-gradient(135deg,${T.deepTeal},${T.skyTeal}88,${T.sage}66)` }}>
          {trip.coverImage && (
            <img src={trip.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          )}
          {/* Gradient scrim bottom */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, transparent 30%, ${T.bgCard} 100%)` }} />

          {/* Back link — top left */}
          <Link to="/dashboard"
            style={{ position:'absolute', top:14, left:16, display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#fff', textDecoration:'none', background:'rgba(22,34,36,0.5)', padding:'5px 11px', borderRadius:8, backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', transition:'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(22,34,36,0.75)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(22,34,36,0.5)'}>
            <ArrowLeft size={12}/> All Trips
          </Link>

          {/* Status pill — top right */}
          <span style={{ position:'absolute', top:14, right:16, display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#fff', background:'rgba(22,34,36,0.55)', padding:'4px 10px', borderRadius:20, backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)' }}>
            {status === 'ongoing' && <span style={{ width:6, height:6, borderRadius:'50%', background:T.sage, display:'inline-block', animation:'pulse 1.5s ease-in-out infinite' }}/>}
            {statusCfg.label}
          </span>
        </div>

        {/* Info row below cover */}
        <div style={{ padding:'0 20px 16px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, marginTop:-8, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(22px,3vw,30px)', fontWeight:700, color:T.text, marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.1 }}>
              {trip.title}
            </h1>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10 }}>
              {/* Dates */}
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:T.textMuted }}>
                <Calendar size={11} color={T.skyTeal}/> {startStr} – {endStr}
              </span>
              {/* Days */}
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:T.textMuted }}>
                <Clock size={11} color={T.sage}/> {totalDays} day{totalDays !== 1 ? 's' : ''}
              </span>
              {/* Budget */}
              {trip.budgetLimit > 0 && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:T.textMuted }}>
                  <Wallet size={11} color={T.deepTeal}/> {trip.currency} {trip.budgetLimit.toLocaleString()}
                </span>
              )}
              {/* Role badge */}
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:roleCfg.bg, color:roleCfg.color, textTransform:'capitalize', letterSpacing:.4 }}>
                {roleCfg.label}
              </span>
            </div>
          </div>

          {/* Member avatars */}
          <div className="trip-header-details" style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center' }}>
              {trip.members?.slice(0, 5).map((m, i) => (
                <div key={i} title={m.user?.name}
                  style={{ width:32, height:32, borderRadius:'50%', marginLeft:i>0?-9:0,
                    background:[`${T.deepTeal}cc`,`${T.sage}cc`,`${T.skyTeal}cc`,`${T.deepTeal}99`,`${T.sage}99`][i%5],
                    border:`2.5px solid ${T.bgCard}`, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:800, color:'#fff', flexShrink:0, zIndex:5-i }}>
                  {m.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
            </div>
            <span style={{ fontSize:12, color:T.textMuted }}>{trip.members?.length} member{trip.members?.length!==1?'s':''}</span>
          </div>
        </div>
      </div>

      {/* ══ TAB BAR ══════════════════════════════════════════════ */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.border}`, flexShrink:0, transition:'background .25s' }}>
        <div className="trip-tabs" style={{ padding:'0 12px' }}>
          {TABS.map(tab => {
            const Icon    = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} className="trip-tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  color:       isActive ? T.deepTeal   : T.textMuted,
                  borderBottom:`2px solid ${isActive ? T.deepTeal : 'transparent'}`,
                  background: isActive ? `${T.deepTeal}07` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color=T.textMid; e.currentTarget.style.background=T.bgAlt } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.background='none' } }}>
                <Icon size={13}/>
                <span className="tab-label-full">{tab.label}</span>
                <span className="tab-label-short">{tab.shortLabel}</span>
                {/* Unread indicator could go here */}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════ */}
      <div
        style={activeTab === 'chat'
          ? { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg }
          : { flex:1, padding:'24px 20px', overflowY:'auto', background:T.bg }
        }>
        {activeTab === 'chat' ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', maxWidth:760, width:'100%', margin:'0 auto', height:'100%' }}>
            <TripChat tripId={id} currentUser={user} />
          </div>
        ) : (
          <div style={{ maxWidth:1280, margin:'0 auto', width:'100%' }}>
            {activeTab === 'itinerary'    && <ItineraryBoard     trip={trip}  role={role} />}
            {activeTab === 'budget'       && <BudgetPanel tripId={id} role={role} currency={trip.currency} budgetLimit={trip.budgetLimit} members={trip.members || []} />}
            {activeTab === 'checklists'   && <ChecklistPanel     tripId={id}  role={role} members={trip.members} />}
            {activeTab === 'reservations' && <ReservationsPanel  tripId={id}  role={role} />}
            {activeTab === 'members'      && <MembersPanel       trip={trip}  role={role} currentUserId={user?._id} />}
          </div>
        )}
      </div>
    </div>
  )
}