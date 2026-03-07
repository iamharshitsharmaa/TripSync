import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import {
  Plus, Trash2, Wallet, TrendingUp, TrendingDown,
  Receipt, Users, X, ChevronDown, Loader2,
  ArrowRight, CheckCircle2, SplitSquareHorizontal,
} from 'lucide-react'

/* ── Categories ── */
const CATEGORIES = [
  { value:'food',       label:'Food & Dining', emoji:'🍽️' },
  { value:'transport',  label:'Transport',      emoji:'🚌' },
  { value:'lodging',    label:'Lodging',        emoji:'🏨' },
  { value:'activities', label:'Activities',     emoji:'🎯' },
  { value:'shopping',   label:'Shopping',       emoji:'🛍️' },
  { value:'health',     label:'Health',         emoji:'💊' },
  { value:'other',      label:'Other',          emoji:'📌' },
]
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

const fmt = (n, currency = 'USD') => {
  try { return new Intl.NumberFormat('en', { style:'currency', currency, maximumFractionDigits:0 }).format(n) }
  catch { return `${currency} ${Number(n).toLocaleString()}` }
}
const fmtD = (n, currency = 'USD') => {
  try { return new Intl.NumberFormat('en', { style:'currency', currency, maximumFractionDigits:2 }).format(n) }
  catch { return `${currency} ${Number(n).toFixed(2)}` }
}

const fetchExpenses = (tripId) =>
  api.get(`/trips/${tripId}/expenses`).then(r => {
    const d = r.data
    if (import.meta.env.DEV) console.log('[BudgetPanel] expenses raw:', d)
    if (Array.isArray(d))                   return d
    if (Array.isArray(d?.data))             return d.data
    if (Array.isArray(d?.expenses))         return d.expenses
    if (Array.isArray(d?.results))          return d.results
    if (Array.isArray(d?.data?.expenses))   return d.data.expenses
    if (Array.isArray(d?.data?.data))       return d.data.data
    if (d && typeof d === 'object') {
      const found = Object.values(d).find(v => Array.isArray(v))
      if (found) return found
    }
    return []
  })

/* ══════════════════════════════════════════════════════════
   SETTLEMENT CALCULATOR
   Returns: [{ from, fromName, to, toName, amount }]
══════════════════════════════════════════════════════════ */
function calcSettlements(expenses, members) {
  // Build balance map: userId → net balance (positive = owed money, negative = owes money)
  const balance = {}
  const nameMap  = {}

  members.forEach(m => {
    const uid = m.user?._id?.toString() || m._id?.toString()
    if (uid) { balance[uid] = 0; nameMap[uid] = m.user?.name || 'Unknown' }
  })

  expenses.forEach(exp => {
    const payerId = exp.paidBy?._id?.toString() || exp.paidBy?.toString()
    if (!payerId) return

    if (exp.splits?.length > 0) {
      // Expense has explicit splits
      exp.splits.forEach(split => {
        const uid = split.user?.toString() || split.userId?.toString()
        if (!uid || split.settled) return
        if (uid !== payerId) {
          // uid owes payerId this split amount
          if (balance[payerId] !== undefined) balance[payerId] += split.amount
          if (balance[uid]     !== undefined) balance[uid]     -= split.amount
        }
      })
    } else {
      // No splits — payer paid everything, equally split among all members
      const memberCount = members.length
      if (memberCount < 2) return
      const share = exp.amount / memberCount
      members.forEach(m => {
        const uid = m.user?._id?.toString() || m._id?.toString()
        if (!uid) return
        if (uid === payerId) {
          balance[uid] = (balance[uid] || 0) + exp.amount - share
        } else {
          balance[uid] = (balance[uid] || 0) - share
        }
      })
    }
  })

  // Simplify debts — greedy algorithm
  const settlements = []
  const debtors  = Object.entries(balance).filter(([,v]) => v < -0.01).sort((a,b) => a[1]-b[1])
  const creditors = Object.entries(balance).filter(([,v]) => v >  0.01).sort((a,b) => b[1]-a[1])

  let i = 0, j = 0
  const d = debtors.map(([id,v]) => ({ id, amt: -v }))
  const c = creditors.map(([id,v]) => ({ id, amt: v }))

  while (i < d.length && j < c.length) {
    const pay = Math.min(d[i].amt, c[j].amt)
    if (pay > 0.01) {
      settlements.push({
        from:     d[i].id,
        fromName: nameMap[d[i].id] || d[i].id,
        to:       c[j].id,
        toName:   nameMap[c[j].id] || c[j].id,
        amount:   Math.round(pay * 100) / 100,
      })
    }
    d[i].amt -= pay
    c[j].amt -= pay
    if (d[i].amt < 0.01) i++
    if (c[j].amt < 0.01) j++
  }

  return settlements
}

