import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Hotel, Plane, Car, Utensils, MapPin } from 'lucide-react'

const TYPE_CONFIG = {
  hotel:      { label: 'Hotel',      icon: Hotel,    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  flight:     { label: 'Flight',     icon: Plane,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
  car:        { label: 'Car Rental', icon: Car,      color: 'text-green-400',  bg: 'bg-green-500/10' },
  restaurant: { label: 'Restaurant', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  other:      { label: 'Other',      icon: MapPin,   color: 'text-gray-400',   bg: 'bg-gray-500/10' },
}

export default function ReservationsPanel({ tripId, role }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', type:'hotel', confirmationNo:'', checkIn:'', checkOut:'', notes:'' })
  const set = f => e => setForm(p => ({...p, [f]: e.target.value}))

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', tripId],
    queryFn: () => api.get(`/trips/${tripId}/reservations`).then(r => r.data.data)
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: (d) => api.post(`/trips/${tripId}/reservations`, d),
    onSuccess: () => { qc.invalidateQueries(['reservations', tripId]); setShowForm(false); setForm({ title:'', type:'hotel', confirmationNo:'', checkIn:'', checkOut:'', notes:'' }); toast.success('Reservation saved') }
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/reservations/${id}`),
    onSuccess: () => qc.invalidateQueries(['reservations', tripId])
  })

  const inputCls = "w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500 transition"

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Stays & Flights</h2>
        {role !== 'viewer' && (
          <button onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white
              font-bold text-sm rounded-xl transition">
            <Plus size={15} /> Add Reservation
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">New Reservation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Name / Title *" className={inputCls} value={form.title} onChange={set('title')} />
            <select className={inputCls} value={form.type} onChange={set('type')}>
              <option value="hotel">🏨 Hotel</option>
              <option value="flight">✈️ Flight</option>
              <option value="car">🚗 Car Rental</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="other">📌 Other</option>
            </select>
            <input placeholder="Confirmation No." className={inputCls} value={form.confirmationNo} onChange={set('confirmationNo')} />
            <div></div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Check-in / Departure</label>
              <input type="datetime-local" className={inputCls} value={form.checkIn} onChange={set('checkIn')} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Check-out / Arrival</label>
              <input type="datetime-local" className={inputCls} value={form.checkOut} onChange={set('checkOut')} />
            </div>
            <div className="sm:col-span-2">
              <textarea placeholder="Notes (optional)" rows={2} className={inputCls + ' resize-none'} value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
            <button onClick={() => { if(!form.title) return toast.error('Title required'); create(form) }}
              disabled={isPending}
              className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
              {isPending ? 'Saving...' : 'Save Reservation'}
            </button>
          </div>
        </div>
      )}

      {/* Reservations list */}
      {reservations.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-500">
          <Plane size={32} className="mx-auto mb-3 opacity-30" />
          <p>No reservations yet. Add hotels, flights, or car rentals.</p>
        </div>
      )}

      <div className="space-y-3">
        {reservations.map(res => {
          const cfg = TYPE_CONFIG[res.type] || TYPE_CONFIG.other
          const Icon = cfg.icon
          return (
            <div key={res._id}
              className="flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl group">
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{res.title}</h4>
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  {role !== 'viewer' && (
                    <button onClick={() => remove(res._id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {res.confirmationNo && (
                  <p className="text-xs text-gray-400 mt-1">
                    Confirmation: <span className="text-white font-mono">{res.confirmationNo}</span>
                  </p>
                )}
                {(res.checkIn || res.checkOut) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {res.checkIn && new Date(res.checkIn).toLocaleString('en', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                    {res.checkIn && res.checkOut && ' → '}
                    {res.checkOut && new Date(res.checkOut).toLocaleString('en', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </p>
                )}
                {res.notes && <p className="text-xs text-gray-500 mt-1">{res.notes}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}