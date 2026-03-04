import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import LandingPage    from './pages/LandingPage'
import AppLayout      from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import TripDetail     from './pages/TripDetail'
import AcceptInvite   from './pages/AcceptInvite'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

function PublicRoute({ children }) {
  const { accessToken } = useAuthStore()
  if (accessToken) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right"
          toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
        <Routes>
          {/* Landing page — shown at root, redirects to dashboard if logged in */}
          <Route path="/" element={
            <PublicRoute><LandingPage /></PublicRoute>
          } />

          {/* Auth pages — redirect to dashboard if already logged in */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Invite link — no auth required (AcceptInvite handles redirect) */}
          <Route path="/invite/:token" element={<AcceptInvite />} />

          {/* Protected pages */}
          <Route path="/dashboard" element={
            <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute><AppLayout><TripDetail /></AppLayout></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}