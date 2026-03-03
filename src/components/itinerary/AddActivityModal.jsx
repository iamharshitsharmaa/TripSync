import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AddActivityModal({ tripId, dayIndex, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', type: 'activity', startTime: '', endTime: '',
    location: '', notes: '', estimatedCost: ''
  })
  const set = f => e => setForm(p => ({...p, [f]: e.target.value}))

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post(`/trips/${tripId}/activities`, data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries(['activities', tripId])
      toast.success('Activity added!')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add activity')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    mutate({ ...form, dayIndex, estimatedCost: Number(form.estimatedCost) || 0 })
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Add Activity — Day {dayIndex + 1}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Activity title *" required className={inputCls} value={form.title} onChange={set('title')} />

          <select className={inputCls} value={form.type} onChange={set('type')}>
            <option value="activity">🎯 Activity</option>
            <option value="food">🍽️ Food & Dining</option>
            <option value="transport">🚌 Transport</option>
            <option value="lodging">🏨 Lodging</option>
            <option value="other">📌 Other</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Time</label>
              <input type="time" className={inputCls} value={form.startTime} onChange={set('startTime')} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">End Time</label>
              <input type="time" className={inputCls} value={form.endTime} onChange={set('endTime')} />
            </div>
          </div>

          <input placeholder="📍 Location" className={inputCls} value={form.location} onChange={set('location')} />
          <input type="number" placeholder="💰 Estimated cost" className={inputCls} value={form.estimatedCost} onChange={set('estimatedCost')} />
          <textarea placeholder="Notes (optional)" rows={2} className={inputCls + ' resize-none'}
            value={form.notes} onChange={set('notes')} />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">
              {isPending ? 'Adding...' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}