import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import {
  Sparkles, X, Send, Loader2, MapPin,
  ChevronDown, Calendar, Wallet, CheckSquare,
  Plus, RotateCcw,
} from 'lucide-react'

/* ── System prompt ── */
const SYSTEM = `You are TripSync AI, an expert travel planner. Help users plan trips through friendly conversation.

Ask clarifying questions one or two at a time to understand:
- Destination(s)
- Travel dates and duration  
- Number of travelers and who (couple, family, friends, solo)
- Budget range (budget/mid-range/luxury)
- Travel style (adventure, culture, relaxation, food, mix)
- Any special requirements or interests

Once you have enough info (after 3-5 messages), generate a complete trip plan in this EXACT JSON format wrapped in <TRIP_PLAN> tags:

<TRIP_PLAN>
{
  "title": "Trip title",
  "destination": "City, Country",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "currency": "USD",
  "budgetLimit": 2000,
  "summary": "A brief engaging description of the trip",
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Arrival & Old Town Exploration",
      "activities": [
        { "title": "Check in to hotel", "time": "14:00", "duration": 30, "type": "accommodation", "notes": "Rest after flight", "cost": 0 },
        { "title": "Walk the Old Town", "time": "16:00", "duration": 120, "type": "sightseeing", "notes": "Visit the main square", "cost": 0 },
        { "title": "Dinner at local restaurant", "time": "19:30", "duration": 90, "type": "food", "notes": "Try local cuisine", "cost": 40 }
      ]
    }
  ],
  "budget": [
    { "title": "Flights (round trip)", "amount": 600, "category": "transport" },
    { "title": "Hotel (5 nights)", "amount": 750, "category": "lodging" },
    { "title": "Food & dining", "amount": 300, "category": "food" },
    { "title": "Activities & tours", "amount": 200, "category": "activities" },
    { "title": "Shopping & souvenirs", "amount": 150, "category": "shopping" }
  ],
  "checklist": {
    "packing": ["Passport", "Travel adapter", "Comfortable walking shoes", "Light jacket", "Sunscreen"],
    "todo": ["Book flights", "Reserve hotels", "Get travel insurance", "Notify bank of travel", "Download offline maps"],
    "custom": []
  }
}
</TRIP_PLAN>

After the JSON, add a friendly 2-3 sentence summary of the plan. Keep messages conversational and enthusiastic. Use emojis sparingly.`

/* ── Parse AI response for trip plan JSON ── */
function extractPlan(text) {
  // Try <TRIP_PLAN> tags first
  const match = text.match(/<TRIP_PLAN>([\s\S]*?)<\/TRIP_PLAN>/)
  if (match) {
    let raw = match[1].trim()
    // Strip markdown code fences if Llama wraps JSON in ```json ... ```
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    try { return JSON.parse(raw) } catch(e) { console.warn('[AI] JSON parse failed:', e.message, raw.slice(0,200)) }
  }
  // Fallback: find any JSON object in the text with a "title" and "itinerary" field
  const jsonMatch = text.match(/\{[\s\S]*"itinerary"[\s\S]*\}/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) } catch { }
  }
  return null
}

function cleanText(text) {
  return text.replace(/<TRIP_PLAN>[\s\S]*?<\/TRIP_PLAN>/g, '').replace(/```json[\s\S]*?```/g, '').trim()
}

/* ── Message bubble ── */
function Bubble({ msg, T }) {
  const isAI = msg.role === 'assistant'
  return (
    <div style={{ display:'flex', flexDirection: isAI ? 'row' : 'row-reverse', gap:8, alignItems:'flex-start', marginBottom:14 }}>
      {isAI && (
        <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
          <Sparkles size={12} color="#fff"/>
        </div>
      )}
      <div style={{
        maxWidth:'80%', padding:'10px 14px', borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background:  isAI ? T.bgAlt : `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`,
        color:       isAI ? T.text  : '#fff',
        fontSize:13, lineHeight:1.6, fontFamily:"'DM Sans',sans-serif",
        border: isAI ? `1px solid ${T.border}` : 'none',
        boxShadow: isAI ? 'none' : `0 3px 12px ${T.deepTeal}35`,
      }}>
        {msg.content}
      </div>
    </div>
  )
}

