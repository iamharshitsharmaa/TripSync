import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import {
  Plus, MapPin, Calendar, Loader2, Hash,
  Trash2, MoreVertical, Search, Globe2,
  Wallet, TrendingUp, Clock, CheckSquare,
  Edit3, Archive, ArchiveRestore, ImagePlus, ChevronRight,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/* ── Status config using brand palette ───────────────────── */
const STATUS_CFG = (T) => ({
  ongoing:  { label:'Ongoing',  color: T.sage,     bg:`${T.sage}18`,     border:`${T.sage}40`     },
  upcoming: { label:'Upcoming', color: T.skyTeal,  bg:`${T.skyTeal}18`,  border:`${T.skyTeal}45`  },
  past:     { label:'Past',     color: T.textMuted, bg:`${T.textMuted}14`, border:`${T.textMuted}30`},
  archived: { label:'Archived', color: T.textMid,  bg:`${T.textMid}14`,  border:`${T.textMid}30`  },
})

/* ── Cover gradients — teal/sage-tinted ─────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg,#1C6B72,#3E5A5C)',
  'linear-gradient(135deg,#3E5A5C,#4a6a50)',
  'linear-gradient(135deg,#2a6060,#1C6B72)',
  'linear-gradient(135deg,#4a5a3a,#3E5A5C)',
  'linear-gradient(135deg,#1a5060,#2a6858)',
]

const fetchTrips = () => api.get('/trips').then(r => r.data.data)
function daysUntil(d) { return Math.ceil((new Date(d) - new Date()) / 86400000) }
function tripStatus(trip) {
  if (trip.status === 'archived') return 'archived'
  const now = new Date(), s = new Date(trip.startDate), e = new Date(trip.endDate)
  if (now >= s && now <= e) return 'ongoing'
  if (now < s) return 'upcoming'
  return 'past'
}

/* ══════════════════════════════════════════════════════════
   TRIP CARD
══════════════════════════════════════════════════════════ */
function TripCard({ trip, onDelete, onArchive, onEdit, onImageUpload, T }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ top:0, right:0 })
  const fileRef = useRef(null)
  const btnRef  = useRef(null)

  const status = tripStatus(trip)
  const scfg   = STATUS_CFG(T)[status]
  const days   = daysUntil(trip.startDate)
  const start  = new Date(trip.startDate).toLocaleDateString('en', { month:'short', day:'numeric' })
  const end    = new Date(trip.endDate).toLocaleDateString('en',   { month:'short', day:'numeric', year:'numeric' })
  const grad   = GRADIENTS[parseInt(trip._id?.slice(-2),16) % GRADIENTS.length]

  const openMenu = (e) => {
    e.preventDefault(); e.stopPropagation()
    const r = btnRef.current.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    setMenuOpen(true)
  }

  const menuItems = [
    { icon: Edit3,     label:'Edit trip',    color: T.textMid,  fn: () => { onEdit(trip);             setMenuOpen(false) } },
    { icon: ImagePlus, label:'Upload cover', color: T.skyTeal,  fn: () => { fileRef.current?.click(); setMenuOpen(false) } },
    status === 'archived'
      ? { icon: ArchiveRestore, label:'Unarchive', color: T.sage,    fn: () => { onArchive(trip._id, false); setMenuOpen(false) } }
      : { icon: Archive,        label:'Archive',   color: '#d97706', fn: () => { onArchive(trip._id, true);  setMenuOpen(false) } },
    { icon: Trash2, label:'Delete trip', color:'#dc2626', fn: () => { onDelete(trip); setMenuOpen(false) } },
  ]

  return (
    <div className="trip-card"
      style={{ background: T.bgCard, border:`1px solid ${T.borderCard}`, borderRadius:16, overflow:'hidden', transition:'all .22s', cursor:'pointer' }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => { const f=e.target.files?.[0]; if(f) onImageUpload(trip._id,f); e.target.value='' }} />

      {/* Context menu */}
      {menuOpen && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:9998 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position:'fixed', top:menuPos.top, right:menuPos.right, zIndex:9999, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, padding:5, minWidth:168, boxShadow:`0 16px 44px ${T.shadow}` }}>
            {menuItems.map(item => (
              <button key={item.label} onClick={e => { e.stopPropagation(); item.fn() }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:8, border:'none', background:'none', color:item.color, fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif", transition:'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background=T.bgAlt}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                <item.icon size={13} /> {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Cover image / gradient */}
      <div style={{ height:140, background: trip.coverImage ? undefined : grad, position:'relative', overflow:'hidden' }}>
        {trip.coverImage && <img src={trip.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
        {/* Scrim */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(22,34,36,.55) 0%, transparent 55%)' }} />

        {/* Status badge */}
        <span style={{ position:'absolute', top:12, left:13, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:100, background:scfg.bg, color:scfg.color, border:`1px solid ${scfg.border}`, letterSpacing:.4, fontFamily:"'DM Sans',sans-serif" }}>
          {scfg.label}
        </span>

        {/* Menu button */}
        <button ref={btnRef} onClick={openMenu}
          style={{ position:'absolute', top:10, right:11, width:30, height:30, borderRadius:8, background:'rgba(22,34,36,0.55)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(4px)' }}>
          <MoreVertical size={13} />
        </button>

        {/* No-cover prompt */}
        {!trip.coverImage && (
          <button onClick={e => { e.preventDefault(); fileRef.current?.click() }}
            style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:7, background:'rgba(22,34,36,0.45)', border:'1px dashed rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.55)', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif", backdropFilter:'blur(4px)' }}>
            <ImagePlus size={10} /> Add cover
          </button>
        )}

        {/* Countdown */}
        {status==='upcoming' && days>0 && days<=60 && (
          <span style={{ position:'absolute', bottom:10, right:11, fontSize:10, color:'#fff', background:`${T.skyTeal}cc`, padding:'2px 8px', borderRadius:6, fontWeight:600 }}>{days}d away</span>
        )}
        {status==='ongoing' && (
          <span style={{ position:'absolute', bottom:10, right:11, fontSize:10, color:'#fff', background:`${T.sage}cc`, padding:'2px 8px', borderRadius:6, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#fff', display:'inline-block' }} /> Live
          </span>
        )}
      </div>

      {/* Card body */}
      <Link to={`/trips/${trip._id}`} style={{ display:'block', padding:'15px 16px 17px', textDecoration:'none', color:'inherit' }}>
        <h3 style={{ fontSize:15, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, marginBottom:3, lineHeight:1.2, letterSpacing:'-.2px' }}>{trip.title}</h3>
        {trip.description && (
          <p style={{ fontSize:12, color:T.textMuted, marginBottom:11, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trip.description}</p>
        )}

        <div style={{ display:'flex', flexWrap:'wrap', gap:9, fontSize:12, color:T.textMuted, marginBottom:13 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Calendar size={11} color={T.skyTeal} />{start} – {end}
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <MapPin size={11} color={T.sage} />{trip.days?.length||0} day{trip.days?.length!==1?'s':''}
          </span>
          {trip.budgetLimit>0 && (
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Wallet size={11} color={T.deepTeal} />{trip.currency} {trip.budgetLimit.toLocaleString()}
            </span>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ display:'flex' }}>
              {trip.members?.slice(0,5).map((m,i) => (
                <div key={i} title={m.user?.name} style={{ width:24, height:24, borderRadius:'50%', marginLeft:i>0?-7:0, background:[`${T.deepTeal}cc`,`${T.sage}cc`,`${T.skyTeal}cc`,`${T.deepTeal}99`,`${T.sage}99`][i%5], border:`2px solid ${T.bgCard}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {m.user?.name?.[0]?.toUpperCase()||'?'}
                </div>
              ))}
            </div>
            <span style={{ fontSize:11, color:T.textMuted }}>{trip.members?.length} member{trip.members?.length!==1?'s':''}</span>
          </div>
          <ChevronRight size={14} color={T.textMuted} />
        </div>
      </Link>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   STATS BAR
══════════════════════════════════════════════════════════ */
function StatsBar({ trips, T }) {
  const items = [
    { icon: Globe2,     label:'Trips',    value: trips.filter(t=>tripStatus(t)!=='archived').length, accent: T.deepTeal },
    { icon: TrendingUp, label:'Ongoing',  value: trips.filter(t=>tripStatus(t)==='ongoing').length,   accent: T.sage     },
    { icon: Clock,      label:'Upcoming', value: trips.filter(t=>tripStatus(t)==='upcoming').length,  accent: T.skyTeal  },
    { icon: CheckSquare,label:'Days',     value: trips.reduce((s,t)=>s+(t.days?.length||0),0),        accent: T.deepTeal },
  ]
  return (
    <div className="stats-grid" style={{ display:'grid', gap:10, marginBottom:24 }}>
      {items.map(s => (
        <div key={s.label} style={{ background:T.bgCard, border:`1px solid ${T.borderCard}`, borderRadius:14, padding:'14px 16px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:`${s.accent}16`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <s.icon size={12} color={s.accent} />
            </div>
            <span style={{ fontSize:11, color:T.textMuted, fontWeight:500 }}>{s.label}</span>
          </div>
          <p style={{ fontSize:26, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, lineHeight:1 }}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TRIP MODAL
══════════════════════════════════════════════════════════ */
function TripModal({ existing, onClose, T }) {
  const qc     = useQueryClient()
  const isEdit = !!existing
  const coverRef = useRef(null)
  const [coverPreview, setCoverPreview] = useState(existing?.coverImage||null)
  const [coverFile,    setCoverFile]    = useState(null)
  const [form, setForm] = useState({
    title:       existing?.title       || '',
    description: existing?.description || '',
    startDate:   existing?.startDate   ? existing.startDate.split('T')[0] : '',
    endDate:     existing?.endDate     ? existing.endDate.split('T')[0]   : '',
    currency:    existing?.currency    || 'USD',
    budgetLimit: existing?.budgetLimit || '',
  })
  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const IS = { width:'100%', padding:'10px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const LS = { fontSize:11, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:1.1, display:'block', marginBottom:6 }

  const { mutate: uploadCover } = useMutation({
    mutationFn: ({ id, file }) => { const fd=new FormData(); fd.append('file',file); return api.post(`/upload/trip/${id}`,fd,{headers:{'Content-Type':'multipart/form-data'}}) },
  })

  const { mutate: saveTrip, isPending } = useMutation({
    mutationFn: d => isEdit ? api.patch(`/trips/${existing._id}`,d).then(r=>r.data.data) : api.post('/trips',d).then(r=>r.data.data),
    onSuccess: (trip) => {
      if (coverFile) {
        uploadCover({ id:trip._id, file:coverFile }, { onSettled: () => { qc.invalidateQueries({queryKey:['trips']}); toast.success(isEdit?'Trip updated!':'Trip created!'); onClose() } })
      } else {
        qc.invalidateQueries({queryKey:['trips']}); toast.success(isEdit?'Trip updated!':'Trip created!'); onClose()
      }
    },
    onError: e => toast.error(e.response?.data?.message||'Failed'),
  })

  const submit = e => {
    e.preventDefault()
    if (new Date(form.startDate)>new Date(form.endDate)) return toast.error('Start date must be before end date')
    saveTrip({ ...form, startDate:new Date(form.startDate).toISOString(), endDate:new Date(form.endDate).toISOString(), budgetLimit:Number(form.budgetLimit)||0 })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(22,34,36,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, overflowY:'auto', backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, width:'100%', maxWidth:500, padding:'24px 22px', boxShadow:`0 28px 64px ${T.shadow}`, margin:'auto' }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, lineHeight:1 }}>{isEdit?'Edit Trip':'New Trip'}</h2>
            <p style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>{isEdit?'Update trip details':'Fill in the details to get started'}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        </div>

        <form onSubmit={submit}>
          <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            {/* Cover */}
            <div>
              <label style={LS}>Cover Photo</label>
              <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => { const f=e.target.files?.[0]; if(f){setCoverFile(f);setCoverPreview(URL.createObjectURL(f))} }} />
              <div onClick={() => coverRef.current?.click()} style={{ height:100, borderRadius:11, cursor:'pointer', overflow:'hidden', border:coverPreview?`1px solid ${T.border}`:`2px dashed ${T.border}`, background:T.bgAlt, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'border-color .15s' }}>
                {coverPreview
                  ? <img src={coverPreview} alt="cover" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ textAlign:'center', pointerEvents:'none' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${T.deepTeal}14`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}><ImagePlus size={15} color={T.deepTeal} /></div>
                      <p style={{ fontSize:12, color:T.textMuted, margin:0 }}>Click to upload cover</p>
                    </div>
                }
              </div>
            </div>

            <div>
              <label style={LS}>Trip Name *</label>
              <input type="text" placeholder="e.g. Jaipur Heritage Trail" required style={IS}
                onFocus={e=>e.target.style.borderColor=T.deepTeal} onBlur={e=>e.target.style.borderColor=T.border}
                value={form.title} onChange={set('title')} />
            </div>

            <div>
              <label style={LS}>Description</label>
              <input type="text" placeholder="Optional tagline" style={IS}
                onFocus={e=>e.target.style.borderColor=T.deepTeal} onBlur={e=>e.target.style.borderColor=T.border}
                value={form.description} onChange={set('description')} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Start Date *','startDate'],['End Date *','endDate']].map(([lbl,field]) => (
                <div key={field}>
                  <label style={LS}>{lbl}</label>
                  <input type="date" required style={IS}
                    onFocus={e=>e.target.style.borderColor=T.deepTeal} onBlur={e=>e.target.style.borderColor=T.border}
                    value={form[field]} onChange={set(field)} />
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={LS}>Currency</label>
                <select style={{ ...IS, cursor:'pointer' }}
                  onFocus={e=>e.target.style.borderColor=T.deepTeal} onBlur={e=>e.target.style.borderColor=T.border}
                  value={form.currency} onChange={set('currency')}>
                  {[['USD','$ USD'],['EUR','€ EUR'],['GBP','£ GBP'],['INR','₹ INR'],['JPY','¥ JPY'],['AUD','A$ AUD']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={LS}>Budget Limit</label>
                <input type="number" placeholder="0" min="0" style={IS}
                  onFocus={e=>e.target.style.borderColor=T.deepTeal} onBlur={e=>e.target.style.borderColor=T.border}
                  value={form.budgetLimit} onChange={set('budgetLimit')} />
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:22 }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:11, borderRadius:10, border:`1.5px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.deepTeal}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} style={{ flex:2, padding:11, borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:isPending?'not-allowed':'pointer', opacity:isPending?.75:1, fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 16px ${T.deepTeal}35`, transition:'opacity .15s' }}>
              {isPending?(isEdit?'Saving…':'Creating…'):(isEdit?'Save Changes':'Create Trip')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   JOIN MODAL
══════════════════════════════════════════════════════════ */
function JoinModal({ onClose, T }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const { mutate, isPending } = useMutation({
    mutationFn: c => api.post('/join', { code:c }).then(r=>r.data),
    onSuccess: d => { toast.success(d.data.alreadyMember?'Already a member!':'Joined!'); onClose(); navigate(`/trips/${d.data.tripId}`) },
    onError: e => toast.error(e.response?.data?.message||'Invalid code'),
  })
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(22,34,36,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, width:'100%', maxWidth:380, padding:'26px 22px', boxShadow:`0 24px 56px ${T.shadow}` }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${T.skyTeal}16`, border:`1px solid ${T.skyTeal}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Hash size={16} color={T.skyTeal} />
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text }}>Join a Trip</h2>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:17 }}>×</button>
        </div>
        <p style={{ fontSize:13, color:T.textMuted, marginBottom:20, lineHeight:1.6 }}>Enter the 6-character invite code shared by your trip organiser.</p>

        <input placeholder="XXXXXX" maxLength={6} autoFocus
          style={{ width:'100%', padding:16, borderRadius:12, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:28, fontWeight:700, textAlign:'center', letterSpacing:'0.45em', outline:'none', fontFamily:'monospace', boxSizing:'border-box', transition:'border-color .15s' }}
          value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))}
          onFocus={e=>e.target.style.borderColor=T.skyTeal} onBlur={e=>e.target.style.borderColor=T.border}
          onKeyDown={e=>e.key==='Enter'&&code.length===6&&mutate(code)} />

        {/* Char indicators */}
        <div style={{ display:'flex', gap:5, justifyContent:'center', margin:'12px 0 20px' }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${code[i]?T.skyTeal:T.border}`, background:code[i]?`${T.skyTeal}14`:T.bgAlt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:code[i]?T.deepTeal:T.textMuted, transition:'all .15s' }}>
              {code[i]||'·'}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:11, borderRadius:10, border:`1.5px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={() => code.length===6&&mutate(code)} disabled={isPending||code.length!==6}
            style={{ flex:2, padding:11, borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:code.length===6?'pointer':'not-allowed', opacity:code.length!==6?.45:1, fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 16px ${T.deepTeal}35`, transition:'opacity .15s' }}>
            {isPending?'Joining…':'Join Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DELETE MODAL
══════════════════════════════════════════════════════════ */
function DeleteModal({ trip, onConfirm, onClose, T }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(22,34,36,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid rgba(220,38,38,0.2)`, borderRadius:20, maxWidth:380, width:'100%', padding:'26px 22px', boxShadow:`0 28px 64px ${T.shadow}` }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:44, height:44, borderRadius:12, background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <Trash2 size={20} color="#dc2626" />
        </div>
        <h3 style={{ fontSize:20, fontWeight:700, marginBottom:10, fontFamily:"'Cormorant Garamond',serif", color:T.text }}>Delete Trip?</h3>
        <p style={{ fontSize:13, color:T.textMuted, lineHeight:1.7, marginBottom:24 }}>
          Permanently delete <strong style={{ color:T.text }}>"{trip?.title}"</strong> along with all activities, expenses, and checklists. This cannot be undone.
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:11, borderRadius:10, border:`1.5px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:11, borderRadius:10, border:'1px solid rgba(220,38,38,0.25)', background:'rgba(220,38,38,0.07)', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Delete Forever</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const qc = useQueryClient()
  const [showCreate,   setShowCreate]   = useState(false)
  const [showJoin,     setShowJoin]     = useState(false)
  const [editTrip,     setEditTrip]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('all')

  const { T } = useTheme()

  const { data: trips=[], isLoading } = useQuery({ queryKey:['trips'], queryFn:fetchTrips })

  const { mutate: deleteTrip } = useMutation({
    mutationFn: id => api.delete(`/trips/${id}`),
    onSuccess: () => { qc.invalidateQueries({queryKey:['trips']}); toast.success('Trip deleted'); setDeleteTarget(null) },
    onError:   () => toast.error('Failed to delete trip'),
  })

  const { mutate: archiveTrip } = useMutation({
    mutationFn: ({ id, archive }) => api.patch(`/trips/${id}`, { status: archive ? 'archived' : null }),
    onSuccess: (_,{ archive }) => { qc.invalidateQueries({queryKey:['trips']}); toast.success(archive?'Trip archived':'Trip unarchived') },
    onError: () => toast.error('Failed to update trip'),
  })

  const { mutate: uploadCover } = useMutation({
    mutationFn: ({ id, file }) => { const fd=new FormData(); fd.append('file',file); return api.post(`/upload/trip/${id}`,fd,{headers:{'Content-Type':'multipart/form-data'}}) },
    onSuccess: () => { qc.invalidateQueries({queryKey:['trips']}); toast.success('Cover updated!') },
    onError:   () => toast.error('Upload failed'),
  })

  const filtered = trips.filter(t => {
    const ms = t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
    const mf = filter==='all' || tripStatus(t)===filter
    return ms && mf
  })

  const FILTERS = [
    { key:'all',      label:'All',      count: trips.length },
    { key:'ongoing',  label:'Ongoing',  count: trips.filter(t=>tripStatus(t)==='ongoing').length  },
    { key:'upcoming', label:'Upcoming', count: trips.filter(t=>tripStatus(t)==='upcoming').length },
    { key:'past',     label:'Past',     count: trips.filter(t=>tripStatus(t)==='past').length     },
    { key:'archived', label:'Archived', count: trips.filter(t=>tripStatus(t)==='archived').length },
  ]

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", transition:'background .3s, color .3s', color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }
        @keyframes spin { to { transform:rotate(360deg) } }

        /* ── Stats ── */
        .stats-grid { grid-template-columns:repeat(4,1fr) }
        @media(max-width:640px){ .stats-grid { grid-template-columns:repeat(2,1fr) } }

        /* ── Trip grid ── */
        .trip-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:16px }
        @media(max-width:500px){ .trip-grid { grid-template-columns:1fr } }

        /* ── Filter pills ── */
        .filter-bar { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; -webkit-overflow-scrolling:touch }
        .filter-bar::-webkit-scrollbar { display:none }

        /* ── Card hover ── */
        .trip-card:hover { transform:translateY(-3px); box-shadow:0 10px 32px ${T.shadow} !important; border-color:${T.deepTeal}40 !important }

        /* ── Dash header responsive ── */
        @media(max-width:500px){
          .dash-head  { flex-direction:column; align-items:flex-start !important }
          .dash-acts  { width:100% }
          .dash-acts button { flex:1; justify-content:center }
        }

        /* ── Date picker ── */
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4) }
        select option { background:${T.bgCard}; color:${T.text} }

        /* ── Search focus ── */
        .dash-search:focus { border-color:${T.deepTeal} !important; box-shadow:0 0 0 3px ${T.deepTeal}18 !important }
        .dash-search::placeholder { color:${T.textMuted} }
      `}</style>

      {/* ── Modals ── */}
      {(showCreate||editTrip) && <TripModal existing={editTrip} T={T} onClose={() => { setShowCreate(false); setEditTrip(null) }} />}
      {showJoin     && <JoinModal   T={T} onClose={() => setShowJoin(false)} />}
      {deleteTarget && <DeleteModal T={T} trip={deleteTarget} onConfirm={() => deleteTrip(deleteTarget._id)} onClose={() => setDeleteTarget(null)} />}

      {/* ── Top bar ─────────────────────────────────────────── */}
      {/* Removed — AppLayout sidebar owns the logo & global nav */}

      {/* ── Page content ──────────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>

        {/* Page heading */}
        <div className="dash-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24, gap:14, flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:12, letterSpacing:2.5, textTransform:'uppercase', fontWeight:600, color:T.textMuted, marginBottom:6 }}>Dashboard</p>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,4vw,36px)', fontWeight:700, color:T.text, lineHeight:1.05, letterSpacing:'-.5px' }}>
              My Trips
            </h1>
            {!isLoading && trips.length > 0 && (
              <p style={{ fontSize:13, color:T.textMuted, marginTop:5 }}>
                {trips.filter(t=>tripStatus(t)!=='archived').length} active · {trips.filter(t=>tripStatus(t)==='upcoming').length} upcoming
              </p>
            )}
          </div>
          {/* Actions live here — no duplicate logo bar */}
          <div className="dash-acts" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setShowJoin(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:`1.5px solid ${T.border}`, background:'none', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.deepTeal}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <Hash size={13}/> Join
            </button>
            <button onClick={() => setShowCreate(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:`0 4px 14px ${T.deepTeal}35`, transition:'opacity .15s', fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>e.currentTarget.style.opacity='.88'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
              <Plus size={13}/> New Trip
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!isLoading && trips.length>0 && <StatsBar trips={trips} T={T} />}

        {/* Search + Filter */}
        {trips.length>0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:22 }}>
            {/* Search */}
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }} />
              <input className="dash-search" placeholder="Search trips…"
                style={{ width:'100%', padding:'10px 13px 10px 36px', borderRadius:10, background:T.bgCard, border:`1.5px solid ${T.border}`, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .2s, box-shadow .2s' }}
                value={search} onChange={e=>setSearch(e.target.value)} />
            </div>

            {/* Filter pills */}
            <div className="filter-bar">
              {FILTERS.map(f => {
                const active = filter===f.key
                return (
                  <button key={f.key} onClick={()=>setFilter(f.key)}
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:9, border:`1.5px solid ${active?T.deepTeal:T.border}`, background:active?`${T.deepTeal}12`:'none', color:active?T.deepTeal:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s', whiteSpace:'nowrap' }}>
                    {f.label}
                    {f.count>0 && <span style={{ background:active?`${T.deepTeal}20`:T.bgAlt, color:active?T.deepTeal:T.textMuted, padding:'1px 6px', borderRadius:20, fontSize:10, fontWeight:700 }}>{f.count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
            <Loader2 size={26} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && trips.length===0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', textAlign:'center' }}>
            <div style={{ width:72, height:72, borderRadius:20, background:`${T.deepTeal}12`, border:`1px solid ${T.deepTeal}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, marginBottom:20 }}>🗺️</div>
            <h3 style={{ fontSize:22, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", marginBottom:8, color:T.text }}>No trips yet</h3>
            <p style={{ fontSize:13, color:T.textMuted, maxWidth:280, lineHeight:1.7, marginBottom:26 }}>Create your first trip or join one with an invite code from a friend.</p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              <button onClick={()=>setShowJoin(true)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'none', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s' }}>
                <Hash size={14}/> Join with Code
              </button>
              <button onClick={()=>setShowCreate(true)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 16px ${T.deepTeal}35` }}>
                <Plus size={14}/> Create Trip
              </button>
            </div>
          </div>
        )}

        {/* No search results */}
        {!isLoading && trips.length>0 && filtered.length===0 && (
          <div style={{ textAlign:'center', padding:'56px 0' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:T.bgAlt, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Search size={20} color={T.textMuted} />
            </div>
            <p style={{ fontSize:14, color:T.textMuted, marginBottom:14 }}>No trips match your filters</p>
            <button onClick={()=>{setSearch('');setFilter('all')}}
              style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Clear filters
            </button>
          </div>
        )}

        {/* Trip grid */}
        {!isLoading && filtered.length>0 && (
          <div className="trip-grid">
            {filtered.map(trip => (
              <TripCard key={trip._id} trip={trip} T={T}
                onDelete={t          => setDeleteTarget(t)}
                onArchive={(id,arch) => archiveTrip({id,archive:arch})}
                onEdit={t            => setEditTrip(t)}
                onImageUpload={(id,file) => uploadCover({id,file})}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}