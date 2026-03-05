import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters',    pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number',           pass: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      {checks.map(c => (
        <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.pass ? '#34d399' : '#505070' }}>
          <span style={{ fontSize: 10 }}>{c.pass ? '✓' : '○'}</span> {c.label}
        </span>
      ))}
    </div>
  )
}

export default function Register() {
  const [form, setForm]         = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const { register, loginWithGoogle, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  // ── Google register/login ────────────────────────────────
  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginWithGoogle(tokenResponse.access_token)
        toast.success('Account ready!')
        navigate('/dashboard')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-in failed')
      }
    },
    onError: () => toast.error('Google sign-in was cancelled'),
  })

  // ── Email/password register ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8)        return toast.error('Password must be 8+ characters')
    if (!/[A-Z]/.test(form.password))    return toast.error('Password needs an uppercase letter')
    if (!/[0-9]/.test(form.password))    return toast.error('Password needs a number')
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap')`}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', marginBottom: 16, fontSize: 24 }}>
            ✈️
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#f0f0f5', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: '#606080' }}>Start planning trips together</p>
        </div>

        <div style={{ background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

          {/* Google button */}
          <button
            onClick={() => handleGoogle()}
            disabled={isLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e0e0f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 12, color: '#404060', fontWeight: 500 }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Full Name</label>
              <input type="text" required placeholder="John Doe"
                value={form.name} onChange={set('name')}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f0f0f5', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
                onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</label>
              <input type="email" required placeholder="you@example.com"
                value={form.email} onChange={set('email')}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f0f0f5', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
                onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required placeholder="Min. 8 characters"
                  value={form.password} onChange={set('password')}
                  style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f0f0f5', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={e => e.target.style.borderColor = '#4f8ef7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#505070', cursor: 'pointer', fontSize: 12 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <button type="submit" disabled={isLoading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 20px rgba(79,142,247,0.3)', marginTop: 4 }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#505070', marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}