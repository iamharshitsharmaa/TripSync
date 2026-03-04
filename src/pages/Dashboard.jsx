import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import {
  Plus, MapPin, Calendar, ChevronRight, Loader2, Hash,
  Trash2, MoreVertical, Search, Filter, Globe2,
  Users, Wallet, Star, Archive, RefreshCw, Edit3,
  TrendingUp, Clock, CheckSquare
} from 'lucide-react'

const fetchTrips = () => api.get('/trips').then(r => r.data.data)

// ── Helpers
function daysUntil(date) {
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
function tripStatus(trip) {
  const now   = new Date()
  const start = new Date(trip.startDate)
  const end   = new Date(trip.endDate)
  if (now >= start && now <= end) return 'ongoing'
  if (now < start) return 'upcoming'
  return 'past'
}

const STATUS_CONFIG = {
  ongoing:  { label: 'Ongoing',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)' },
  upcoming: { label: 'Upcoming', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)' },
  past:     { label: 'Past',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.2)' },
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#1e3a5f,#2d1b4e)',
  'linear-gradient(135deg,#1a4a2e,#0f2a4a)',
  'linear-gradient(135deg,#4a1a2e,#1a1a4a)',
  'linear-gradient(135deg,#3a2a0a,#1a3a2e)',
  'linear-gradient(135deg,#2a1a4a,#0a2a3a)',
]

// ── Trip Card
function TripCard({ trip, onDelete, onArchive, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = tripStatus(trip)
  const cfg    = STATUS_CONFIG[status]
  const daysLeft = daysUntil(trip.startDate)
  const start  = new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const end    = new Date(trip.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  const gradIdx = trip._id?.charCodeAt(0) % COVER_GRADIENTS.length || 0
  const myRole = trip.members?.find(m => m.user?._id || m.user)?.role || 'viewer'

  return (
    <div style={{
      background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s',
      position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Cover */}
      <div style={{ height: 120, background: trip.coverImage ? undefined : COVER_GRADIENTS[gradIdx], position: 'relative', overflow: 'hidden' }}>
        {trip.coverImage && <img src={trip.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d1a 0%, transparent 60%)' }} />

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 12, left: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        </div>

        {/* 3-dot menu */}
        <div style={{ position: 'absolute', top: 8, right: 10 }}>
          <button onClick={(e) => { e.preventDefault(); setMenuOpen(p => !p) }}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 34, right: 0, zIndex: 50,
              background: '#16162a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '6px', minWidth: 160,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              {[
                { icon: Edit3,   label: 'Edit trip',      color: '#c0c0d8', action: () => { onEdit(trip); setMenuOpen(false) } },
                { icon: Archive, label: 'Archive',         color: '#f59e0b', action: () => { onArchive(trip._id); setMenuOpen(false) } },
                { icon: Trash2,  label: 'Delete trip',     color: '#f87171', action: () => { onDelete(trip._id); setMenuOpen(false) } },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 12px', borderRadius: 8, border: 'none',
                  background: 'none', color: item.color, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'background 0.1s', textAlign: 'left',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <item.icon size={13} /> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Days countdown */}
        {status === 'upcoming' && daysLeft > 0 && daysLeft <= 30 && (
          <div style={{ position: 'absolute', bottom: 12, right: 14 }}>
            <span style={{ fontSize: 10, color: '#60a5fa', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.2)', padding: '2px 8px', borderRadius: 6 }}>
              {daysLeft}d away
            </span>
          </div>
        )}
        {status === 'ongoing' && (
          <div style={{ position: 'absolute', bottom: 12, right: 14 }}>
            <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              In progress
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <Link to={`/trips/${trip._id}`} style={{ display: 'block', padding: '16px 18px 18px', textDecoration: 'none', color: 'inherit' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 4, letterSpacing: '-0.3px', fontFamily: "'Playfair Display', serif" }}>{trip.title}</h3>
        {trip.description && <p style={{ fontSize: 12, color: '#606080', marginBottom: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.description}</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#707090', marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} color="#60a5fa" /> {start} – {end}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} color="#a855f7" /> {trip.days?.length || 0} days</span>
          {trip.budgetLimit > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Wallet size={11} color="#f59e0b" /> {trip.currency} {trip.budgetLimit.toLocaleString()}</span>
          )}
        </div>

        {/* Members + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex' }}>
              {trip.members?.slice(0, 4).map((m, i) => (
                <div key={i} title={m.user?.name} style={{
                  width: 26, height: 26, borderRadius: '50%', marginLeft: i > 0 ? -8 : 0,
                  background: `hsl(${(i * 60) + 220},60%,45%)`,
                  border: '2px solid #0d0d1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {m.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#505070' }}>
              {trip.members?.length} member{trip.members?.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronRight size={15} color="#404060" />
        </div>
      </Link>
    </div>
  )
}

// ── Create / Edit Trip Modal
function TripModal({ existing, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    title:       existing?.title || '',
    description: existing?.description || '',
    startDate:   existing?.startDate ? existing.startDate.split('T')[0] : '',
    endDate:     existing?.endDate   ? existing.endDate.split('T')[0]   : '',
    currency:    existing?.currency  || 'USD',
    budgetLimit: existing?.budgetLimit || '',
  })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => isEdit
      ? api.patch(`/trips/${existing._id}`, data).then(r => r.data.data)
      : api.post('/trips', data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      toast.success(isEdit ? 'Trip updated!' : 'Trip created! 🎉')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (new Date(form.startDate) > new Date(form.endDate)) return toast.error('Start date must be before end date')
    mutate({ ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), budgetLimit: Number(form.budgetLimit) || 0 })
  }

  const ic = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#f0f0f5', fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{isEdit ? 'Edit Trip' : 'New Trip ✈️'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#606080', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Trip Name *</label>
              <input placeholder="e.g. Jaipur Heritage Trail" required style={ic}
                onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                value={form.title} onChange={set('title')} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Description</label>
              <input placeholder="Optional tagline for your trip" style={ic}
                onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                value={form.description} onChange={set('description')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Start Date *</label>
                <input type="date" required style={ic}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  value={form.startDate} onChange={set('startDate')} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>End Date *</label>
                <input type="date" required style={ic}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  value={form.endDate} onChange={set('endDate')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Currency</label>
                <select style={{ ...ic, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  value={form.currency} onChange={set('currency')}>
                  {[['USD','$ USD'],['EUR','€ EUR'],['GBP','£ GBP'],['INR','₹ INR'],['JPY','¥ JPY'],['AUD','A$ AUD']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Budget Limit</label>
                <input type="number" placeholder="0" min="0" style={ic}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  value={form.budgetLimit} onChange={set('budgetLimit')} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              background: 'none', color: '#808098', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={isPending} style={{
              flex: 2, padding: '11px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1, boxShadow: '0 4px 20px rgba(79,142,247,0.3)',
            }}>{isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Trip')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Join by Code Modal
function JoinModal({ onClose }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const { mutate: join, isPending } = useMutation({
    mutationFn: (c) => api.post('/join', { code: c }).then(r => r.data),
    onSuccess: (data) => {
      toast.success(data.data.alreadyMember ? 'Already a member — redirecting!' : `Joined "${data.data.tripTitle}"! 🎉`)
      onClose(); navigate(`/trips/${data.data.tripId}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid code'),
  })
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif", display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hash size={18} color="#a855f7" /> Join a Trip
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#606080', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: '#606080', marginBottom: 24 }}>Enter the 6-character code shared by the trip owner.</p>

        <input
          placeholder="XXXXXX" maxLength={6} autoFocus
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)',
            background: 'rgba(168,85,247,0.06)', color: '#f0f0f5', fontSize: 28,
            fontWeight: 800, textAlign: 'center', letterSpacing: '0.4em', outline: 'none',
            fontFamily: "'DM Mono', monospace", boxSizing: 'border-box',
          }}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && code.length === 6 && join(code)}
        />

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '16px 0' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: 8, border: `1px solid ${code[i] ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
              background: code[i] ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: code[i] ? '#fff' : '#303050', transition: 'all 0.15s',
            }}>{code[i] || '·'}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#808098', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => code.length === 6 && join(code)} disabled={isPending || code.length !== 6}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: code.length === 6 ? 'pointer' : 'not-allowed', opacity: code.length !== 6 ? 0.5 : 1 }}>
            {isPending ? 'Joining...' : 'Join Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal
function DeleteModal({ tripTitle, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#0f0f1c', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 20, maxWidth: 360, width: '100%', padding: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 size={20} color="#f87171" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Delete Trip</h3>
        <p style={{ fontSize: 13, color: '#808098', lineHeight: 1.6, marginBottom: 24 }}>
          Are you sure you want to delete <strong style={{ color: '#f0f0f5' }}>"{tripTitle}"</strong>? This will permanently remove all activities, expenses, and data. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#808098', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(248,113,113,0.15)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(248,113,113,0.3)' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Stats bar
function StatsBar({ trips }) {
  const ongoing  = trips.filter(t => tripStatus(t) === 'ongoing').length
  const upcoming = trips.filter(t => tripStatus(t) === 'upcoming').length
  const past     = trips.filter(t => tripStatus(t) === 'past').length
  const totalDays = trips.reduce((s, t) => s + (t.days?.length || 0), 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
      {[
        { icon: Globe2,       label: 'Total Trips',  value: trips.length, color: '#60a5fa' },
        { icon: TrendingUp,   label: 'Ongoing',      value: ongoing,      color: '#34d399' },
        { icon: Clock,        label: 'Upcoming',     value: upcoming,     color: '#a855f7' },
        { icon: CheckSquare,  label: 'Days Planned', value: totalDays,    color: '#f59e0b' },
      ].map(stat => (
        <div key={stat.label} style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <stat.icon size={14} color={stat.color} />
            <span style={{ fontSize: 11, color: '#606080', fontWeight: 500 }}>{stat.label}</span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#f0f0f5', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main Dashboard
export default function Dashboard() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)
  const [editTrip,   setEditTrip]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all') // all | ongoing | upcoming | past

  const { data: trips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: fetchTrips })

  const { mutate: deleteTrip } = useMutation({
    mutationFn: (id) => api.delete(`/trips/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip deleted'); setDeleteTarget(null) },
    onError: () => toast.error('Failed to delete trip'),
  })

  const { mutate: archiveTrip } = useMutation({
    mutationFn: (id) => api.patch(`/trips/${id}`, { status: 'archived' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip archived') },
  })

  const filtered = trips.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || tripStatus(t) === filter
    return matchSearch && matchFilter
  })

  const s = {
    page: { padding: '32px 36px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#07070f' },
  }

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Modals */}
      {(showCreate || editTrip) && <TripModal existing={editTrip} onClose={() => { setShowCreate(false); setEditTrip(null) }} />}
      {showJoin   && <JoinModal   onClose={() => setShowJoin(false)} />}
      {deleteTarget && <DeleteModal tripTitle={deleteTarget.title} onConfirm={() => deleteTrip(deleteTarget._id)} onClose={() => setDeleteTarget(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.5px', marginBottom: 4 }}>My Trips</h1>
          <p style={{ fontSize: 13, color: '#606080' }}>{trips.length} trip{trips.length !== 1 ? 's' : ''} · {trips.filter(t => tripStatus(t) === 'upcoming').length} upcoming</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowJoin(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#c0c0d8', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          }}>
            <Hash size={14} /> Join Trip
          </button>
          <button onClick={() => setShowCreate(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 20px rgba(79,142,247,0.3)',
          }}>
            <Plus size={14} /> New Trip
          </button>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && trips.length > 0 && <StatsBar trips={trips} />}

      {/* Search + Filter */}
      {trips.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#505070' }} />
            <input
              placeholder="Search trips..."
              style={{
                width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif",
              }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'ongoing', 'upcoming', 'past'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '9px 16px', borderRadius: 10, border: '1px solid',
                borderColor: filter === f ? '#4f8ef7' : 'rgba(255,255,255,0.08)',
                background: filter === f ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.03)',
                color: filter === f ? '#60a5fa' : '#606080',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                fontFamily: "'DM Sans', sans-serif",
              }}>{f}</button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={28} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && trips.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🗺️</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>No trips yet</h3>
          <p style={{ fontSize: 14, color: '#606080', marginBottom: 28, maxWidth: 320, lineHeight: 1.6 }}>Create your first trip or join one with an invite code from a friend.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowJoin(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'none', color: '#c0c0d8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <Hash size={14} /> Join with Code
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 20px rgba(79,142,247,0.3)' }}>
              <Plus size={14} /> Create Trip
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {!isLoading && trips.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#505070' }}>
          <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>No trips match "{search}"</p>
          <button onClick={() => { setSearch(''); setFilter('all') }} style={{ marginTop: 12, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#808098', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Clear filters</button>
        </div>
      )}

      {/* Trip grid */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
          {filtered.map(trip => (
            <TripCard
              key={trip._id}
              trip={trip}
              onDelete={(id) => setDeleteTarget(trips.find(t => t._id === id))}
              onArchive={(id) => archiveTrip(id)}
              onEdit={(trip) => setEditTrip(trip)}
            />
          ))}
        </div>
      )}
    </div>
  )
}