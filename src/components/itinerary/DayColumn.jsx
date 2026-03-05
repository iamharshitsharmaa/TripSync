import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ActivityCard from './ActivityCard'
import AddActivityModal from './AddActivityModal'
import CommentThread from '../comments/CommentThread'
import { Plus, MessageSquare } from 'lucide-react'

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
    opacity: isDragging ? 0 : 1, // hide original while DragOverlay shows ghost
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

// ── Main DayColumn — activities come from ItineraryBoard (no own fetching)
export default function DayColumn({ trip, day, dayIndex, role, activities = [] }) {
  const [showAddModal, setShowAddModal]     = useState(false)
  const [showDayComments, setShowDayComments] = useState(false)

  // Make the whole column a drop target (for dragging into empty columns)
  const { setNodeRef, isOver } = useDroppable({ id: `col-${dayIndex}` })

  const dateLabel = day.date
    ? new Date(day.date).toLocaleDateString('en', {
        weekday: 'short', month: 'short', day: 'numeric',
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

      <div
        className={`flex flex-col w-72 flex-shrink-0 bg-gray-900 border rounded-2xl overflow-hidden transition-colors
          ${isOver ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800'}`}
      >
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
              {day.title && <p className="text-xs text-gray-500">{dateLabel}</p>}
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

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-600">
              {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
            </span>
            <button
              onClick={() => setShowDayComments(p => !p)}
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

        {/* Drop zone + activity list */}
        <div
          ref={setNodeRef}
          className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-280px)]"
        >
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              {isOver
                ? <p className="text-xs text-blue-400 font-semibold">Drop here</p>
                : (
                  <>
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
                  </>
                )
              }
            </div>
          )}

          {activities.length > 0 && (
            <SortableContext
              items={activities.map(a => a._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {activities.map(activity => (
                  <SortableActivityCard
                    key={activity._id}
                    activity={activity}
                    tripId={trip._id}
                    role={role}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </>
  )
}