import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import CommentThread from '../comments/CommentThread'
import { Clock, MapPin, DollarSign, Trash2, Pencil, MessageSquare, GripVertical } from 'lucide-react'

const TYPE_CONFIG = {
  activity:  { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',  emoji: '🎯' },
  food:      { color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', emoji: '🍽️' },
  transport: { color: 'bg-purple-500/15 text-purple-400 border-purple-500/20', emoji: '🚌' },
  lodging:   { color: 'bg-green-500/15 text-green-400 border-green-500/20', emoji: '🏨' },
  other:     { color: 'bg-gray-500/15 text-gray-400 border-gray-500/20',   emoji: '📌' },
}

export default function ActivityCard({ activity, tripId, role, dragHandleProps }) {
  const qc = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.other

  const { mutate: deleteActivity } = useMutation({
    mutationFn: () => api.delete(`/activities/${activity._id}`),
    onSuccess: () => { qc.invalidateQueries(['activities', tripId]); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete')
  })

  if (editing) return <EditActivityForm activity={activity} tripId={tripId} onClose={() => setEditing(false)} />

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden
      hover:border-gray-600 hover:bg-gray-800 transition-all group">

      {/* Card body */}
      <div className="p-3.5">
        <div className="flex items-start gap-2">

          {/* Drag handle */}
          {role !== 'viewer' && (
            <div {...dragHandleProps}
              className="mt-0.5 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0">
              <GripVertical size={14} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Type badge + title */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-semibold ${cfg.color}`}>
                {cfg.emoji} {activity.type}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white leading-snug">{activity.title}</h4>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
              {(activity.startTime || activity.endTime) && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {activity.startTime}{activity.endTime ? ` – ${activity.endTime}` : ''}
                </span>
              )}
              {activity.location && (
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <MapPin size={10} /> {activity.location}
                </span>
              )}
              {activity.estimatedCost > 0 && (
                <span className="flex items-center gap-1 text-green-400">
                  <DollarSign size={10} /> {activity.estimatedCost}
                </span>
              )}
            </div>

            {activity.notes && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2">{activity.notes}</p>
            )}
          </div>

          {/* Action buttons — visible on hover */}
          {role !== 'viewer' && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
              <button onClick={() => setEditing(true)}
                className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                <Pencil size={12} />
              </button>
              <button onClick={() => { if (confirm('Delete this activity?')) deleteActivity() }}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment toggle footer */}
      <div className="px-3.5 pb-2.5">
        <button onClick={() => setShowComments(p => !p)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition">
          <MessageSquare size={11} />
          {showComments ? 'Hide' : 'Comments'}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-700/50 px-3.5 py-3">
          <CommentThread tripId={tripId} entityType="activity" entityId={activity._id} />
        </div>
      )}
    </div>
  )
}

// ── Inline edit form
function EditActivityForm({ activity, tripId, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: activity.title, type: activity.type,
    startTime: activity.startTime, endTime: activity.endTime,
    location: activity.location, notes: activity.notes,
    estimatedCost: activity.estimatedCost
  })
  const set = f => e => setForm(p => ({...p, [f]: e.target.value}))

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.patch(`/activities/${activity._id}`, data),
    onSuccess: () => { qc.invalidateQueries(['activities', tripId]); onClose() }
  })

  const inputCls = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"

  return (
    <div className="p-3.5 bg-gray-800 rounded-xl border border-blue-500/30 space-y-2">
      <input placeholder="Title *" required className={inputCls} value={form.title} onChange={set('title')} />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={form.type} onChange={set('type')}>
          {['activity','food','transport','lodging','other'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="number" placeholder="Cost" className={inputCls} value={form.estimatedCost} onChange={set('estimatedCost')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="time" className={inputCls} value={form.startTime} onChange={set('startTime')} />
        <input type="time" className={inputCls} value={form.endTime} onChange={set('endTime')} />
      </div>
      <input placeholder="Location" className={inputCls} value={form.location} onChange={set('location')} />
      <textarea placeholder="Notes" rows={2} className={inputCls + ' resize-none'} value={form.notes} onChange={set('notes')} />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-1.5 text-xs border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
        <button onClick={() => mutate(form)} disabled={isPending} className="flex-1 py-1.5 text-xs bg-blue-600 rounded-lg text-white font-bold disabled:opacity-50">
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}