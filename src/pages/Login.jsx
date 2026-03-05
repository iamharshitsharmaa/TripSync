import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Sun, Moon, Eye, EyeOff } from 'lucide-react'

/* ── Brand tokens (same as LandingPage) ──────────────────────
   Sky teal:   #5BB8C4   Deep teal:  #1C6B72
   Cream:      #F4EFE6   Cream dark: #EDE6DA
   Sage:       #6B9E62   Silver:     #C8D0CC
   Dark:       #162224   Mid:        #3E5A5C
──────────────────────────────────────────────────────────── */
const LIGHT = {
  bg:        '#F4EFE6',
  bgAlt:     '#EDE6DA',
  bgCard:    '#FFFFFF',
  border:    '#C8D0CC',
  text:      '#162224',
  textMuted: '#7A9496',
  textMid:   '#3E5A5C',
  inputBg:   '#F8F5F0',
  skyTeal:   '#5BB8C4',
  deepTeal:  '#1C6B72',
  sage:      '#6B9E62',
}
const DARK = {
  bg:        '#0f1a1c',
  bgAlt:     '#162224',
  bgCard:    '#1c2e30',
  border:    'rgba(91,184,196,0.15)',
  text:      '#e8f0f1',
  textMuted: '#6a9496',
  textMid:   '#a8c4c6',
  inputBg:   'rgba(91,184,196,0.06)',
  skyTeal:   '#5BB8C4',
  deepTeal:  '#2a8a92',
  sage:      '#6B9E62',
}

// Background travel image
const BG_IMG = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=75"

export default function Login() {
  const [form,     setForm]     = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [dark,     setDark]     = useState(false)

  const { login, loginWithGoogle, isLoading } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/dashboard'

  const T = dark ? DARK : LIGHT

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    }
  }

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginWithGoogle(tokenResponse.access_token)
        toast.success('Signed in with Google!')
        navigate(from, { replace: true })
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-in failed')
      }
    },
    onError: () => toast.error('Google sign-in was cancelled'),
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'background .3s, color .3s',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
        .ts-input:focus { border-color: ${T.deepTeal} !important; box-shadow: 0 0 0 3px ${T.deepTeal}18 !important }
        .ts-input::placeholder { color: ${T.textMuted} }
        .ts-btn-google:hover { background: ${T.bgAlt} !important }
        .ts-btn-submit:hover:not(:disabled) { opacity: .88; transform: translateY(-1px) }
        .ts-link:hover { color: ${T.deepTeal} !important }
        .ts-toggle:hover { border-color: ${T.deepTeal} !important }
      `}</style>

      {/* ── Left panel — decorative image (hidden on mobile) ── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'none',
        minHeight: '100vh',
      }} className="ts-left-panel">
        <style>{`.ts-left-panel { display: none } @media(min-width:900px){ .ts-left-panel { display: block !important } }`}</style>
        <img
          src={BG_IMG} alt="travel"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) brightness(0.65)' }}
        />
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, rgba(22,34,36,.2), rgba(28,107,114,.55))` }}/>
        {/* Brand text */}
        <div style={{ position: 'absolute', bottom: 52, left: 40 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(244,239,230,0.6)', marginBottom: 10, fontWeight: 600 }}>TripSync</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,3.5vw,46px)', fontWeight: 700, color: '#FDFAF6', lineHeight: 1.15, maxWidth: 400 }}>
            Plan trips<br/><em style={{ fontStyle: 'italic', color: LIGHT.skyTeal }}>together.</em>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(244,239,230,0.6)', marginTop: 14, lineHeight: 1.7, maxWidth: 340 }}>
            One place for your itinerary, budget, packing lists, and group chat — with your whole crew, in real time.
          </p>
          {/* Feature chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
            {['Drag-drop itinerary','Budget tracking','Trip chat','Shared checklists'].map(f => (
              <span key={f} style={{ padding: '5px 13px', borderRadius: 100, background: 'rgba(244,239,230,0.1)', border: '1px solid rgba(244,239,230,0.2)', fontSize: 12, color: 'rgba(244,239,230,0.75)', backdropFilter: 'blur(6px)' }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 40px',
        background: T.bgCard,
        borderLeft: `1px solid ${T.border}`,
        position: 'relative',
        minHeight: '100vh',
      }}>
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 20, left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✈️</div>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 700, color: T.text }}>TripSync</span>
          </Link>
          <button
            className="ts-toggle"
            onClick={() => setDark(d => !d)}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
            {dark ? <Sun size={14}/> : <Moon size={14}/>}
          </button>
        </div>

        {/* Form body */}
        <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: T.text, lineHeight: 1.1, marginBottom: 8 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>
              Sign in to continue to TripSync
            </p>
          </div>

          {/* Google */}
          <button
            className="ts-btn-google"
            onClick={() => handleGoogle()}
            disabled={isLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 20px', borderRadius: 10,
              border: `1.5px solid ${T.border}`,
              background: T.bgAlt,
              color: T.text, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginBottom: 20,
              transition: 'background .15s',
              fontFamily: "'DM Sans', sans-serif",
            }}>
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: T.border }}/>
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: T.border }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>
                Email
              </label>
              <input
                className="ts-input"
                type="email" required placeholder="you@example.com"
                value={form.email} onChange={set('email')}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: `1.5px solid ${T.border}`,
                  background: T.inputBg, color: T.text, fontSize: 14,
                  outline: 'none', fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color .2s, box-shadow .2s',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Password
                </label>
                <a href="#" className="ts-link" style={{ fontSize: 12, color: T.skyTeal, textDecoration: 'none', fontWeight: 500, transition: 'color .15s' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="ts-input"
                  type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password} onChange={set('password')}
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px', borderRadius: 10,
                    border: `1.5px solid ${T.border}`,
                    background: T.inputBg, color: T.text, fontSize: 14,
                    outline: 'none', fontFamily: "'DM Sans', sans-serif",
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                />
                <button
                  type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="ts-btn-submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: `0 4px 18px ${T.deepTeal}35`,
                transition: 'opacity .15s, transform .15s',
                marginTop: 2,
              }}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 13, color: T.textMuted, marginTop: 24 }}>
            No account?{' '}
            <Link to="/register" className="ts-link" style={{ color: T.deepTeal, textDecoration: 'none', fontWeight: 600, transition: 'color .15s' }}>
              Create one free
            </Link>
          </p>

          {/* Testimonial snippet */}
          <div style={{ marginTop: 32, padding: '16px 18px', borderRadius: 12, background: T.bgAlt, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
              {Array.from({length:5}).map((_,i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 10 }}>
              "We planned a 10-day Europe trip for 6 people. No more 200-message WhatsApp threads."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.deepTeal}20`, border: `1.5px solid ${T.deepTeal}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.deepTeal }}>P</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Poonam S.</p>
                <p style={{ fontSize: 10, color: T.textMuted }}>Bangalore</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}