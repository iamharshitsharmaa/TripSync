import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTheme } from '../../context/ThemeContext'
import ActivityCard from './ActivityCard'
import AddActivityModal from './AddActivityModal'
import CommentThread from '../comments/CommentThread'
import { Plus, MessageSquare, CalendarDays } from 'lucide-react'

function SortableActivityCard({ activity, tripId, role }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity._id })
  return (
    <div ref={setNodeRef} style={{ transform:CSS.Transform.toString(transform), transition, opacity:isDragging?0:1 }}>
      <ActivityCard activity={activity} tripId={tripId} role={role} dragHandleProps={{ ...attributes, ...listeners }}/>
    </div>
  )
}

export default function DayColumn({ trip, day, dayIndex, role, activities = [] }) {
  const { T } = useTheme()
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [showDayComments, setShowDayComments] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: `col-${dayIndex}` })

  const dateLabel = day.date
    ? new Date(day.date).toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' })
    : `Day ${dayIndex + 1}`

  return (
    <>
      {showAddModal && (
        <AddActivityModal tripId={trip._id} dayIndex={dayIndex} onClose={() => setShowAddModal(false)}/>
      )}

      <div style={{
        display:'flex', flexDirection:'column', width:285, flexShrink:0,
        background: isOver ? `${T.deepTeal}09` : T.bgCard,
        border:`1px solid ${isOver ? T.deepTeal+'55' : T.border}`,
        borderRadius:16, overflow:'hidden',
        transition:'background .15s, border-color .15s',
        boxShadow:`0 2px 14px ${T.shadow}`,
      }}>

        {/* ── Day header ── */}
        <div style={{ padding:'14px 14px 10px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:9, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase', color:T.deepTeal, marginBottom:3, fontFamily:"'DM Sans',sans-serif" }}>
                Day {dayIndex + 1}
              </p>
              <h3 style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1.25, fontFamily:"'DM Sans',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {day.title || dateLabel}
              </h3>
              {day.title && (
                <p style={{ fontSize:11, color:T.textMuted, marginTop:1, fontFamily:"'DM Sans',sans-serif" }}>{dateLabel}</p>
              )}
            </div>

            {role !== 'viewer' && (
              <button onClick={() => setShowAddModal(true)}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:`1px solid ${T.deepTeal}35`, background:`${T.deepTeal}10`, color:T.deepTeal, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:"'DM Sans',sans-serif", transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background=`${T.deepTeal}1e`; e.currentTarget.style.borderColor=`${T.deepTeal}55` }}
                onMouseLeave={e => { e.currentTarget.style.background=`${T.deepTeal}10`; e.currentTarget.style.borderColor=`${T.deepTeal}35` }}>
                <Plus size={11}/> Add
              </button>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:11, color:T.textMuted, display:'flex', alignItems:'center', gap:4 }}>
              <CalendarDays size={10} color={T.skyTeal}/>
              {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
            </span>
            <button onClick={() => setShowDayComments(p => !p)}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:showDayComments?T.deepTeal:T.textMuted, background:'none', border:'none', cursor:'pointer', padding:0, transition:'color .15s', fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.color=T.deepTeal}
              onMouseLeave={e => e.currentTarget.style.color=showDayComments?T.deepTeal:T.textMuted}>
              <MessageSquare size={10}/> Notes
            </button>
          </div>
        </div>

        {/* Day comments */}
        {showDayComments && (
          <div style={{ padding:'12px 14px', borderBottom:`1px solid ${T.border}`, background:T.bgAlt }}>
            <CommentThread tripId={trip._id} entityType="day" entityId={day._id}/>
          </div>
        )}

        {/* Drop zone + list */}
        <div ref={setNodeRef} style={{ flex:1, padding:'10px', overflowY:'auto', maxHeight:'calc(100vh - 310px)' }}>
          {activities.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 0', textAlign:'center' }}>
              {isOver ? (
                <p style={{ fontSize:12, fontWeight:700, color:T.deepTeal }}>Drop here</p>
              ) : (
                <>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:10 }}>📅</div>
                  <p style={{ fontSize:12, color:T.textMuted, marginBottom:10, fontFamily:"'DM Sans',sans-serif" }}>No activities yet</p>
                  {role !== 'viewer' && (
                    <button onClick={() => setShowAddModal(true)}
                      style={{ fontSize:12, color:T.deepTeal, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'opacity .15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                      + Add first activity
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <SortableContext items={activities.map(a => a._id)} strategy={verticalListSortingStrategy}>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {activities.map(activity => (
                  <SortableActivityCard key={activity._id} activity={activity} tripId={trip._id} role={role}/>
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </>
  )
}