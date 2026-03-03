import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuthStore()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [tripId, setTripId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!accessToken) {
      // Not logged in — save token in sessionStorage and redirect to register
      sessionStorage.setItem('pendingInvite', token)
      navigate('/register?redirect=invite')
      return
    }
    acceptInvite()
  }, [token, accessToken])

  const acceptInvite = async () => {
    try {
      const { data } = await api.post(`/invites/${token}/accept`)
      setTripId(data.data.tripId)
      setStatus('success')
      toast.success('You joined the trip!')
      setTimeout(() => navigate(`/trips/${data.data.tripId}`), 1500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.response?.data?.message || 'Invalid or expired invite link')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {status === 'loading' && (
          <div>
            <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={36} />
            <h2 className="text-lg font-bold text-white">Joining trip...</h2>
            <p className="text-gray-400 text-sm mt-2">Verifying your invite link</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">You're in!</h2>
            <p className="text-gray-400 text-sm mb-4">Redirecting you to the trip...</p>
            <Link to={`/trips/${tripId}`}
              className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm">
              Go to Trip →
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-white mb-2">Invite failed</h2>
            <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
            <Link to="/dashboard"
              className="inline-block px-5 py-2.5 bg-gray-800 border border-gray-700 text-white font-semibold rounded-xl text-sm">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}