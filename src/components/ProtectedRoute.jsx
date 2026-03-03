import { Navigate , useLocation} from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children })  {
  const { accessToken } = useAuthStore()
  const location = useLocation()

  if (!accessToken) {
    // Save the page they tried to visit so we can redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}