/* ── Plan preview card ── */
function PlanCard({ plan, onCreateTrip, isCreating, T }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:`1.5px solid ${T.deepTeal}40`, borderRadius:14, overflow:'hidden', background:T.bgCard, margin:'8px 0', fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', background:`linear-gradient(135deg,${T.deepTeal}12,${T.skyTeal}08)`, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <Sparkles size={12} color={T.deepTeal}/>
          <span style={{ fontSize:10, fontWeight:800, color:T.deepTeal, letterSpacing:1.5, textTransform:'uppercase' }}>Trip Plan Ready</span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color:T.text, lineHeight:1.1, marginBottom:4 }}>{plan.title}</h3>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:T.textMuted, display:'flex', alignItems:'center', gap:4 }}>
            <MapPin size={10}/> {plan.destination}
          </span>
          <span style={{ fontSize:11, color:T.textMuted, display:'flex', alignItems:'center', gap:4 }}>
            <Calendar size={10}/> {plan.startDate} → {plan.endDate}
          </span>
          {plan.budgetLimit > 0 && (
            <span style={{ fontSize:11, color:T.textMuted, display:'flex', alignItems:'center', gap:4 }}>
              <Wallet size={10}/> {plan.currency} {plan.budgetLimit.toLocaleString()} budget
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:`1px solid ${T.border}` }}>
        {[
          { icon:'🗓️', label:'Days',       value: plan.itinerary?.length || 0 },
          { icon:'💰', label:'Budget items', value: plan.budget?.length || 0 },
          { icon:'✅', label:'Checklist',   value: (plan.checklist?.packing?.length||0) + (plan.checklist?.todo?.length||0) },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', padding:'10px 6px' }}>
            <div style={{ fontSize:14, marginBottom:2 }}>{s.icon}</div>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif" }}>{s.value}</div>
            <div style={{ fontSize:10, color:T.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Expandable preview */}
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width:'100%', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', borderBottom: open ? `1px solid ${T.border}` : 'none', fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ fontSize:12, fontWeight:600, color:T.textMid }}>Preview itinerary</span>
        <ChevronDown size={13} color={T.textMuted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}/>
      </button>

      {open && (
        <div style={{ maxHeight:240, overflowY:'auto', padding:'12px 16px' }}>
          {plan.itinerary?.map(day => (
            <div key={day.day} style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:T.deepTeal, marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Day {day.day} · {day.theme}</p>
              {day.activities?.map((a, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:4, paddingLeft:8, borderLeft:`2px solid ${T.border}` }}>
                  <span style={{ fontSize:10, color:T.textMuted, flexShrink:0, marginTop:1 }}>{a.time}</span>
                  <span style={{ fontSize:12, color:T.text }}>{a.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding:'12px 16px' }}>
        <button onClick={onCreateTrip} disabled={isCreating}
          style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:isCreating?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:isCreating?.7:1, boxShadow:`0 4px 14px ${T.deepTeal}35` }}>
          {isCreating ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Plus size={14}/>}
          {isCreating ? 'Creating your trip…' : 'Create Trip from This Plan'}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function AIPlannerChat() {
  const { T } = useTheme()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "✈️ Hi! I'm TripSync AI — your personal trip planner. Tell me where you'd like to go and I'll craft a detailed itinerary, budget, and packing list just for you. Where are you dreaming of traveling?" }
  ])
  const [isLoading, setIsLoading]   = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')

    const newMessages = [...messages, { role:'user', content: text }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const { data } = await api.post('/ai/plan', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content }))
      })
      const reply = data.data?.content || "Sorry, I couldn't generate a response. Please try again."
      const plan  = extractPlan(reply)
      const clean = cleanText(reply)

      console.log('[AI] raw reply:', reply.slice(0, 500))
      console.log('[AI] plan extracted:', plan ? 'YES ✅' : 'NO ❌')

      setMessages(prev => [...prev, { role:'assistant', content: clean }])

      if (plan) {
        // Auto-create the trip immediately
        setMessages(prev => [...prev, { role:'assistant', content: '⚡ Plan ready! Creating your trip now…' }])
        setPendingPlan(plan)
        autoCreateTrip(plan)
      } else if (reply.includes('TRIP_PLAN') || reply.includes('itinerary')) {
        setMessages(prev => [...prev, { role:'assistant', content: '⚠️ I generated a plan but had trouble formatting it. Could you ask me to try again?' }])
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Connection error. Please try again.'
      setMessages(prev => [...prev, { role:'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const reset = () => {
    setMessages([{ role:'assistant', content: "✈️ Hi! I'm TripSync AI — your personal trip planner. Tell me where you'd like to go and I'll craft a detailed itinerary, budget, and packing list just for you. Where are you dreaming of traveling?" }])
    setPendingPlan(null)
    setInput('')
  }

  /* ── Auto-create trip from plan (called automatically) ── */
  const autoCreateTrip = async (plan) => {
    if (!plan || isCreating) return
    setIsCreating(true)
    try {
      const startISO = new Date(plan.startDate).toISOString()
      const endISO   = new Date(plan.endDate).toISOString()
      console.log('[AI] Auto-creating trip:', plan.title)

      // 1. Create trip
      const { data: tripData } = await api.post('/trips', {
        title:       plan.title,
        destination: plan.destination,
        startDate:   startISO,
        endDate:     endISO,
        currency:    plan.currency || 'USD',
        budgetLimit: Number(plan.budgetLimit) || 0,
        description: plan.summary || '',
      })
      const tripId = tripData.data?._id
      if (!tripId) throw new Error('Trip creation failed — no ID returned')
      console.log('[AI] Trip created:', tripId)

      // 2. Activities
      if (plan.itinerary?.length > 0) {
        for (const day of plan.itinerary) {
          const dayIndex = (day.day || 1) - 1
          for (const a of (day.activities || [])) {
            try {
              const startTime = a.time && day.date ? `${day.date}T${a.time}:00` : undefined
              const endTime   = startTime && a.duration
                ? new Date(new Date(startTime).getTime() + a.duration * 60000).toISOString()
                : undefined

              // Map AI-generated types to Activity model enum: ['activity','food','transport','lodging','other']
              const typeMap = {
                activity:      'activity',
                sightseeing:   'activity',
                culture:       'activity',
                adventure:     'activity',
                relaxation:    'activity',
                shopping:      'activity',
                entertainment: 'activity',
                food:          'food',
                drink:         'food',
                restaurant:    'food',
                transport:     'transport',
                flight:        'transport',
                train:         'transport',
                bus:           'transport',
                transfer:      'transport',
                lodging:       'lodging',
                accommodation: 'lodging',
                hotel:         'lodging',
                hostel:        'lodging',
                other:         'other',
              }
              const safeType = typeMap[a.type?.toLowerCase()] || 'activity'

              await api.post(`/trips/${tripId}/activities`, {
                title: a.title,
                type:  safeType,
                notes: a.notes || '',
                dayIndex,
                estimatedCost: a.cost || 0,
                startTime,
                endTime,
              })
            } catch(e) { console.warn('[AI] activity failed:', e.response?.data || e.message) }
          }
        }
      }
      console.log('[AI] Activities created')

      // 3. Budget expenses
      if (plan.budget?.length > 0) {
        for (const b of plan.budget) {
          try {
            await api.post(`/trips/${tripId}/expenses`, {
              title: b.title, amount: b.amount, category: b.category || 'other',
            })
          } catch(e) { console.warn('[AI] expense failed:', e.message) }
        }
      }
      console.log('[AI] Expenses created')

      // 4. Checklists
      const checklistDefs = [
        { key:'packing', title:'🎒 Packing List', type:'packing' },
        { key:'todo',    title:'✅ To-Do List',   type:'todo'    },
      ]
      for (const def of checklistDefs) {
        const items = plan.checklist?.[def.key] || []
        if (!items.length) continue
        try {
          const { data: clData } = await api.post(`/trips/${tripId}/checklists`, { title: def.title, type: def.type })
          const clId = clData.data?._id
          if (!clId) continue
          for (const item of items) {
            try { await api.post(`/checklists/${clId}/items`, { text: item }) }
            catch(e) { console.warn('[AI] checklist item failed:', e.message) }
          }
        } catch(e) { console.warn('[AI] checklist failed:', e.message) }
      }
      console.log('[AI] Checklists created')

      qc.invalidateQueries(['trips'])
      toast.success('✈️ Trip created from AI plan!')
      setOpen(false)
      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error('[AI] autoCreateTrip failed:', err.response?.data || err.message)
      setMessages(prev => [...prev, { role:'assistant', content: `❌ Failed to create trip: ${err.response?.data?.message || err.message}` }])
      toast.error(err.response?.data?.message || 'Failed to create trip')
    } finally {
      setIsCreating(false)
    }
  }

  /* ── Create trip from AI plan ── */
  const createTripFromPlan = async () => {
    if (!pendingPlan || isCreating) return
    setIsCreating(true)
    console.log('[AI] Creating trip from plan:', pendingPlan.title)
    try {
      // 1. Create the trip
      // Convert YYYY-MM-DD to ISO string to match what TripModal sends
      const startISO = new Date(pendingPlan.startDate).toISOString()
      const endISO   = new Date(pendingPlan.endDate).toISOString()
      console.log('[AI] Step 1: posting /trips', { title: pendingPlan.title, startDate: startISO, endDate: endISO })
      const { data: tripData } = await api.post('/trips', {
        title:       pendingPlan.title,
        destination: pendingPlan.destination,
        startDate:   startISO,
        endDate:     endISO,
        currency:    pendingPlan.currency || 'USD',
        budgetLimit: Number(pendingPlan.budgetLimit) || 0,
        description: pendingPlan.summary || '',
      })
      const trip = tripData.data
      const tripId = trip._id
      console.log('[AI] Step 1 OK: tripId =', tripId)

      // 2. Create activities (itinerary)
      console.log('[AI] Step 2: creating activities, days =', pendingPlan.itinerary?.length)
      if (pendingPlan.itinerary?.length > 0) {
        for (const day of pendingPlan.itinerary) {
          const dayIndex = (day.day || 1) - 1  // convert 1-based to 0-based
          for (const a of (day.activities || [])) {
            try {
              const startTime = a.time && day.date ? `${day.date}T${a.time}:00` : undefined
              const endTime = startTime && a.duration
                ? new Date(new Date(startTime).getTime() + a.duration * 60000).toISOString()
                : undefined
              await api.post(`/trips/${tripId}/activities`, {
                title:         a.title,
                type:          a.type || 'sightseeing',
                notes:         a.notes || '',
                dayIndex,
                estimatedCost: a.cost || 0,
                startTime,
                endTime,
              })
            } catch { /* skip failed activity */ }
          }
        }
      }

      // 3. Create budget expenses
      console.log('[AI] Step 3: creating expenses, count =', pendingPlan.budget?.length)
      if (pendingPlan.budget?.length > 0) {
        for (const b of pendingPlan.budget) {
          try {
            await api.post(`/trips/${tripId}/expenses`, {
              title:    b.title,
              amount:   b.amount,
              category: b.category || 'other',
            })
          } catch { /* skip */ }
        }
      }

      // 4. Create checklists
      console.log('[AI] Step 4: creating checklists')
      // Backend routes: POST /trips/:id/checklists → POST /checklists/:id/items
      const checklistDefs = [
        { key: 'packing', title: '🎒 Packing List', type: 'packing' },
        { key: 'todo',    title: '✅ To-Do List',   type: 'todo'    },
      ]
      for (const def of checklistDefs) {
        const items = pendingPlan.checklist?.[def.key] || []
        if (items.length === 0) continue
        try {
          const { data: clData } = await api.post(`/trips/${tripId}/checklists`, {
            title: def.title,
            type:  def.type,
          })
          const clId = clData.data?._id
          if (!clId) continue
          for (const item of items) {
            try { await api.post(`/checklists/${clId}/items`, { text: item }) } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      qc.invalidateQueries(['trips'])
      toast.success('Trip created from AI plan! 🎉')
      setOpen(false)
      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error('[AI] createTripFromPlan failed:', err.response?.data || err.message)
      toast.error(err.response?.data?.message || err.message || 'Failed to create trip')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes ai-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ai-pop { from{transform:scale(.85) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes ai-pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
      `}</style>

      {/* ── Floating button ── */}
      <div style={{ position:'fixed', bottom:28, right:28, zIndex:1000 }}>
        {/* Pulse ring */}
        {!open && (
          <div style={{ position:'absolute', inset:-4, borderRadius:'50%', background:`${T.deepTeal}40`, animation:'ai-pulse-ring 2s ease-out infinite', pointerEvents:'none' }}/>
        )}
        <button onClick={() => setOpen(p => !p)}
          title="AI Trip Planner"
          style={{ width:56, height:56, borderRadius:'50%', border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 24px ${T.deepTeal}50`, animation: open ? 'none' : 'ai-float 3s ease-in-out infinite', transition:'transform .2s, box-shadow .2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow=`0 8px 30px ${T.deepTeal}60` }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow=`0 6px 24px ${T.deepTeal}50` }}>
          {open ? <X size={20}/> : <Sparkles size={22}/>}
        </button>
      </div>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{ position:'fixed', bottom:96, right:28, zIndex:999, width:'min(420px, calc(100vw - 32px))', height:'min(620px, calc(100vh - 120px))', display:'flex', flexDirection:'column', background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, boxShadow:`0 20px 60px ${T.shadow}`, animation:'ai-pop .25s cubic-bezier(.175,.885,.32,1.275)', overflow:'hidden', fontFamily:"'DM Sans',sans-serif" }}>

          {/* Header */}
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${T.border}`, background:`linear-gradient(135deg,${T.deepTeal}12,${T.skyTeal}08)`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={15} color="#fff"/>
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1 }}>TripSync AI</p>
                <p style={{ fontSize:10, color:T.textMuted }}>✦ Powered by Llama 3</p>
              </div>
            </div>
            <button onClick={reset} title="New conversation"
              style={{ width:28, height:28, borderRadius:8, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color=T.deepTeal; e.currentTarget.style.borderColor=T.deepTeal }}
              onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
              <RotateCcw size={12}/>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column' }}>
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} T={T}/>
            ))}

            {/* Show plan card whenever a plan exists */}
            {pendingPlan && (
              <PlanCard plan={pendingPlan} onCreateTrip={createTripFromPlan} isCreating={isCreating} T={T}/>
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Sparkles size={12} color="#fff"/>
                </div>
                <div style={{ padding:'10px 14px', borderRadius:'4px 14px 14px 14px', background:T.bgAlt, border:`1px solid ${T.border}`, display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:T.deepTeal, animation:`ts-pulse 1.2s ease-in-out ${i*.2}s infinite` }}/>
                  ))}
                  <style>{`@keyframes ts-pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}`}</style>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick suggestion chips — only show at start */}
          {messages.length === 1 && (
            <div style={{ padding:'0 14px 10px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
              {['🏝️ Beach getaway for a week', '🏙️ 3-day city break in Europe', '🏔️ Adventure trip in Asia'].map(s => (
                <button key={s} type="button"
                  onClick={() => { setInput(s.slice(2).trim()); setTimeout(() => inputRef.current?.focus(), 50) }}
                  style={{ padding:'5px 10px', borderRadius:99, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMid, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=T.deepTeal; e.currentTarget.style.color=T.deepTeal }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=T.border;   e.currentTarget.style.color=T.textMid }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 14px', borderTop:`1px solid ${T.border}`, display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
            <textarea ref={inputRef}
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask me to plan your trip…"
              rows={1}
              style={{ flex:1, padding:'10px 13px', borderRadius:12, border:`1.5px solid ${T.border}`, background:T.inputBg || T.bgAlt, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", resize:'none', maxHeight:100, lineHeight:1.5, transition:'border-color .15s', overflowY:'auto' }}
              onFocus={e => e.target.style.borderColor=T.deepTeal}
              onBlur={e => e.target.style.borderColor=T.border}
              onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px' }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || isLoading}
              style={{ width:38, height:38, borderRadius:10, border:'none', background: input.trim() && !isLoading ? `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})` : T.bgAlt, color: input.trim() && !isLoading ? '#fff' : T.textMuted, cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s', boxShadow: input.trim() && !isLoading ? `0 3px 10px ${T.deepTeal}35` : 'none' }}>
              {isLoading ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={15}/>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}