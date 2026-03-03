import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ActivityCard from './ActivityCard'
import AddActivityModal from './AddActivityModal'
import { Plus, MessageSquare } from 'lucide-react'
import CommentThread from '../comments/CommentThread'

// ── Sortable wrapper around each ActivityCard
function SortableActivityCard({ activity, tripId, role }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ActivityCard
        activity={activity}
        tripId={tripId}
        role={role}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// ── Main DayColumn
export default function DayColumn({ trip, day, dayIndex, role }) {
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDayComments, setShowDayComments] = useState(false)

  // Fetch activities for this specific day
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', trip._id, dayIndex],
    queryFn: () =>
      api
        .get(`/trips/${trip._id}/activities?dayIndex=${dayIndex}`)
        .then((r) => r.data.data),
  })

  // Sorted by position
  const sorted = [...activities].sort((a, b) => a.position - b.position)

  // Reorder mutation
  const { mutate: reorder } = useMutation({
    mutationFn: ({ id, prevPosition, nextPosition }) =>
      api.patch(`/activities/${id}/reorder`, { prevPosition, nextPosition }),
    onError: () => {
      toast.error('Reorder failed')
      qc.invalidateQueries({ queryKey: ['activities', trip._id, dayIndex] })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return

    const oldIdx = sorted.findIndex((a) => a._id === active.id)
    const newIdx = sorted.findIndex((a) => a._id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    // Optimistically reorder in cache
    const reordered = arrayMove(sorted, oldIdx, newIdx)
    qc.setQueryData(['activities', trip._id, dayIndex], reordered)

    const prev = reordered[newIdx - 1]?.position ?? null
    const next = reordered[newIdx + 1]?.position ?? null

    reorder({ id: active.id, prevPosition: prev, nextPosition: next })
  }

  // Format the day header date
  const dateLabel = day.date
    ? new Date(day.date).toLocaleDateString('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : `Day ${dayIndex + 1}`

  return (
    <>
      {showAddModal && (
        <AddActivityModal
          tripId={trip._id}
          dayIndex={dayIndex}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <div className="flex flex-col w-72 flex-shrink-0 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Day header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Day {dayIndex + 1}
              </p>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {day.title || dateLabel}
              </h3>
              {day.title && (
                <p className="text-xs text-gray-500">{dateLabel}</p>
              )}
            </div>

            {role !== 'viewer' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40
                  text-blue-400 text-xs font-bold rounded-lg transition border border-blue-600/30"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {/* Activity count badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-600">
              {sorted.length} activit{sorted.length !== 1 ? 'ies' : 'y'}
            </span>
            <button
              onClick={() => setShowDayComments((p) => !p)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition"
            >
              <MessageSquare size={10} /> Notes
            </button>
          </div>
        </div>

        {/* Day-level comments (collapsible) */}
        {showDayComments && (
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
            <CommentThread
              tripId={trip._id}
              entityType="day"
              entityId={day._id}
            />
          </div>
        )}

        {/* Activity list */}
        <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-xs text-gray-600">No activities yet</p>
              {role !== 'viewer' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  + Add first activity
                </button>
              )}
            </div>
          )}

          {!isLoading && sorted.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((a) => a._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sorted.map((activity) => (
                    <SortableActivityCard
                      key={activity._id}
                      activity={activity}
                      tripId={trip._id}
                      role={role}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </>
  )
}