import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import DayColumn from '../components/itinerary/DayColumn'
import MembersPanel from '../components/trip/MembersPanel'
import BudgetPanel from '../components/budget/BudgetPanel'
import ChecklistPanel from '../components/checklist/ChecklistPanel'
import ReservationsPanel from '../components/reservations/ReservationsPanel'
import { ArrowLeft, Users, Calendar, Wallet, CheckSquare, Hotel, Loader2, Settings } from 'lucide-react'

const TABS = [
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'budget',    label: 'Budget',    icon: Wallet },
  { id: 'checklists',label: 'Checklists',icon: CheckSquare },
  { id: 'reservations',label:'Stays & Flights', icon: Hotel },
  { id: 'members',   label: 'Members',   icon: Users },
]

export default function TripDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('itinerary')
  useSocket(id) // connects to trip room for real-time

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.get(`/trips/${id}`).then(r => r.data.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-blue-400" size={28} />
    </div>
  )

  if (isError || !trip) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-gray-400">Trip not found or you don't have access.</p>
      <Link to="/dashboard" className="text-blue-400 hover:underline">← Back to Dashboard</Link>
    </div>
  )

  const myMember = trip.members?.find(m => m.user?._id === user?._id || m.user === user?._id)
  const role = myMember?.role || 'viewer'

  const dateRange = `${new Date(trip.startDate).toLocaleDateString('en', { month:'short', day:'numeric' })}
    – ${new Date(trip.endDate).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' })}`

  return (
    <div className="flex flex-col min-h-screen">

      {/* Trip Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-3 transition">
            <ArrowLeft size={13} /> All Trips
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{trip.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={11} /> {dateRange}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={11} /> {trip.members?.length} member{trip.members?.length !== 1 ? 's' : ''}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${role === 'owner' ? 'bg-yellow-500/15 text-yellow-400'
                  : role === 'editor' ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-gray-700/50 text-gray-400'}`}>
                  {role}
                </span>
              </div>
            </div>
            {/* Member presence avatars */}
            <div className="flex -space-x-2">
              {trip.members?.slice(0,5).map((m, i) => (
                <div key={i} title={m.user?.name}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                    border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white">
                  {m.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap
                  border-b-2 transition ${activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'}`}>
                <Icon size={14} /> {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">

          {activeTab === 'itinerary' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                {trip.days?.map((day, idx) => (
                  <DayColumn key={day._id || idx} trip={trip} day={day} dayIndex={idx} role={role} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'budget' && <BudgetPanel tripId={id} role={role} currency={trip.currency} budgetLimit={trip.budgetLimit} />}
          {activeTab === 'checklists' && <ChecklistPanel tripId={id} role={role} members={trip.members} />}
          {activeTab === 'reservations' && <ReservationsPanel tripId={id} role={role} />}
          {activeTab === 'members' && <MembersPanel trip={trip} role={role} currentUserId={user?._id} />}
        </div>
      </div>
    </div>
  )
}