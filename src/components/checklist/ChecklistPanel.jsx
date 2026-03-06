import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import { Plus, Trash2, CheckSquare, Package, ListTodo, Check, Loader2 } from 'lucide-react'

const TYPE_CONFIG = {
  packing: { label:'Packing List', icon:Package,    emoji:'📦', accent: (T) => T.skyTeal  },
  todo:    { label:'To-Do',        icon:ListTodo,   emoji:'✅', accent: (T) => T.sage     },
  custom:  { label:'Custom',       icon:CheckSquare,emoji:'📋', accent: (T) => T.deepTeal },
}
const TYPES = Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({ value, ...cfg }))

const fetchChecklists = (tripId) =>
  api.get(`/trips/${tripId}/checklists`).then(r => {
    const d = r.data
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
  })

export default function ChecklistPanel({ tripId, role, members = [] }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [newTitle,  setNewTitle]  = useState('')
  const [newType,   setNewType]   = useState('packing')
  const [newItems,  setNewItems]  = useState({})   // { checklistId: inputValue }
  const [collapsed, setCollapsed] = useState({})   // { checklistId: bool }

  const { data: _raw, isLoading } = useQuery({
    queryKey: ['checklists', tripId],
    queryFn:  () => fetchChecklists(tripId),
  })
  const checklists = Array.isArray(_raw) ? _raw : []

  const { mutate: createList, isPending: creating } = useMutation({
    mutationFn: d => api.post(`/trips/${tripId}/checklists`, d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['checklists', tripId] }); setNewTitle('') },
    onError:    () => toast.error('Failed to create checklist'),
  })

  const { mutate: deleteList } = useMutation({
    mutationFn: id => api.delete(`/checklists/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['checklists', tripId] }); toast.success('Checklist deleted') },
    onError:    () => toast.error('Failed to delete'),
  })

  const { mutate: addItem } = useMutation({
    mutationFn: ({ checklistId, text }) => api.post(`/checklists/${checklistId}/items`, { text }),
    onSuccess:  (_, vars) => { qc.invalidateQueries({ queryKey:['checklists', tripId] }); setNewItems(p => ({ ...p, [vars.checklistId]:'' })) },
    onError:    () => toast.error('Failed to add item'),
  })

  const { mutate: toggleItem } = useMutation({
    mutationFn: ({ checklistId, itemId, isChecked }) =>
      api.patch(`/checklists/${checklistId}/items/${itemId}`, { isChecked }),
    onMutate: async ({ checklistId, itemId, isChecked }) => {
      await qc.cancelQueries({ queryKey:['checklists', tripId] })
      qc.setQueryData(['checklists', tripId], old =>
        old?.map(cl => cl._id === checklistId
          ? { ...cl, items: cl.items.map(it => it._id === itemId ? { ...it, isChecked } : it) }
          : cl
        )
      )
    },
    onError: () => qc.invalidateQueries({ queryKey:['checklists', tripId] }),
  })

  const { mutate: deleteItem } = useMutation({
    mutationFn: ({ checklistId, itemId }) => api.delete(`/checklists/${checklistId}/items/${itemId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey:['checklists', tripId] }),
    onError:    () => toast.error('Failed to delete item'),
  })

  const handleCreate = () => {
    if (!newTitle.trim()) return toast.error('Give your checklist a name')
    createList({ title: newTitle.trim(), type: newType })
  }

  const handleAddItem = (checklistId) => {
    const text = newItems[checklistId]?.trim()
    if (!text) return
    addItem({ checklistId, text })
  }

  const IS = { width:'100%', padding:'9px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ maxWidth:860, fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Create new checklist ── */}
      {role !== 'viewer' && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', marginBottom:20, boxShadow:`0 2px 10px ${T.shadow}` }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.textMuted, marginBottom:12 }}>New Checklist</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input
              placeholder="e.g. Packing for Jaipur…"
              style={{ ...IS, flex:'1 1 180px', minWidth:0 }}
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onFocus={focus} onBlur={blur}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />

            {/* Type pills */}
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              {TYPES.map(t => {
                const active = newType === t.value
                const accent = t.accent(T)
                return (
                  <button key={t.value} type="button" onClick={() => setNewType(t.value)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                      border:     `1.5px solid ${active ? accent : T.border}`,
                      background: active ? `${accent}14` : 'none',
                      color:      active ? accent : T.textMuted,
                    }}>
                    <span>{t.emoji}</span>
                    <span style={{ display:'inline' }}>{t.label}</span>
                  </button>
                )
              })}
            </div>

            <button onClick={handleCreate} disabled={!newTitle.trim() || creating}
              style={{ padding:'8px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:(!newTitle.trim()||creating)?'not-allowed':'pointer', opacity:(!newTitle.trim()||creating)?.5:1, fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 14px ${T.deepTeal}30`, transition:'opacity .15s', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
              {creating ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Plus size={13}/>}
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
          <Loader2 size={22} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }}/>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && checklists.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', textAlign:'center' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:12 }}>✅</div>
          <p style={{ fontSize:14, color:T.textMuted }}>No checklists yet.</p>
          {role !== 'viewer' && <p style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Create a packing list or to-do above.</p>}
        </div>
      )}

      {/* ── Grid ── */}
      {!isLoading && checklists.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {checklists.map(cl => {
            const cfg    = TYPE_CONFIG[cl.type] || TYPE_CONFIG.custom
            const Icon   = cfg.icon
            const accent = cfg.accent(T)
            const checked = cl.items?.filter(i => i.isChecked).length || 0
            const total   = cl.items?.length || 0
            const pct     = total > 0 ? (checked / total) * 100 : 0
            const done    = total > 0 && checked === total
            const isOpen  = !collapsed[cl._id]

            return (
              <div key={cl._id} style={{ background:T.bgCard, border:`1px solid ${done ? accent+'40' : T.border}`, borderRadius:14, overflow:'hidden', transition:'border-color .2s', boxShadow:`0 2px 12px ${T.shadow}` }}>

                {/* ── Card header ── */}
                <div style={{ padding:'12px 14px 10px', borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${accent}14`, border:`1px solid ${accent}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={13} color={accent}/>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cl.title}</p>
                        <p style={{ fontSize:10, color:T.textMuted }}>{cfg.label}</p>
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      {/* Progress count */}
                      <span style={{ fontSize:11, fontWeight:700, color: done ? accent : T.textMuted, background:`${done ? accent : T.textMuted}12`, padding:'2px 8px', borderRadius:20, fontFamily:"'DM Sans',sans-serif" }}>
                        {checked}/{total}
                      </span>
                      {/* Collapse toggle */}
                      <button onClick={() => setCollapsed(p => ({ ...p, [cl._id]: !p[cl._id] }))}
                        style={{ width:24, height:24, borderRadius:6, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, transition:'transform .2s', transform: isOpen ? 'none' : 'rotate(-90deg)' }}>
                        ▾
                      </button>
                      {/* Delete list */}
                      {role !== 'viewer' && (
                        <button onClick={() => { if (confirm(`Delete "${cl.title}"?`)) deleteList(cl._id) }}
                          style={{ width:24, height:24, borderRadius:6, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='rgba(220,38,38,.3)'; e.currentTarget.style.background='rgba(220,38,38,.07)' }}
                          onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='none' }}>
                          <Trash2 size={11}/>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height:4, borderRadius:99, background:T.bgAlt, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background: done ? accent : `linear-gradient(90deg,${T.deepTeal},${accent})`, transition:'width .35s ease' }}/>
                  </div>
                </div>

                {/* ── Items ── */}
                {isOpen && (
                  <>
                    <div style={{ padding:'8px 10px', maxHeight:240, overflowY:'auto' }}>
                      {cl.items?.length === 0 && (
                        <p style={{ fontSize:11, color:T.textMuted, textAlign:'center', padding:'12px 0' }}>No items yet</p>
                      )}
                      {cl.items?.map(item => (
                        <CheckItem
                          key={item._id}
                          item={item}
                          role={role}
                          accent={accent}
                          T={T}
                          onToggle={() => role !== 'viewer' && toggleItem({ checklistId:cl._id, itemId:item._id, isChecked:!item.isChecked })}
                          onDelete={() => deleteItem({ checklistId:cl._id, itemId:item._id })}
                        />
                      ))}
                    </div>

                    {/* ── Add item ── */}
                    {role !== 'viewer' && (
                      <div style={{ padding:'8px 10px 10px', borderTop:`1px solid ${T.border}` }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <input
                            placeholder="Add item…"
                            style={{ flex:1, padding:'7px 11px', borderRadius:8, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:12, outline:'none', fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
                            value={newItems[cl._id] || ''}
                            onChange={e => setNewItems(p => ({ ...p, [cl._id]: e.target.value }))}
                            onFocus={e => e.target.style.borderColor=accent}
                            onBlur={e => e.target.style.borderColor=T.border}
                            onKeyDown={e => e.key === 'Enter' && handleAddItem(cl._id)}
                          />
                          <button onClick={() => handleAddItem(cl._id)}
                            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${accent}35`, background:`${accent}12`, color:accent, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background=`${accent}22`; e.currentTarget.style.borderColor=`${accent}60` }}
                            onMouseLeave={e => { e.currentTarget.style.background=`${accent}12`; e.currentTarget.style.borderColor=`${accent}35` }}>
                            <Plus size={13}/>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Single checklist item ── */
function CheckItem({ item, role, accent, T, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 4px', borderRadius:8, transition:'background .12s', background: hovered ? T.bgAlt : 'none' }}>

      {/* Checkbox */}
      <button onClick={onToggle}
        style={{ width:18, height:18, borderRadius:5, flexShrink:0, border:`1.5px solid ${item.isChecked ? accent : T.border}`, background: item.isChecked ? accent : 'none', display:'flex', alignItems:'center', justifyContent:'center', cursor: role !== 'viewer' ? 'pointer' : 'default', transition:'all .15s' }}>
        {item.isChecked && <Check size={10} color="#fff" strokeWidth={3}/>}
      </button>

      {/* Text */}
      <span style={{ flex:1, fontSize:13, color: item.isChecked ? T.textMuted : T.text, textDecoration: item.isChecked ? 'line-through' : 'none', transition:'color .15s', fontFamily:"'DM Sans',sans-serif", lineHeight:1.4 }}>
        {item.text}
      </span>

      {/* Delete */}
      {role !== 'viewer' && (
        <button onClick={onDelete}
          style={{ width:22, height:22, borderRadius:6, border:'none', background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity: hovered ? 1 : 0, transition:'all .15s', flexShrink:0 }}
          onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
          onMouseLeave={e => e.currentTarget.style.color=T.textMuted}>
          <Trash2 size={11}/>
        </button>
      )}
    </div>
  )
}