import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import AppLayout      from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import TripDetail     from './pages/TripDetail'
import AcceptInvite   from './pages/AcceptInvite'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
})

// Redirects to /dashboard if already logged in
// Used on /login and /register so logged-in users don't see auth pages
function PublicRoute({ children }) {
  const { accessToken } = useAuthStore()
  if (accessToken) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
          }}
        />
        <Routes>
          {/* Public routes — redirect to dashboard if already logged in */}
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute><Register /></PublicRoute>
          } />

          {/* Invite route — accessible without login (AcceptInvite handles redirect) */}
          <Route path="/invite/:token" element={<AcceptInvite />} />

          {/* Protected routes — redirect to login if not logged in */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute>
              <AppLayout><TripDetail /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Root — go to dashboard if logged in, login if not */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Any unknown URL — same logic */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}