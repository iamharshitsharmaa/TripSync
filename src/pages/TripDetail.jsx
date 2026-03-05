import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import ItineraryBoard from '../components/itinerary/ItineraryBoard'
import MembersPanel from '../components/trip/MembersPanel'
import BudgetPanel from '../components/budget/BudgetPanel'
import ChecklistPanel from '../components/checklist/ChecklistPanel'
import ReservationsPanel from '../components/reservations/ReservationsPanel'
import TripChat from '../components/TripChat'
import { ArrowLeft, Users, Calendar, Wallet, CheckSquare, Hotel, Loader2, MessageCircle } from 'lucide-react'

const TABS = [
  { id: 'itinerary',    label: 'Itinerary',  shortLabel: 'Plan',    icon: Calendar      },
  { id: 'budget',       label: 'Budget',     shortLabel: 'Budget',  icon: Wallet        },
  { id: 'checklists',   label: 'Checklists', shortLabel: 'Lists',   icon: CheckSquare   },
  { id: 'reservations', label: 'Stays',      shortLabel: 'Stays',   icon: Hotel         },
  { id: 'members',      label: 'Members',    shortLabel: 'People',  icon: Users         },
  { id: 'chat',         label: 'Chat',       shortLabel: 'Chat',    icon: MessageCircle },
]

export default function TripDetail() {
  const { id }  = useParams()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('itinerary')
  useSocket(id)

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.get(`/trips/${id}`).then(r => r.data.data),
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#07070f' }}>
      <Loader2 size={28} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (isError || !trip) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, background: '#07070f' }}>
      <p style={{ color: '#606080', fontSize: 14 }}>Trip not found or you don't have access.</p>
      <Link to="/dashboard" style={{ color: '#60a5fa', fontSize: 13 }}>← Back to Dashboard</Link>
    </div>
  )

  const myMember = trip.members?.find(m => m.user?._id === user?._id || m.user === user?._id)
  const role     = myMember?.role || 'viewer'

  const startStr = new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const endStr   = new Date(trip.endDate).toLocaleDateString('en',   { month: 'short', day: 'numeric', year: 'numeric' })

  const roleColor = role === 'owner' ? { bg: 'rgba(234,179,8,0.12)', color: '#facc15' }
    : role === 'editor'              ? { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' }
    :                                  { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#07070f', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Tab bar: scrollable on all screen sizes */
        .trip-tabs { display: flex; overflow-x: auto; gap: 2px; -webkit-overflow-scrolling: touch; scrollbar-width: none }
        .trip-tabs::-webkit-scrollbar { display: none }

        /* On mobile: hide full label, show short label */
        .tab-label-full  { display: inline }
        .tab-label-short { display: none  }

        @media (max-width: 600px) {
          /* Compact header on mobile */
          .trip-header-meta { flex-wrap: wrap; gap: 6px !important }
          .trip-avatars      { display: none !important }

          /* Show short tab labels on mobile */
          .tab-label-full  { display: none  }
          .tab-label-short { display: inline }

          /* Reduce tab padding on mobile */
          .trip-tab-btn { padding: 10px 10px !important; font-size: 11px !important }

          /* Content padding reduced */
          .trip-content { padding: 12px !important }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ background: '#0a0a18', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', flexShrink: 0 }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#505070', textDecoration: 'none', marginBottom: 10 }}>
          <ArrowLeft size={12} /> All Trips
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#f0f0f5', fontFamily: "'Playfair Display', serif", marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.title}
            </h1>
            <div className="trip-header-meta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#606080' }}>
                <Calendar size={10} color="#60a5fa" /> {startStr} – {endStr}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#606080' }}>
                <Users size={10} color="#a855f7" /> {trip.members?.length} member{trip.members?.length !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: roleColor.bg, color: roleColor.color }}>
                {role}
              </span>
            </div>
          </div>

          {/* Member avatars — hidden on mobile via CSS */}
          <div className="trip-avatars" style={{ display: 'flex' }}>
            {trip.members?.slice(0, 4).map((m, i) => (
              <div key={i} title={m.user?.name}
                style={{ width: 30, height: 30, borderRadius: '50%', marginLeft: i > 0 ? -8 : 0, background: `hsl(${[220,270,200,340][i%4]},55%,45%)`, border: '2px solid #0a0a18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {m.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      <div style={{ background: 'rgba(10,10,24,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 8px', flexShrink: 0 }}>
        <div className="trip-tabs">
          {TABS.map(tab => {
            const Icon    = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                className="trip-tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: 'none', border: 'none', borderBottom: `2px solid ${isActive ? '#4f8ef7' : 'transparent'}`, color: isActive ? '#f0f0f5' : '#606080', cursor: 'pointer', transition: 'all .15s', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
              >
                <Icon size={13} />
                <span className="tab-label-full">{tab.label}</span>
                <span className="tab-label-short">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────── */}
      <div
        className="trip-content"
        style={activeTab === 'chat'
          ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
          : { flex: 1, padding: '20px 16px', overflowY: 'auto' }
        }
      >
        {activeTab === 'chat' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 760, width: '100%', margin: '0 auto', height: '100%' }}>
            <TripChat tripId={id} currentUser={user} />
          </div>
        ) : (
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
            {activeTab === 'itinerary'    && <ItineraryBoard trip={trip} role={role} />}
            {activeTab === 'budget'       && <BudgetPanel       tripId={id} role={role} currency={trip.currency} budgetLimit={trip.budgetLimit} />}
            {activeTab === 'checklists'   && <ChecklistPanel    tripId={id} role={role} members={trip.members} />}
            {activeTab === 'reservations' && <ReservationsPanel tripId={id} role={role} />}
            {activeTab === 'members'      && <MembersPanel      trip={trip} role={role} currentUserId={user?._id} />}
          </div>
        )}
      </div>
    </div>
  )
}