/* ══════════════════════════════════════════════════════════
   ADD EXPENSE MODAL
══════════════════════════════════════════════════════════ */
function AddExpenseModal({ tripId, currency, members, onClose }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', amount: '', category: 'food', paidBy: '', notes: '',
  })
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splitMode,    setSplitMode]    = useState('equal') // 'equal' | 'custom'
  const [splitMembers, setSplitMembers] = useState([])      // selected member ids for equal
  const [customSplits, setCustomSplits] = useState({})      // { memberId: amount string }

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  // When amount changes, recalc equal splits
  const amount = parseFloat(form.amount) || 0
  const equalShare = splitMembers.length > 0 ? (amount / splitMembers.length) : 0

  const toggleSplitMember = (uid) => {
    setSplitMembers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  const customTotal = Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const customValid = Math.abs(customTotal - amount) < 0.01

  const { mutate, isPending } = useMutation({
    mutationFn: d => api.post(`/trips/${tripId}/expenses`, d).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries(['expenses', tripId]); toast.success('Expense added!'); onClose() },
    onError:   e => toast.error(e.response?.data?.message || 'Failed to add expense'),
  })

  const submit = e => {
    e.preventDefault()
    if (!form.title.trim())             return toast.error('Title is required')
    if (!form.amount || isNaN(amount))  return toast.error('Valid amount required')

    let splits = []
    if (splitEnabled && amount > 0) {
      if (splitMode === 'equal') {
        if (splitMembers.length < 2) return toast.error('Select at least 2 members to split')
        splits = splitMembers.map(uid => ({
          user:   uid,
          amount: Math.round((amount / splitMembers.length) * 100) / 100,
        }))
      } else {
        if (!customValid) return toast.error(`Custom splits must sum to ${fmtD(amount, currency)}`)
        splits = Object.entries(customSplits)
          .filter(([,v]) => parseFloat(v) > 0)
          .map(([uid, v]) => ({ user: uid, amount: parseFloat(v) }))
      }
    }

    mutate({ ...form, amount, currency, splits })
  }

  const IS = { width:'100%', padding:'10px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const LS = { fontSize:11, fontWeight:600, color:T.textMuted, display:'block', marginBottom:5, letterSpacing:.3 }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(14,26,28,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(5px)', overflowY:'auto' }}
      onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, width:'100%', maxWidth:460, padding:'22px 20px', boxShadow:`0 28px 72px ${T.shadow}`, fontFamily:"'DM Sans',sans-serif", margin:'auto' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase', color:T.deepTeal, marginBottom:4 }}>New Entry</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.text, lineHeight:1 }}>Add Expense</h2>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={13}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={LS}>Description *</label>
            <input placeholder="e.g. Dinner at rooftop restaurant" required style={IS}
              value={form.title} onChange={set('title')} onFocus={focus} onBlur={blur}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={LS}>Amount * ({currency})</label>
              <input type="number" placeholder="0" min="0" step="0.01" required style={IS}
                value={form.amount} onChange={set('amount')} onFocus={focus} onBlur={blur}/>
            </div>
            <div>
              <label style={LS}>Paid By</label>
              <select style={{ ...IS, cursor:'pointer' }} value={form.paidBy} onChange={set('paidBy')} onFocus={focus} onBlur={blur}>
                <option value="">— Select member —</option>
                {members?.map(m => (
                  <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                    {m.user?.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div>
            <label style={LS}>Category</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {CATEGORIES.map(c => {
                const active = form.category === c.value
                return (
                  <button key={c.value} type="button" onClick={() => setForm(p => ({ ...p, category: c.value }))}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                      border:`1.5px solid ${active ? T.deepTeal : T.border}`,
                      background: active ? `${T.deepTeal}12` : 'none',
                      color:      active ? T.deepTeal : T.textMuted,
                    }}>
                    <span>{c.emoji}</span>{c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={LS}>Notes</label>
            <input placeholder="Optional" style={IS} value={form.notes} onChange={set('notes')} onFocus={focus} onBlur={blur}/>
          </div>

          {/* ── Split toggle ── */}
          {members?.length >= 2 && (
            <div style={{ borderRadius:12, border:`1.5px solid ${splitEnabled ? T.deepTeal : T.border}`, overflow:'hidden', transition:'border-color .2s' }}>
              {/* Toggle header */}
              <button type="button"
                onClick={() => setSplitEnabled(p => !p)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background: splitEnabled ? `${T.deepTeal}0a` : T.bgAlt, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'background .2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <SplitSquareHorizontal size={14} color={splitEnabled ? T.deepTeal : T.textMuted}/>
                  <span style={{ fontSize:13, fontWeight:600, color: splitEnabled ? T.deepTeal : T.textMid }}>Split this expense</span>
                </div>
                {/* Toggle pill */}
                <div style={{ width:36, height:20, borderRadius:99, background: splitEnabled ? T.deepTeal : T.border, position:'relative', transition:'background .2s' }}>
                  <div style={{ position:'absolute', top:2, left: splitEnabled ? 18 : 2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
                </div>
              </button>

              {/* Split options */}
              {splitEnabled && amount > 0 && (
                <div style={{ padding:'14px', borderTop:`1px solid ${T.border}`, background:T.bgCard }}>
                  {/* Mode tabs */}
                  <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                    {['equal','custom'].map(mode => (
                      <button key={mode} type="button" onClick={() => setSplitMode(mode)}
                        style={{ flex:1, padding:'6px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s',
                          border:`1.5px solid ${splitMode === mode ? T.deepTeal : T.border}`,
                          background: splitMode === mode ? `${T.deepTeal}12` : 'none',
                          color:      splitMode === mode ? T.deepTeal : T.textMuted,
                        }}>
                        {mode === 'equal' ? '⚖️ Equal split' : '✏️ Custom split'}
                      </button>
                    ))}
                  </div>

                  {/* Equal split — member checkboxes */}
                  {splitMode === 'equal' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:11, color:T.textMuted }}>Select members to split between</span>
                        <button type="button"
                          onClick={() => setSplitMembers(
                            splitMembers.length === members.length ? [] : members.map(m => m.user?._id || m._id)
                          )}
                          style={{ fontSize:11, color:T.deepTeal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                          {splitMembers.length === members.length ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      {members.map(m => {
                        const uid = m.user?._id || m._id
                        const selected = splitMembers.includes(uid)
                        const share = selected && splitMembers.length > 0 ? equalShare : 0
                        return (
                          <button key={uid} type="button" onClick={() => toggleSplitMember(uid)}
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:9, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s',
                              border:`1.5px solid ${selected ? T.deepTeal : T.border}`,
                              background: selected ? `${T.deepTeal}0a` : 'none',
                            }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              {/* Checkbox */}
                              <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${selected ? T.deepTeal : T.border}`, background: selected ? T.deepTeal : 'none', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', flexShrink:0 }}>
                                {selected && <span style={{ color:'#fff', fontSize:10, fontWeight:800, lineHeight:1 }}>✓</span>}
                              </div>
                              <span style={{ fontSize:13, color: selected ? T.text : T.textMid, fontWeight: selected ? 600 : 400 }}>
                                {m.user?.name || 'Unknown'}
                              </span>
                            </div>
                            {selected && (
                              <span style={{ fontSize:12, fontWeight:700, color:T.deepTeal, fontFamily:"'Cormorant Garamond',serif" }}>
                                {fmtD(share, currency)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                      {splitMembers.length >= 2 && (
                        <p style={{ fontSize:11, color:T.textMuted, textAlign:'center', marginTop:2 }}>
                          {fmtD(equalShare, currency)} each · {splitMembers.length} people
                        </p>
                      )}
                    </div>
                  )}

                  {/* Custom split — amount inputs per member */}
                  {splitMode === 'custom' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      <span style={{ fontSize:11, color:T.textMuted, marginBottom:2 }}>Enter each person's share (must total {fmtD(amount, currency)})</span>
                      {members.map(m => {
                        const uid = m.user?._id || m._id
                        return (
                          <div key={uid} style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ flex:1, fontSize:13, color:T.textMid }}>{m.user?.name || 'Unknown'}</span>
                            <input type="number" min="0" step="0.01" placeholder="0"
                              value={customSplits[uid] || ''}
                              onChange={e => setCustomSplits(p => ({ ...p, [uid]: e.target.value }))}
                              style={{ width:100, padding:'7px 10px', borderRadius:8, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", textAlign:'right', transition:'border-color .15s' }}
                              onFocus={e => e.target.style.borderColor = T.deepTeal}
                              onBlur={e => e.target.style.borderColor = T.border}
                            />
                          </div>
                        )
                      })}
                      {/* Running total */}
                      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:`1px solid ${T.border}`, marginTop:4 }}>
                        <span style={{ fontSize:12, color:T.textMuted }}>Total</span>
                        <span style={{ fontSize:13, fontWeight:700, color: customValid ? T.sage : '#dc2626', fontFamily:"'Cormorant Garamond',serif" }}>
                          {fmtD(customTotal, currency)} / {fmtD(amount, currency)}
                          {customValid ? ' ✓' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {splitEnabled && !amount && (
                <p style={{ padding:'10px 14px', fontSize:12, color:T.textMuted, borderTop:`1px solid ${T.border}` }}>Enter an amount first</p>
              )}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'10px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor=T.deepTeal}
              onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:isPending?'not-allowed':'pointer', opacity:isPending?.7:1, fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 16px ${T.deepTeal}35`, transition:'opacity .15s' }}>
              {isPending ? 'Adding…' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EXPENSE ROW
══════════════════════════════════════════════════════════ */
function ExpenseRow({ expense, currency, role, onDelete, T }) {
  const [hovered, setHovered] = useState(false)
  const cat = CAT[expense.category] || CAT.other
  const paidByName = expense.paidBy?.name || 'Unknown'
  const hasSplits  = expense.splits?.length > 0

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background: hovered ? T.bgCardAlt : 'none', borderRadius:10, transition:'background .15s' }}>

      <div style={{ width:36, height:36, borderRadius:10, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
        {cat.emoji}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {expense.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, color:T.textMuted }}>{cat.label}</span>
          {expense.paidBy && (
            <span style={{ fontSize:10, color:T.textMuted, display:'flex', alignItems:'center', gap:3 }}>
              <Users size={9} color={T.skyTeal}/> {paidByName}
            </span>
          )}
          {hasSplits && (
            <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, background:`${T.deepTeal}14`, color:T.deepTeal, letterSpacing:.3 }}>
              SPLIT {expense.splits.length}
            </span>
          )}
          {expense.notes && (
            <span style={{ fontSize:10, color:T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
              · {expense.notes}
            </span>
          )}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{ fontSize:14, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif" }}>
          {fmt(expense.amount, currency)}
        </span>
        {role !== 'viewer' && (
          <button onClick={() => onDelete(expense._id)}
            style={{ width:26, height:26, borderRadius:7, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:hovered?1:0, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='rgba(220,38,38,.3)'; e.currentTarget.style.background='rgba(220,38,38,.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='none' }}>
            <Trash2 size={11}/>
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SETTLEMENTS PANEL
══════════════════════════════════════════════════════════ */
function SettlementsPanel({ settlements, currency, role, onSettle, T }) {
  if (settlements.length === 0) return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'20px', boxShadow:`0 2px 10px ${T.shadow}`, textAlign:'center' }}>
      <div style={{ fontSize:24, marginBottom:8 }}>🎉</div>
      <p style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>All settled up!</p>
      <p style={{ fontSize:12, color:T.textMuted }}>No outstanding balances</p>
    </div>
  )

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 2px 10px ${T.shadow}` }}>
      <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${T.deepTeal}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ArrowRight size={13} color={T.deepTeal}/>
        </div>
        <div>
          <h3 style={{ fontSize:13, fontWeight:700, color:T.text }}>Settlements</h3>
          <p style={{ fontSize:11, color:T.textMuted }}>{settlements.length} payment{settlements.length !== 1 ? 's' : ''} needed</p>
        </div>
      </div>
      <div style={{ padding:'8px 0' }}>
        {settlements.map((s, i) => (
          <SettlementRow key={i} s={s} currency={currency} role={role} onSettle={onSettle} T={T}/>
        ))}
      </div>
    </div>
  )
}

function SettlementRow({ s, currency, role, onSettle, T }) {
  const [hovered, setHovered] = useState(false)
  const [settling, setSettling] = useState(false)

  const handleSettle = async () => {
    setSettling(true)
    try { await onSettle(s) }
    finally { setSettling(false) }
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background: hovered ? T.bgCardAlt : 'none', transition:'background .15s' }}>

      {/* From avatar */}
      <div style={{ width:32, height:32, borderRadius:'50%', background:`${T.deepTeal}cc`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
        {s.fromName[0]?.toUpperCase()}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{s.fromName}</span>
          <ArrowRight size={11} color={T.textMuted}/>
          <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{s.toName}</span>
        </div>
        <p style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>owes</p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:15, fontWeight:700, color:T.deepTeal, fontFamily:"'Cormorant Garamond',serif" }}>
          {fmtD(s.amount, currency)}
        </span>
        {role !== 'viewer' && (
          <button onClick={handleSettle} disabled={settling}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:`1px solid ${T.sage}`, background: hovered ? `${T.sage}14` : 'none', color:T.sage, fontSize:11, fontWeight:700, cursor:settling?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s', opacity:settling?.6:1, whiteSpace:'nowrap' }}>
            <CheckCircle2 size={11}/>
            {settling ? '…' : 'Mark Settled'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   BUDGET PANEL
══════════════════════════════════════════════════════════ */
export default function BudgetPanel({ tripId, role, currency = 'USD', budgetLimit = 0, members = [], currentUserId }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [showAdd,    setShowAdd]    = useState(false)
  const [catFilter,  setCatFilter]  = useState('all')
  const [activeTab,  setActiveTab]  = useState('expenses') // 'expenses' | 'settlements'

  const { data: _expensesRaw, isLoading } = useQuery({
    queryKey: ['expenses', tripId],
    queryFn:  () => fetchExpenses(tripId),
  })
  const expenses = Array.isArray(_expensesRaw) ? _expensesRaw : []

  const { mutate: deleteExpense } = useMutation({
    mutationFn: id => api.delete(`/expenses/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['expenses', tripId]); toast.success('Expense removed') },
    onError:    () => toast.error('Failed to delete'),
  })

  // Mark settled — adds a "settled" expense entry of $0 to cancel the debt
  // Or call a dedicated /api/expenses/:id/settle endpoint if you have one
  const handleSettle = async (settlement) => {
    try {
      await api.post(`/trips/${tripId}/expenses`, {
        title:    `⚡ Settlement: ${settlement.fromName} → ${settlement.toName}`,
        amount:   settlement.amount,
        category: 'other',
        paidBy:   settlement.from,
        currency,
        splits: [{ user: settlement.to, amount: settlement.amount }],
        isSettlement: true,
      })
      qc.invalidateQueries(['expenses', tripId])
      toast.success(`Marked as settled!`)
    } catch {
      toast.error('Failed to mark settled')
    }
  }

  /* ── Derived stats ── */
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const remaining  = budgetLimit > 0 ? budgetLimit - totalSpent : null
  const pct        = budgetLimit > 0 ? Math.min((totalSpent / budgetLimit) * 100, 100) : 0
  const over       = budgetLimit > 0 && totalSpent > budgetLimit

  const byCategory = CATEGORIES.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.value).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const byMember = members.map(m => {
    const uid  = m.user?._id || m._id
    const name = m.user?.name || 'Unknown'
    const paid = expenses.filter(e => e.paidBy?._id === uid || e.paidBy === uid).reduce((s, e) => s + (e.amount||0), 0)
    return { uid, name, paid }
  }).filter(m => m.paid > 0).sort((a,b) => b.paid - a.paid)

  const filtered = catFilter === 'all' ? expenses : expenses.filter(e => e.category === catFilter)
  const progressColor = over ? '#dc2626' : pct > 80 ? '#d97706' : T.sage

  const settlements = useMemo(() => calcSettlements(expenses, members), [expenses, members])
  const splitExpenses = expenses.filter(e => e.splits?.length > 0)

  /* ── My personal balance ── */
  const myBalance = useMemo(() => {
    if (!currentUserId) return null
    let iPaid = 0      // total I paid
    let iOwe  = 0      // total I owe others
    let owedToMe = 0   // total others owe me

    expenses.forEach(exp => {
      const payerId = exp.paidBy?._id?.toString() || exp.paidBy?.toString()
      const iAmPayer = payerId === currentUserId

      if (exp.splits?.length > 0) {
        // Expense has explicit splits
        exp.splits.forEach(split => {
          const splitUserId = split.user?._id?.toString() || split.user?.toString()
          if (split.settled) return
          if (splitUserId === currentUserId && !iAmPayer) {
            iOwe += split.amount
          } else if (iAmPayer && splitUserId !== currentUserId) {
            owedToMe += split.amount
          }
        })
        if (iAmPayer) iPaid += exp.amount
      } else {
        // No splits — equally shared
        const count = members.length
        if (count < 2) return
        const share = exp.amount / count
        if (iAmPayer) {
          iPaid    += exp.amount
          owedToMe += exp.amount - share  // others owe me their share
        } else {
          iOwe += share  // I owe payer my share
        }
      }
    })

    const net = owedToMe - iOwe  // positive = I'm owed money, negative = I owe money
    return { iPaid, iOwe: Math.round(iOwe*100)/100, owedToMe: Math.round(owedToMe*100)/100, net: Math.round(net*100)/100 }
  }, [expenses, members, currentUserId])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:"'DM Sans',sans-serif" }}>

      {showAdd && (
        <AddExpenseModal tripId={tripId} currency={currency} members={members} onClose={() => setShowAdd(false)}/>
      )}

      {/* ── Summary cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${T.deepTeal}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={13} color={T.deepTeal}/>
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:T.textMuted, textTransform:'uppercase', letterSpacing:.5 }}>Total Spent</span>
          </div>
          <p style={{ fontSize:24, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, lineHeight:1 }}>
            {fmt(totalSpent, currency)}
          </p>
          <p style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{expenses.length} expense{expenses.length!==1?'s':''}</p>
        </div>

        {budgetLimit > 0 && (
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background: over ? 'rgba(220,38,38,.1)' : `${T.sage}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {over ? <TrendingDown size={13} color="#dc2626"/> : <TrendingUp size={13} color={T.sage}/>}
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:T.textMuted, textTransform:'uppercase', letterSpacing:.5 }}>
                {over ? 'Over Budget' : 'Remaining'}
              </span>
            </div>
            <p style={{ fontSize:24, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color: over ? '#dc2626' : T.text, lineHeight:1 }}>
              {fmt(Math.abs(remaining), currency)}
            </p>
            <p style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>of {fmt(budgetLimit, currency)} budget</p>
          </div>
        )}

        {splitExpenses.length > 0 && (
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:`${T.skyTeal}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <SplitSquareHorizontal size={13} color={T.skyTeal}/>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:T.textMuted, textTransform:'uppercase', letterSpacing:.5 }}>Settlements</span>
            </div>
            <p style={{ fontSize:24, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color: settlements.length > 0 ? T.text : T.sage, lineHeight:1 }}>
              {settlements.length > 0 ? settlements.length : '✓'}
            </p>
            <p style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>
              {settlements.length > 0 ? `payment${settlements.length!==1?'s':''} pending` : 'all settled up'}
            </p>
          </div>
        )}

        {budgetLimit > 0 && (
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:`${T.deepTeal}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Wallet size={13} color={T.deepTeal}/>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:T.textMuted, textTransform:'uppercase', letterSpacing:.5 }}>Budget Used</span>
            </div>
            <p style={{ fontSize:26, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, lineHeight:1 }}>
              {Math.round(pct)}%
            </p>
            <div style={{ marginTop:10, height:5, borderRadius:99, background:T.bgAlt, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:progressColor, transition:'width .4s ease' }}/>
            </div>
          </div>
        )}
      </div>

      {/* ── My Balance card ── */}
      {myBalance && (myBalance.iOwe > 0 || myBalance.owedToMe > 0 || myBalance.iPaid > 0) && (
        <div style={{ background:T.bgCard, border:`1.5px solid ${myBalance.net < 0 ? '#dc262630' : myBalance.net > 0 ? `${T.sage}40` : T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:28, height:28, borderRadius:8, background: myBalance.net < 0 ? 'rgba(220,38,38,.1)' : `${T.sage}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
              {myBalance.net < 0 ? '💸' : myBalance.net > 0 ? '💰' : '✅'}
            </div>
            <h3 style={{ fontSize:13, fontWeight:700, color:T.text }}>Your Balance</h3>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[
              { label:'You Paid',    value: myBalance.iPaid,    color: T.deepTeal },
              { label:'You Owe',     value: myBalance.iOwe,     color: myBalance.iOwe > 0 ? '#dc2626' : T.textMuted },
              { label:'Owed to You', value: myBalance.owedToMe, color: myBalance.owedToMe > 0 ? T.sage : T.textMuted },
            ].map(item => (
              <div key={item.label} style={{ textAlign:'center', padding:'10px 8px', borderRadius:10, background:T.bgAlt }}>
                <p style={{ fontSize:10, color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:.4, marginBottom:4 }}>{item.label}</p>
                <p style={{ fontSize:16, fontWeight:700, color:item.color, fontFamily:"'Cormorant Garamond',serif" }}>
                  {fmtD(item.value, currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Net balance summary */}
          <div style={{ padding:'10px 14px', borderRadius:10, background: myBalance.net < -0.01 ? 'rgba(220,38,38,.06)' : myBalance.net > 0.01 ? `${T.sage}0e` : `${T.deepTeal}08`, border:`1px solid ${myBalance.net < -0.01 ? 'rgba(220,38,38,.2)' : myBalance.net > 0.01 ? `${T.sage}30` : T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:T.textMid, fontWeight:600 }}>
              {myBalance.net < -0.01 ? '⚠️ You owe a net amount' : myBalance.net > 0.01 ? '🎉 You are owed a net amount' : '✅ You are all square'}
            </span>
            <span style={{ fontSize:15, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color: myBalance.net < -0.01 ? '#dc2626' : myBalance.net > 0.01 ? T.sage : T.textMuted }}>
              {myBalance.net !== 0 ? fmtD(Math.abs(myBalance.net), currency) : 'Settled'}
            </span>
          </div>
        </div>
      )}

      {/* ── Member contributions ── */}
      {members.length >= 2 && expenses.length > 0 && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>Member Contributions</h3>
          <p style={{ fontSize:11, color:T.textMuted, marginBottom:14 }}>How much each person has paid vs their fair share</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {members.map((m, i) => {
              const uid    = m.user?._id?.toString() || m._id?.toString()
              const name   = m.user?.name || 'Unknown'
              const isMe   = uid === currentUserId
              const paid   = expenses.filter(e => {
                const pid = e.paidBy?._id?.toString() || e.paidBy?.toString()
                return pid === uid
              }).reduce((s, e) => s + (e.amount||0), 0)
              const fairShare = totalSpent / members.length
              const diff = paid - fairShare  // positive = overpaid, negative = underpaid
              const colors = [`${T.deepTeal}cc`,`${T.sage}cc`,`${T.skyTeal}cc`,`${T.deepTeal}99`,`${T.sage}99`]

              return (
                <div key={uid} style={{ padding:'12px 14px', borderRadius:10, background: isMe ? `${T.deepTeal}06` : T.bgAlt, border:`1px solid ${isMe ? `${T.deepTeal}20` : T.border}`, transition:'background .15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    {/* Avatar */}
                    <div style={{ width:30, height:30, borderRadius:'50%', background:colors[i%5], display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0, boxShadow: isMe ? `0 0 0 2px ${T.deepTeal}` : 'none' }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{name}</span>
                        {isMe && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, background:`${T.deepTeal}14`, color:T.deepTeal, letterSpacing:.5 }}>YOU</span>}
                      </div>
                    </div>
                    {/* Net diff pill */}
                    <div style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, fontFamily:"'Cormorant Garamond',serif",
                      background: diff > 0.01 ? `${T.sage}14` : diff < -0.01 ? 'rgba(220,38,38,.08)' : `${T.deepTeal}0a`,
                      color:      diff > 0.01 ? T.sage       : diff < -0.01 ? '#dc2626'               : T.textMuted,
                    }}>
                      {diff > 0.01 ? `+${fmtD(diff, currency)}` : diff < -0.01 ? fmtD(diff, currency) : 'Even'}
                    </div>
                  </div>

                  {/* Progress bar — paid vs fair share */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:4, borderRadius:99, background:T.border, overflow:'hidden', position:'relative' }}>
                      {/* Fair share marker */}
                      <div style={{ position:'absolute', left:`${totalSpent > 0 ? (fairShare/totalSpent)*100 : 0}%`, top:-2, bottom:-2, width:2, background:T.textMuted, borderRadius:99, zIndex:2, transform:'translateX(-50%)' }}/>
                      {/* Paid bar */}
                      <div style={{ height:'100%', width:`${totalSpent > 0 ? Math.min((paid/totalSpent)*100, 100) : 0}%`, borderRadius:99, background:colors[i%5], transition:'width .4s ease' }}/>
                    </div>
                    <div style={{ display:'flex', gap:12, flexShrink:0 }}>
                      <span style={{ fontSize:11, color:T.textMuted }}>Paid <strong style={{ color:T.text }}>{fmtD(paid, currency)}</strong></span>
                      <span style={{ fontSize:11, color:T.textMuted }}>Share <strong style={{ color:T.textMid }}>{fmtD(fairShare, currency)}</strong></span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Category breakdown ── */}
      {byCategory.length > 0 && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>Spending by Category</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {byCategory.map(c => {
              const catPct = totalSpent > 0 ? (c.total / totalSpent) * 100 : 0
              return (
                <div key={c.value}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.textMid }}>
                      <span>{c.emoji}</span>{c.label}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:11, color:T.textMuted }}>{Math.round(catPct)}%</span>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif" }}>{fmt(c.total, currency)}</span>
                    </div>
                  </div>
                  <div style={{ height:4, borderRadius:99, background:T.bgAlt, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${catPct}%`, borderRadius:99, background:`linear-gradient(90deg,${T.deepTeal},${T.skyTeal})`, transition:'width .4s ease' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Per-member spend ── */}
      {byMember.length > 1 && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>Paid By Member</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {byMember.map((m, i) => (
              <div key={m.uid} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:[`${T.deepTeal}cc`,`${T.sage}cc`,`${T.skyTeal}cc`][i%3], display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {m.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:T.textMid, fontWeight:600 }}>{m.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif" }}>{fmt(m.paid, currency)}</span>
                  </div>
                  <div style={{ height:3, borderRadius:99, background:T.bgAlt, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${totalSpent > 0 ? (m.paid/totalSpent)*100 : 0}%`, borderRadius:99, background:[`${T.deepTeal}`,`${T.sage}`,`${T.skyTeal}`][i%3] }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expenses / Settlements tab bar ── */}
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 2px 10px ${T.shadow}` }}>

        {/* Tab header */}
        <div style={{ borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', padding:'0 16px' }}>
          <div style={{ display:'flex' }}>
            {[
              { id:'expenses',    label:'Expenses' },
              { id:'settlements', label:`Settlements${settlements.length > 0 ? ` (${settlements.length})` : ''}` },
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                style={{ padding:'13px 14px', fontSize:13, fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:"'DM Sans',sans-serif", transition:'color .15s, box-shadow .15s',
                  color:       activeTab === tab.id ? T.deepTeal : T.textMuted,
                  boxShadow:   activeTab === tab.id ? `inset 0 -2px 0 ${T.deepTeal}` : 'none',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'expenses' && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0' }}>
              <div style={{ position:'relative' }}>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ appearance:'none', padding:'6px 28px 6px 11px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMid, fontSize:12, fontWeight:500, cursor:'pointer', outline:'none', fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor=T.deepTeal}
                  onBlur={e => e.target.style.borderColor=T.border}>
                  <option value="all">All categories</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
                <ChevronDown size={11} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }}/>
              </div>
              {role !== 'viewer' && (
                <button onClick={() => setShowAdd(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:`0 3px 10px ${T.deepTeal}30` }}>
                  <Plus size={12}/> Add Expense
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expenses tab */}
        {activeTab === 'expenses' && (
          <>
            {isLoading && (
              <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
                <Loader2 size={22} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }}/>
                <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 0', textAlign:'center' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>💸</div>
                <p style={{ fontSize:13, color:T.textMuted, marginBottom: role !== 'viewer' ? 14 : 0 }}>
                  {catFilter !== 'all' ? 'No expenses in this category' : 'No expenses logged yet'}
                </p>
                {role !== 'viewer' && catFilter === 'all' && (
                  <button onClick={() => setShowAdd(true)}
                    style={{ fontSize:12, color:T.deepTeal, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                    + Add first expense
                  </button>
                )}
              </div>
            )}
            {!isLoading && filtered.length > 0 && (
              <div style={{ padding:'6px 0' }}>
                {filtered.map((expense, i) => (
                  <div key={expense._id}>
                    <ExpenseRow expense={expense} currency={currency} role={role} onDelete={deleteExpense} T={T}/>
                    {i < filtered.length - 1 && <div style={{ height:1, background:T.border, margin:'0 14px' }}/>}
                  </div>
                ))}
              </div>
            )}
            {!isLoading && filtered.length > 0 && (
              <div style={{ padding:'12px 16px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:T.bgAlt }}>
                <span style={{ fontSize:12, color:T.textMuted }}>{filtered.length} expense{filtered.length !== 1 ? 's' : ''}{catFilter !== 'all' ? ` · ${CAT[catFilter]?.label}` : ''}</span>
                <span style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif" }}>
                  {fmt(filtered.reduce((s,e) => s + (e.amount||0), 0), currency)}
                </span>
              </div>
            )}
          </>
        )}

        {/* Settlements tab */}
        {activeTab === 'settlements' && (
          <div style={{ padding:16 }}>
            {members.length < 2 ? (
              <div style={{ textAlign:'center', padding:'32px 0' }}>
                <p style={{ fontSize:13, color:T.textMuted }}>Add at least 2 members to track settlements</p>
              </div>
            ) : (
              <SettlementsPanel settlements={settlements} currency={currency} role={role} onSettle={handleSettle} T={T}/>
            )}
          </div>
        )}
      </div>
    </div>
  )
}