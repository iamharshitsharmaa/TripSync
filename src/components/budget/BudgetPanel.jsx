import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import {
  Plus, Trash2, Wallet, TrendingUp, TrendingDown,
  Receipt, Users, X, ChevronDown, Loader2,
} from 'lucide-react'

/* ── Expense categories ── */
const CATEGORIES = [
  { value:'food',        label:'Food & Dining',  emoji:'🍽️' },
  { value:'transport',   label:'Transport',       emoji:'🚌' },
  { value:'lodging',     label:'Lodging',         emoji:'🏨' },
  { value:'activities',  label:'Activities',      emoji:'🎯' },
  { value:'shopping',    label:'Shopping',        emoji:'🛍️' },
  { value:'health',      label:'Health',          emoji:'💊' },
  { value:'other',       label:'Other',           emoji:'📌' },
]
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

/* ── Helpers ── */
const fmt = (n, currency = 'USD') => {
  try { return new Intl.NumberFormat('en', { style:'currency', currency, maximumFractionDigits:0 }).format(n) }
  catch { return `${currency} ${Number(n).toLocaleString()}` }
}

const fetchExpenses = (tripId) =>
  api.get(`/trips/${tripId}/expenses`).then(r => {
    const d = r.data
    // Log raw shape in dev so you can see exactly what the API returns
    if (import.meta.env.DEV) console.log('[BudgetPanel] expenses raw:', d)
    // Try every common Express response shape
    if (Array.isArray(d))            return d
    if (Array.isArray(d?.data))      return d.data
    if (Array.isArray(d?.expenses))  return d.expenses
    if (Array.isArray(d?.results))   return d.results
    // { data: { expenses: [...] } }
    if (Array.isArray(d?.data?.expenses)) return d.data.expenses
    // { data: { data: [...] } }
    if (Array.isArray(d?.data?.data)) return d.data.data
    // Last resort: find the first array value in the response object
    if (d && typeof d === 'object') {
      const found = Object.values(d).find(v => Array.isArray(v))
      if (found) return found
    }
    console.warn('[BudgetPanel] Could not parse expenses from:', d)
    return []
  })

