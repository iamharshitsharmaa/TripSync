import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import DayColumn from './DayColumn'
import ActivityCard from './ActivityCard'

export default function ItineraryBoard({ trip, role }) {
  const qc = useQueryClient()
  const [activeItem, setActiveItem] = useState(null)

  // Fetch ALL activities for the trip in one query
  const { data: allActivities = [] } = useQuery({
    queryKey: ['activities', trip._id],
    queryFn: () =>
      api.get(`/trips/${trip._id}/activities`).then(r => r.data.data),
  })

  // Group by dayIndex, sorted by position
  const grouped = {}
  trip.days?.forEach((_, i) => { grouped[i] = [] })
  allActivities.forEach(a => {
    if (grouped[a.dayIndex] !== undefined) grouped[a.dayIndex].push(a)
  })
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.position - b.position))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Find which day an activity belongs to by its _id
  const findDay = (id) => {
    for (const [day, acts] of Object.entries(grouped)) {
      if (acts.some(a => a._id === id)) return Number(day)
    }
    return null
  }

  const { mutate: moveActivity } = useMutation({
    mutationFn: ({ id, dayIndex, prevPosition, nextPosition }) =>
      api.patch(`/activities/${id}/reorder`, { dayIndex, prevPosition, nextPosition }),
    onError: () => {
      toast.error('Move failed — refreshing')
      qc.invalidateQueries({ queryKey: ['activities', trip._id] })
    },
  })

  function handleDragStart({ active }) {
    const day = findDay(active.id)
    if (day !== null) {
      setActiveItem(grouped[day]?.find(a => a._id === active.id) ?? null)
    }
  }

  function handleDragEnd({ active, over }) {
    setActiveItem(null)
    if (!over || active.id === over.id) return

    const fromDay = findDay(active.id)
    if (fromDay === null) return

    // over.id is either an activity _id or a column droppable id like "col-2"
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
      // ── Same-column reorder ──────────────────────────────────────
      const oldIdx = fromItems.findIndex(a => a._id === active.id)
      const newIdx = fromItems.findIndex(a => a._id === over.id)
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

      const reordered = arrayMove(fromItems, oldIdx, newIdx)

      // Optimistic update
      qc.setQueryData(['activities', trip._id], prev =>
        (prev ?? []).map(a => {
          const found = reordered.find(r => r._id === a._id)
          return found ? { ...a } : a
        })
      )

      const prev = reordered[newIdx - 1]?.position ?? null
      const next = reordered[newIdx + 1]?.position ?? null
      moveActivity({ id: active.id, dayIndex: fromDay, prevPosition: prev, nextPosition: next })

    } else {
      // ── Cross-column move ────────────────────────────────────────
      // Remove dragged item from toItems (in case it's already there from DragOverlay)
      const destItems = toItems.filter(a => a._id !== active.id)
      const insertIdx = overItemId
        ? destItems.findIndex(a => a._id === overItemId)
        : destItems.length
      const finalIdx = insertIdx === -1 ? destItems.length : insertIdx

      const prev = destItems[finalIdx - 1]?.position ?? null
      const next = destItems[finalIdx]?.position ?? null

      // Optimistic: change dayIndex in cache
      qc.setQueryData(['activities', trip._id], prevData =>
        (prevData ?? []).map(a =>
          a._id === active.id ? { ...a, dayIndex: toDay } : a
        )
      )

      moveActivity({ id: active.id, dayIndex: toDay, prevPosition: prev, nextPosition: next })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {trip.days?.map((day, idx) => (
            <DayColumn
              key={day._id || idx}
              trip={trip}
              day={day}
              dayIndex={idx}
              role={role}
              activities={grouped[idx] ?? []}
            />
          ))}
        </div>
      </div>

      {/* Ghost card that follows the cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div style={{ opacity: 0.9, transform: 'rotate(1.5deg)', pointerEvents: 'none' }}>
            <ActivityCard
              activity={activeItem}
              tripId={trip._id}
              role="viewer"
              dragHandleProps={{}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}