import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be 6+ chars')
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
            <span className="text-2xl">✈️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Start planning trips together</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <input type="text" placeholder="John Doe" required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white
                  placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                value={form.name} onChange={set('name')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input type="email" placeholder="you@example.com" required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white
                  placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                value={form.email} onChange={set('email')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input type="password" placeholder="Min. 6 characters" required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white
                  placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                value={form.password} onChange={set('password')}
              />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold
                rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}