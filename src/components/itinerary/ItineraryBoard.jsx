import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import DayColumn from './DayColumn'
import ActivityCard from './ActivityCard'
import { Loader2 } from 'lucide-react'

export default function ItineraryBoard({ trip, role }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [activeItem, setActiveItem] = useState(null)

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['activities', trip._id],
    queryFn: () => api.get(`/trips/${trip._id}/activities`).then(r => r.data.data),
  })

  // Group by dayIndex, sorted by position
  const grouped = {}
  trip.days?.forEach((_, i) => { grouped[i] = [] })
  allActivities.forEach(a => {
    if (grouped[a.dayIndex] !== undefined) grouped[a.dayIndex].push(a)
  })
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.position - b.position))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const findDay = id => {
    for (const [day, acts] of Object.entries(grouped)) {
      if (acts.some(a => a._id === id)) return Number(day)
    }
    return null
  }

  const { mutate: moveActivity } = useMutation({
    mutationFn: ({ id, dayIndex, prevPosition, nextPosition }) =>
      api.patch(`/activities/${id}/reorder`, { dayIndex, prevPosition, nextPosition }),
    onError: () => { toast.error('Move failed — refreshing'); qc.invalidateQueries({ queryKey:['activities', trip._id] }) },
  })

  function handleDragStart({ active }) {
    const day = findDay(active.id)
    if (day !== null) setActiveItem(grouped[day]?.find(a => a._id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveItem(null)
    if (!over || active.id === over.id) return

    const fromDay = findDay(active.id)
    if (fromDay === null) return

    let toDay, overItemId
    if (String(over.id).startsWith('col-')) {
      toDay = Number(String(over.id).replace('col-', ''))
      overItemId = null
    } else {
      toDay = findDay(over.id)
      overItemId = over.id
    }
    if (toDay === null) return

    const fromItems = [...(grouped[fromDay] ?? [])]
    const toItems   = [...(grouped[toDay]   ?? [])]

    if (fromDay === toDay) {
      const oldIdx = fromItems.findIndex(a => a._id === active.id)
      const newIdx = fromItems.findIndex(a => a._id === over.id)
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return
      const reordered = arrayMove(fromItems, oldIdx, newIdx)
      qc.setQueryData(['activities', trip._id], prev =>
        (prev ?? []).map(a => { const f = reordered.find(r => r._id === a._id); return f ? { ...a } : a })
      )
      const prev = reordered[newIdx - 1]?.position ?? null
      const next = reordered[newIdx + 1]?.position ?? null
      moveActivity({ id: active.id, dayIndex: fromDay, prevPosition: prev, nextPosition: next })
    } else {
      const destItems = toItems.filter(a => a._id !== active.id)
      const insertIdx = overItemId ? destItems.findIndex(a => a._id === overItemId) : destItems.length
      const finalIdx  = insertIdx === -1 ? destItems.length : insertIdx
      const prev = destItems[finalIdx - 1]?.position ?? null
      const next = destItems[finalIdx]?.position ?? null
      qc.setQueryData(['activities', trip._id], prevData =>
        (prevData ?? []).map(a => a._id === active.id ? { ...a, dayIndex: toDay } : a)
      )
      moveActivity({ id: active.id, dayIndex: toDay, prevPosition: prev, nextPosition: next })
    }
  }

  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <Loader2 size={22} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  if (!trip.days?.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', textAlign:'center' }}>
      <div style={{ width:52, height:52, borderRadius:14, background:`${T.deepTeal}10`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>🗓️</div>
      <p style={{ fontSize:14, color:T.textMuted, fontFamily:"'DM Sans',sans-serif" }}>No days in this trip yet.</p>
    </div>
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ overflowX:'auto', paddingBottom:16 }}>
        <div style={{ display:'flex', gap:14, minWidth:'max-content' }}>
          {trip.days.map((day, idx) => (
            <DayColumn key={day._id || idx} trip={trip} day={day} dayIndex={idx} role={role} activities={grouped[idx] ?? []}/>
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div style={{ opacity:.92, transform:'rotate(1.5deg) scale(1.02)', pointerEvents:'none', width:285 }}>
            <ActivityCard activity={activeItem} tripId={trip._id} role="viewer" dragHandleProps={{}}/>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}