/* ══════════════════════════════════════════════════════════
   ADD EXPENSE MODAL
══════════════════════════════════════════════════════════ */
function AddExpenseModal({ tripId, currency, members, onClose }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', amount: '', category: 'food', paidBy: '', notes: '',
  })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: d => api.post(`/trips/${tripId}/expenses`, d).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries(['expenses', tripId]); toast.success('Expense added!'); onClose() },
    onError:   e => toast.error(e.response?.data?.message || 'Failed to add expense'),
  })

  const submit = e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.amount || isNaN(form.amount)) return toast.error('Valid amount required')
    mutate({ ...form, amount: Number(form.amount), currency })
  }

  const IS = { width:'100%', padding:'10px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const LS = { fontSize:11, fontWeight:600, color:T.textMuted, display:'block', marginBottom:5, letterSpacing:.3 }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(14,26,28,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(5px)' }}
      onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, width:'100%', maxWidth:420, padding:'22px 20px', boxShadow:`0 28px 72px ${T.shadow}`, fontFamily:"'DM Sans',sans-serif" }}
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
                      border:     `1.5px solid ${active ? T.deepTeal : T.border}`,
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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
        background: hovered ? T.bgCardAlt : 'none',
        borderRadius:10, transition:'background .15s',
      }}>

      {/* Category icon */}
      <div style={{ width:36, height:36, borderRadius:10, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
        {cat.emoji}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" }}>
          {expense.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
          <span style={{ fontSize:10, color:T.textMuted }}>{cat.label}</span>
          {expense.paidBy && (
            <span style={{ fontSize:10, color:T.textMuted, display:'flex', alignItems:'center', gap:3 }}>
              <Users size={9} color={T.skyTeal}/> {paidByName}
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
   BUDGET PANEL
══════════════════════════════════════════════════════════ */
export default function BudgetPanel({ tripId, role, currency = 'USD', budgetLimit = 0, members = [] }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [showAdd,   setShowAdd]   = useState(false)
  const [catFilter, setCatFilter] = useState('all')

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

  /* ── Derived stats ── */
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const remaining  = budgetLimit > 0 ? budgetLimit - totalSpent : null
  const pct        = budgetLimit > 0 ? Math.min((totalSpent / budgetLimit) * 100, 100) : 0
  const over       = budgetLimit > 0 && totalSpent > budgetLimit

  /* ── Category breakdown ── */
  const byCategory = CATEGORIES.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.value).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  /* ── Per-member spend ── */
  const byMember = members.map(m => {
    const uid  = m.user?._id || m._id
    const name = m.user?.name || 'Unknown'
    const paid = expenses.filter(e => e.paidBy?._id === uid || e.paidBy === uid).reduce((s, e) => s + (e.amount||0), 0)
    return { uid, name, paid }
  }).filter(m => m.paid > 0).sort((a,b) => b.paid - a.paid)

  /* ── Filtered list ── */
  const filtered = catFilter === 'all' ? expenses : expenses.filter(e => e.category === catFilter)

  const progressColor = over ? '#dc2626' : pct > 80 ? '#d97706' : T.sage

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:"'DM Sans',sans-serif" }}>

      {showAdd && (
        <AddExpenseModal tripId={tripId} currency={currency} members={members} onClose={() => setShowAdd(false)}/>
      )}

      {/* ── Summary cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
        {/* Total spent */}
        <div style={{ background:T.bgCard, border:`1px solid ${T.borderCard}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`${T.deepTeal}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={13} color={T.deepTeal}/>
            </div>
            <span style={{ fontSize:11, color:T.textMuted, fontWeight:500 }}>Total Spent</span>
          </div>
          <p style={{ fontSize:26, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, lineHeight:1 }}>
            {fmt(totalSpent, currency)}
          </p>
          <p style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Budget limit / remaining */}
        {budgetLimit > 0 && (
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderCard}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:`${over ? '#dc2626' : T.sage}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {over ? <TrendingDown size={13} color="#dc2626"/> : <TrendingUp size={13} color={T.sage}/>}
              </div>
              <span style={{ fontSize:11, color:T.textMuted, fontWeight:500 }}>{over ? 'Over Budget' : 'Remaining'}</span>
            </div>
            <p style={{ fontSize:26, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color: over ? '#dc2626' : T.sage, lineHeight:1 }}>
              {fmt(Math.abs(remaining), currency)}
            </p>
            <p style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>of {fmt(budgetLimit, currency)} budget</p>
          </div>
        )}

        {/* Budget progress */}
        {budgetLimit > 0 && (
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderCard}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:`${T.skyTeal}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Wallet size={13} color={T.skyTeal}/>
              </div>
              <span style={{ fontSize:11, color:T.textMuted, fontWeight:500 }}>Budget Used</span>
            </div>
            <p style={{ fontSize:26, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", color:T.text, lineHeight:1 }}>
              {Math.round(pct)}%
            </p>
            {/* Progress bar */}
            <div style={{ marginTop:10, height:5, borderRadius:99, background:T.bgAlt, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:progressColor, transition:'width .4s ease' }}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Category breakdown ── */}
      {byCategory.length > 0 && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', boxShadow:`0 2px 10px ${T.shadow}` }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>Spending by Category</h3>
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

      {/* ── Per-member ── */}
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

      {/* ── Expense list ── */}
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 2px 10px ${T.shadow}` }}>

        {/* List header */}
        <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:T.text }}>Expenses</h3>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Category filter */}
            <div style={{ position:'relative' }}>
              <select
                value={catFilter} onChange={e => setCatFilter(e.target.value)}
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
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
            <Loader2 size={22} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }}/>
            <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Empty */}
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

        {/* List */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ padding:'6px 0' }}>
            {filtered.map((expense, i) => (
              <div key={expense._id}>
                <ExpenseRow expense={expense} currency={currency} role={role} onDelete={deleteExpense} T={T}/>
                {i < filtered.length - 1 && (
                  <div style={{ height:1, background:T.border, margin:'0 14px' }}/>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer total */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ padding:'12px 16px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:T.bgAlt }}>
            <span style={{ fontSize:12, color:T.textMuted }}>{filtered.length} expense{filtered.length !== 1 ? 's' : ''}{catFilter !== 'all' ? ` · ${CAT[catFilter]?.label}` : ''}</span>
            <span style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond',serif" }}>
              {fmt(filtered.reduce((s,e) => s + (e.amount||0), 0), currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}