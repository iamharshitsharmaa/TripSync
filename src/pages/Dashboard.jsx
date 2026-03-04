import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { Plus, MapPin, Calendar, ChevronRight, Loader2, Hash } from 'lucide-react'

const fetchTrips = () => api.get('/trips').then(r => r.data.data)

function TripCard({ trip }) {
  const start     = new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const end       = new Date(trip.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  const daysCount = trip.days?.length || 0
  const statusColor = { active: 'bg-green-500/15 text-green-400', draft: 'bg-gray-500/15 text-gray-400', archived: 'bg-gray-700/15 text-gray-500' }
  return (
    <Link to={`/trips/${trip._id}`} className="group block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 hover:shadow-xl transition-all duration-200">
      <div className="h-28 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-gray-900 relative overflow-hidden">
        {trip.coverImage ? <img src={trip.coverImage} alt="" className="w-full h-full object-cover opacity-60" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">🌍</div>}
        <div className="absolute top-3 right-3"><span className={`text-xs font-semibold px-2 py-1 rounded-md ${statusColor[trip.status] || statusColor.active}`}>{trip.status}</span></div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white text-base mb-1 group-hover:text-blue-300 transition">{trip.title}</h3>
        {trip.description && <p className="text-gray-500 text-xs mb-3 line-clamp-1">{trip.description}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1"><Calendar size={11} /> {start} - {end}</span>
          <span className="flex items-center gap-1"><MapPin size={11} /> {daysCount} day{daysCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {trip.members?.slice(0, 4).map((m, i) => (
              <div key={i} title={m.user?.name} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white">{m.user?.name?.[0]?.toUpperCase() || '?'}</div>
            ))}
            {trip.members?.length > 4 && <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-300">+{trip.members.length - 4}</div>}
          </div>
          <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition" />
        </div>
      </div>
    </Link>
  )
}

function CreateTripModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', currency: 'USD', budgetLimit: '' })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/trips', data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); toast.success('Trip created!'); onClose() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create trip'),
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (new Date(form.startDate) > new Date(form.endDate)) return toast.error('Start date must be before end date')
    mutate({ ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), budgetLimit: Number(form.budgetLimit) || 0 })
  }
  const ic = "w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Create New Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">x</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Trip Name *</label><input placeholder="e.g. Jaipur Trip 2026" required className={ic} value={form.title} onChange={set('title')} /></div>
          <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Description</label><input placeholder="Optional" className={ic} value={form.description} onChange={set('description')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Start Date *</label><input type="date" required className={ic} value={form.startDate} onChange={set('startDate')} /></div>
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">End Date *</label><input type="date" required className={ic} value={form.endDate} onChange={set('endDate')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Currency</label><select className={ic} value={form.currency} onChange={set('currency')}><option value="USD">USD $</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option></select></div>
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Budget Limit</label><input type="number" placeholder="0" min="0" className={ic} value={form.budgetLimit} onChange={set('budgetLimit')} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">{isPending ? 'Creating...' : 'Create Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function JoinByCodeModal({ onClose }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const { mutate: join, isPending } = useMutation({
    mutationFn: (code) => api.post('/join', { code }).then(r => r.data),
    onSuccess: (data) => {
      if (data.data.alreadyMember) {
        toast('You are already in this trip!', { icon: '👋' })
      } else {
        toast.success(`Joined "${data.data.tripTitle}"!`)
      }
      onClose()
      navigate(`/trips/${data.data.tripId}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid code'),
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.trim().length !== 6) return toast.error('Code must be 6 characters')
    join(code.trim())
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Hash size={18} className="text-purple-400" /> Join a Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">x</button>
        </div>
        <p className="text-gray-400 text-sm mb-6">Enter the 6-character invite code shared by the trip owner.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="XXXXXX"
            maxLength={6}
            autoFocus
            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl font-bold text-center tracking-[0.4em] placeholder-gray-600 uppercase focus:outline-none focus:border-purple-500 transition"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-10 h-10 rounded-lg border flex items-center justify-center text-base font-bold font-mono transition ${code[i] ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-600'}`}>
                {code[i] || '.'}
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button type="submit" disabled={isPending || code.length !== 6} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition disabled:opacity-50">{isPending ? 'Joining...' : 'Join Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin]     = useState(false)
  const { data: trips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: fetchTrips })
  return (
    <div className="p-6 lg:p-8">
      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} />}
      {showJoin   && <JoinByCodeModal onClose={() => setShowJoin(false)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Trips</h1>
          <p className="text-gray-400 text-sm mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold text-sm rounded-xl transition"><Hash size={15} /> Join Trip</button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-600/20"><Plus size={16} /> New Trip</button>
        </div>
      </div>
      {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-400" size={28} /></div>}
      {!isLoading && trips.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-bold text-white mb-2">No trips yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your own trip or join one with an invite code</p>
          <div className="flex gap-3">
            <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 border border-gray-700 text-white font-semibold rounded-xl text-sm hover:bg-gray-700 transition"><Hash size={15} /> Join Trip</button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm"><Plus size={16} /> Create Trip</button>
          </div>
        </div>
      )}
      {!isLoading && trips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {trips.map(trip => <TripCard key={trip._id} trip={trip} />)}
        </div>
      )}
    </div>
  )
}