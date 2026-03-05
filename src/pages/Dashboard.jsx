import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import {
  Plus, MapPin, Calendar, Loader2, Hash,
  Trash2, MoreVertical, Search, Globe2,
  Wallet, TrendingUp, Clock, CheckSquare,
  Edit3, Archive, ImagePlus, ChevronRight,
} from 'lucide-react'

/* ── helpers ── */
const fetchTrips = () => api.get('/trips').then(r => r.data.data)

function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000)
}

function tripStatus(trip) {
  if (trip.status === 'archived') return 'archived'
  const now = new Date()
  const s   = new Date(trip.startDate)
  const e   = new Date(trip.endDate)
  if (now >= s && now <= e) return 'ongoing'
  if (now < s) return 'upcoming'
  return 'past'
}

const STATUS_CFG = {
  ongoing:  { label: 'Ongoing',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  upcoming: { label: 'Upcoming', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  past:     { label: 'Past',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
  archived: { label: 'Archived', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
}

const GRADIENTS = [
  'linear-gradient(135deg,#1e3a5f,#2d1b4e)',
  'linear-gradient(135deg,#1a4a2e,#0f2a4a)',
  'linear-gradient(135deg,#4a1a2e,#1a1a4a)',
  'linear-gradient(135deg,#3a2a0a,#1a3a2e)',
  'linear-gradient(135deg,#2a0a3a,#0a2a3a)',
]

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#f0f0f5', fontSize: 13,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: '#606080',
  textTransform: 'uppercase', letterSpacing: 1,
  display: 'block', marginBottom: 6,
}

/* ═══════════════════════════════════════
   TRIP CARD
═══════════════════════════════════════ */
function TripCard({ trip, onDelete, onArchive, onEdit, onImageUpload }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ top: 0, right: 0 })
  const fileRef = useRef(null)
  const btnRef  = useRef(null)

  const status = tripStatus(trip)
  const cfg    = STATUS_CFG[status]
  const days   = daysUntil(trip.startDate)
  const start  = new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const end    = new Date(trip.endDate).toLocaleDateString('en',   { month: 'short', day: 'numeric', year: 'numeric' })
  const grad   = GRADIENTS[parseInt(trip._id?.slice(-2), 16) % GRADIENTS.length]

  const openMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const r = btnRef.current.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    setMenuOpen(true)
  }

  const menuItems = [
    { icon: Edit3,     label: 'Edit trip',    color: '#c0c0d8', fn: () => { onEdit(trip);             setMenuOpen(false) } },
    { icon: ImagePlus, label: 'Upload cover', color: '#60a5fa', fn: () => { fileRef.current?.click(); setMenuOpen(false) } },
    { icon: Archive,   label: 'Archive',      color: '#f59e0b', fn: () => { onArchive(trip._id);      setMenuOpen(false) } },
    { icon: Trash2,    label: 'Delete trip',  color: '#f87171', fn: () => { onDelete(trip);           setMenuOpen(false) } },
  ]

  return (
    <div
      style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, transition: 'border-color .2s, box-shadow .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Hidden file input for cover upload */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(trip._id, f); e.target.value = '' }} />

      {/* Fixed-position dropdown — fully escapes overflow/stacking contexts */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999,
            background: '#14142a', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: 6, minWidth: 175,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}>
            {menuItems.map(item => (
              <button key={item.label}
                onClick={e => { e.stopPropagation(); item.fn() }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', color: item.color, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <item.icon size={13} /> {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Cover area */}
      <div style={{ height: 130, background: trip.coverImage ? undefined : grad, position: 'relative', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
        {trip.coverImage && (
          <img src={trip.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,#0d0d1a 0%,transparent 55%)' }} />

        {/* Status badge */}
        <span style={{ position: 'absolute', top: 12, left: 14, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>

        {/* 3-dot button */}
        <button ref={btnRef} onClick={openMenu} style={{ position: 'absolute', top: 10, right: 12, width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <MoreVertical size={14} />
        </button>

        {/* Add cover hint */}
        {!trip.coverImage && (
          <button onClick={() => fileRef.current?.click()}
            style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.45)', border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
            <ImagePlus size={11} /> Add cover
          </button>
        )}

        {/* Time badges */}
        {status === 'upcoming' && days > 0 && days <= 60 && (
          <span style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 10, color: '#60a5fa', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)', padding: '2px 8px', borderRadius: 6 }}>
            {days}d away
          </span>
        )}
        {status === 'ongoing' && (
          <span style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            In progress
          </span>
        )}
      </div>

      {/* Card body */}
      <Link to={`/trips/${trip._id}`} style={{ display: 'block', padding: '16px 18px 18px', textDecoration: 'none', color: 'inherit' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f5', marginBottom: 4, letterSpacing: '-0.3px', fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
          {trip.title}
        </h3>
        {trip.description && (
          <p style={{ fontSize: 12, color: '#505070', marginBottom: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.description}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#606080', marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} color="#60a5fa" />{start} – {end}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} color="#a855f7" />{trip.days?.length || 0} days</span>
          {trip.budgetLimit > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Wallet size={11} color="#f59e0b" />{trip.currency} {trip.budgetLimit.toLocaleString()}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {trip.members?.slice(0, 5).map((m, i) => (
                <div key={i} title={m.user?.name} style={{ width: 26, height: 26, borderRadius: '50%', marginLeft: i > 0 ? -8 : 0, background: `hsl(${[220,270,200,340,160][i % 5]},55%,48%)`, border: '2px solid #0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {m.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#505070' }}>{trip.members?.length} member{trip.members?.length !== 1 ? 's' : ''}</span>
          </div>
          <ChevronRight size={14} color="#303050" />
        </div>
      </Link>
    </div>
  )
}

/* ═══════════════════════════════════════
   STATS BAR
═══════════════════════════════════════ */
function StatsBar({ trips }) {
  const items = [
    { icon: Globe2,      label: 'Total Trips',  value: trips.filter(t => tripStatus(t) !== 'archived').length, color: '#60a5fa' },
    { icon: TrendingUp,  label: 'Ongoing',      value: trips.filter(t => tripStatus(t) === 'ongoing').length,   color: '#34d399' },
    { icon: Clock,       label: 'Upcoming',     value: trips.filter(t => tripStatus(t) === 'upcoming').length,  color: '#a855f7' },
    { icon: CheckSquare, label: 'Days Planned', value: trips.reduce((s, t) => s + (t.days?.length || 0), 0),   color: '#f59e0b' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
      {items.map(s => (
        <div key={s.label} style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <s.icon size={13} color={s.color} />
            <span style={{ fontSize: 11, color: '#505070', fontWeight: 500 }}>{s.label}</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f5', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════
   CREATE / EDIT MODAL
═══════════════════════════════════════ */
function TripModal({ existing, onClose }) {
  const qc     = useQueryClient()
  const isEdit = !!existing

  const coverRef                          = useRef(null)
  const [coverPreview, setCoverPreview]   = useState(existing?.coverImage || null)
  const [coverFile,    setCoverFile]      = useState(null)

  const [form, setForm] = useState({
    title:       existing?.title       || '',
    description: existing?.description || '',
    startDate:   existing?.startDate   ? existing.startDate.split('T')[0] : '',
    endDate:     existing?.endDate     ? existing.endDate.split('T')[0]   : '',
    currency:    existing?.currency    || 'USD',
    budgetLimit: existing?.budgetLimit || '',
  })

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleCoverPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const { mutate: uploadCover } = useMutation({
    mutationFn: ({ id, file }) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post(`/upload/trip/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
  })

  const { mutate: saveTrip, isPending } = useMutation({
    mutationFn: d => isEdit
      ? api.patch(`/trips/${existing._id}`, d).then(r => r.data.data)
      : api.post('/trips', d).then(r => r.data.data),
    onSuccess: (trip) => {
      if (coverFile) {
        uploadCover({ id: trip._id, file: coverFile }, {
          onSettled: () => {
            qc.invalidateQueries({ queryKey: ['trips'] })
            toast.success(isEdit ? 'Trip updated!' : 'Trip created!')
            onClose()
          },
        })
      } else {
        qc.invalidateQueries({ queryKey: ['trips'] })
        toast.success(isEdit ? 'Trip updated!' : 'Trip created!')
        onClose()
      }
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const submit = e => {
    e.preventDefault()
    if (new Date(form.startDate) > new Date(form.endDate)) return toast.error('Start date must be before end date')
    saveTrip({
      ...form,
      startDate:   new Date(form.startDate).toISOString(),
      endDate:     new Date(form.endDate).toISOString(),
      budgetLimit: Number(form.budgetLimit) || 0,
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', margin: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#f0f0f5' }}>
            {isEdit ? 'Edit Trip' : 'New Trip'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#606080', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>x</button>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Cover photo picker */}
            <div>
              <label style={labelStyle}>Cover Photo</label>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverPick} />
              <div onClick={() => coverRef.current?.click()}
                style={{ height: 120, borderRadius: 12, cursor: 'pointer', overflow: 'hidden', border: coverPreview ? '1px solid rgba(255,255,255,0.1)' : '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 8, pointerEvents: 'none' }}>Change photo</span>
                    </div>
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null) }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      x
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>🖼️</div>
                    <p style={{ fontSize: 12, color: '#505070', margin: 0 }}>Click to upload cover photo</p>
                    <p style={{ fontSize: 11, color: '#404060', margin: '3px 0 0' }}>JPG, PNG or WEBP · Max 8MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trip name */}
            <div>
              <label style={labelStyle}>Trip Name *</label>
              <input type="text" placeholder="e.g. Jaipur Heritage Trail" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f8ef7'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                value={form.title} onChange={set('title')} />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <input type="text" placeholder="Optional tagline" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f8ef7'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                value={form.description} onChange={set('description')} />
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Start Date *', 'startDate'], ['End Date *', 'endDate']].map(([lbl, field]) => (
                <div key={field}>
                  <label style={labelStyle}>{lbl}</label>
                  <input type="date" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#4f8ef7'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    value={form[field]} onChange={set(field)} />
                </div>
              ))}
            </div>

            {/* Currency + Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Currency</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  value={form.currency} onChange={set('currency')}>
                  {[['USD','$ USD'],['EUR','EUR'],['GBP','GBP'],['INR','INR'],['JPY','JPY'],['AUD','AUD']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Budget Limit</label>
                <input type="number" placeholder="0" min="0" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  value={form.budgetLimit} onChange={set('budgetLimit')} />
              </div>
            </div>

          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#808098', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 20px rgba(79,142,247,0.3)' }}>
              {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Trip')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   JOIN MODAL
═══════════════════════════════════════ */
function JoinModal({ onClose }) {
  const navigate    = useNavigate()
  const [code, setCode] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: c => api.post('/join', { code: c }).then(r => r.data),
    onSuccess: d => {
      toast.success(d.data.alreadyMember ? 'Already a member!' : 'Joined successfully!')
      onClose()
      navigate(`/trips/${d.data.tripId}`)
    },
    onError: e => toast.error(e.response?.data?.message || 'Invalid code'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0f0f1c', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hash size={18} color="#a855f7" /> Join a Trip
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#606080', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>x</button>
        </div>

        <p style={{ fontSize: 13, color: '#606080', marginBottom: 20, lineHeight: 1.6 }}>
          Enter the 6-character invite code from the trip owner.
        </p>

        <input
          placeholder="XXXXXX" maxLength={6} autoFocus
          style={{ width: '100%', padding: 18, borderRadius: 12, border: '1px solid rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.07)', color: '#f0f0f5', fontSize: 30, fontWeight: 900, textAlign: 'center', letterSpacing: '0.45em', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && code.length === 6 && mutate(code)}
        />

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '14px 0 20px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${code[i] ? '#a855f7' : 'rgba(255,255,255,0.08)'}`, background: code[i] ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: code[i] ? '#fff' : '#303050', transition: 'all .15s' }}>
              {code[i] || '.'}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#808098', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={() => code.length === 6 && mutate(code)} disabled={isPending || code.length !== 6}
            style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: code.length === 6 ? 'pointer' : 'not-allowed', opacity: code.length !== 6 ? 0.5 : 1, fontFamily: "'DM Sans', sans-serif" }}>
            {isPending ? 'Joining...' : 'Join Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
═══════════════════════════════════════ */
function DeleteModal({ trip, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0f0f1c', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, maxWidth: 380, width: '100%', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Trash2 size={22} color="#f87171" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10, fontFamily: "'Playfair Display', serif", color: '#f0f0f5' }}>Delete Trip?</h3>
        <p style={{ fontSize: 13, color: '#808098', lineHeight: 1.7, marginBottom: 24 }}>
          Permanently delete <strong style={{ color: '#f0f0f5' }}>"{trip?.title}"</strong> along with all activities, expenses, and checklists. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#808098', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.12)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete Forever</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════ */
export default function Dashboard() {
  const qc = useQueryClient()
  const [showCreate,   setShowCreate]   = useState(false)
  const [showJoin,     setShowJoin]     = useState(false)
  const [editTrip,     setEditTrip]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('all')

  const { data: trips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: fetchTrips })

  const { mutate: deleteTrip } = useMutation({
    mutationFn: id => api.delete(`/trips/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip deleted'); setDeleteTarget(null) },
    onError:   () => toast.error('Failed to delete trip'),
  })

  const { mutate: archiveTrip } = useMutation({
    mutationFn: id => api.patch(`/trips/${id}`, { status: 'archived' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip archived') },
  })

  const { mutate: uploadCover } = useMutation({
    mutationFn: ({ id, file }) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post(`/upload/trip/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Cover updated!') },
    onError:   () => toast.error('Upload failed'),
  })

  const filtered = trips.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || tripStatus(t) === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ padding: '32px 36px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#07070f' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5) }
        option { background: #1a1a2e }
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width:900px) { .stats-grid { grid-template-columns: repeat(2,1fr) !important } }
      `}</style>

      {/* Modals */}
      {(showCreate || editTrip) && (
        <TripModal existing={editTrip} onClose={() => { setShowCreate(false); setEditTrip(null) }} />
      )}
      {showJoin     && <JoinModal   onClose={() => setShowJoin(false)} />}
      {deleteTarget && <DeleteModal trip={deleteTarget} onConfirm={() => deleteTrip(deleteTarget._id)} onClose={() => setDeleteTarget(null)} />}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.5px', marginBottom: 4, color: '#f0f0f5' }}>My Trips</h1>
          <p style={{ fontSize: 13, color: '#505070' }}>
            {trips.length} trip{trips.length !== 1 ? 's' : ''} · {trips.filter(t => tripStatus(t) === 'upcoming').length} upcoming
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowJoin(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#c0c0d8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            <Hash size={14} /> Join Trip
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 20px rgba(79,142,247,0.3)' }}>
            <Plus size={14} /> New Trip
          </button>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && trips.length > 0 && <StatsBar trips={trips} />}

      {/* Search + Filter bar */}
      {trips.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#505070', pointerEvents: 'none' }} />
            <input
              placeholder="Search trips..."
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'ongoing', 'upcoming', 'past', 'archived'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '9px 15px', borderRadius: 10, border: '1px solid', borderColor: filter === f ? '#4f8ef7' : 'rgba(255,255,255,0.08)', background: filter === f ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.03)', color: filter === f ? '#60a5fa' : '#606080', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'DM Sans', sans-serif" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={28} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && trips.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🗺️</div>
          <h3 style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Playfair Display', serif", marginBottom: 10, color: '#f0f0f5' }}>No trips yet</h3>
          <p style={{ fontSize: 13, color: '#606080', maxWidth: 300, lineHeight: 1.7, marginBottom: 28 }}>Create your first trip or join one with an invite code.</p>
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

      {/* No search results */}
      {!isLoading && trips.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Search size={32} color="#303050" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#505070' }}>No trips match your search</p>
          <button onClick={() => { setSearch(''); setFilter('all') }}
            style={{ marginTop: 12, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: '#808098', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Trip grid */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 18 }}>
          {filtered.map(trip => (
            <TripCard
              key={trip._id}
              trip={trip}
              onDelete={t   => setDeleteTarget(t)}
              onArchive={id => archiveTrip(id)}
              onEdit={t     => setEditTrip(t)}
              onImageUpload={(id, file) => uploadCover({ id, file })}
            />
          ))}
        </div>
      )}
    </div>
  )
}