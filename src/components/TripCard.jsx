import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function TripCard({ trip }) {
  const navigate = useNavigate()

  const role =
  trip.members.find(m =>
    m.user?.toString() === trip.owner?._id?.toString()
  )?.role || 'viewer'

  const duration =
    Math.ceil(
      (new Date(trip.endDate) - new Date(trip.startDate)) /
        (1000 * 60 * 60 * 24)
    ) + 1

  return (
    <div
      onClick={() => navigate(`/trips/${trip._id}`)}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 cursor-pointer transition"
    >
      {/* Cover */}
      <div
        className="h-32 rounded-lg bg-gray-800 mb-4 bg-cover bg-center"
        style={{
          backgroundImage: trip.coverImage
            ? `url(${trip.coverImage})`
            : 'none',
        }}
      />

      <h3 className="font-bold text-lg mb-1">{trip.title}</h3>

      <p className="text-sm text-gray-400 mb-3">
        {format(new Date(trip.startDate), 'dd MMM')} —{' '}
        {format(new Date(trip.endDate), 'dd MMM yyyy')} · {duration} days
      </p>

      {/* Status + Role */}
      <div className="flex justify-between items-center text-xs">
        <span
          className={`px-2 py-1 rounded-full ${
            trip.status === 'active'
              ? 'bg-green-600/20 text-green-400'
              : trip.status === 'draft'
              ? 'bg-yellow-600/20 text-yellow-400'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {trip.status}
        </span>

        <span className="text-gray-400 capitalize">
          {role}
        </span>
      </div>

      {/* Members */}
      <div className="flex -space-x-2 mt-4">
        {trip.members.slice(0, 5).map(m => (
          <img
            key={m._id}
            src={m.user?.avatar}
            alt=""
            className="w-8 h-8 rounded-full border border-gray-900"
          />
        ))}
      </div>
    </div>
  )
}