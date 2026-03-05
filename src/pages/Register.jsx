import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Sun, Moon, Check, Circle } from 'lucide-react'

/* ── Brand tokens (identical to Login/LandingPage) ────────── */
const LIGHT = {
  bg: '#F4EFE6', bgAlt: '#EDE6DA', bgCard: '#FFFFFF',
  border: '#C8D0CC', text: '#162224', textMuted: '#7A9496',
  textMid: '#3E5A5C', inputBg: '#F8F5F0',
  skyTeal: '#5BB8C4', deepTeal: '#1C6B72', sage: '#6B9E62',
}
const DARK = {
  bg: '#0f1a1c', bgAlt: '#162224', bgCard: '#1c2e30',
  border: 'rgba(91,184,196,0.15)', text: '#e8f0f1',
  textMuted: '#6a9496', textMid: '#a8c4c6', inputBg: 'rgba(91,184,196,0.06)',
  skyTeal: '#5BB8C4', deepTeal: '#2a8a92', sage: '#6B9E62',
}

const BG_IMG = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=75"

/* ── Password strength indicator ─────────────────────────── */
function PasswordStrength({ password, T }) {
  if (!password) return null
  const checks = [
    { label: '8+ characters',    ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number',           ok: /[0-9]/.test(password) },
  ]
  const passed = checks.filter(c => c.ok).length
  const barColor = passed === 3 ? T.sage : passed === 2 ? T.skyTeal : '#f59e0b'

  return (
    <div style={{ marginTop: 8 }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < passed ? barColor : T.border, transition: 'background .25s' }}/>
        ))}
      </div>
      {/* Checks */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
        {checks.map(c => (
          <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: c.ok ? T.sage : T.textMuted, transition: 'color .2s', fontWeight: c.ok ? 600 : 400 }}>
            {c.ok
              ? <Check size={10} color={T.sage} strokeWidth={3}/>
              : <Circle size={10} color={T.textMuted}/>
            }
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const [form,     setForm]     = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [dark,     setDark]     = useState(false)

  const { register, loginWithGoogle, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const T = dark ? DARK : LIGHT

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8)     return toast.error('Password must be 8+ characters')
    if (!/[A-Z]/.test(form.password)) return toast.error('Password needs an uppercase letter')
    if (!/[0-9]/.test(form.password)) return toast.error('Password needs a number')
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  /* ── Shared input style ── */
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `1.5px solid ${T.border}`,
    background: T.inputBg, color: T.text, fontSize: 14,
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color .2s, box-shadow .2s',
  }

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: T.textMuted, textTransform: 'uppercase',
    letterSpacing: 1.2, marginBottom: 7,
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: "'DM Sans', sans-serif", transition: 'background .3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }
        .ts-input:focus { border-color:${T.deepTeal} !important; box-shadow:0 0 0 3px ${T.deepTeal}18 !important }
        .ts-input::placeholder { color:${T.textMuted} }
        .ts-google:hover { background:${T.bgAlt} !important }
        .ts-submit:hover:not(:disabled) { opacity:.88; transform:translateY(-1px) }
        .ts-link:hover { color:${T.deepTeal} !important }
        .ts-toggle:hover { border-color:${T.deepTeal} !important }
        /* Left panel */
        .ts-left { display:none }
        @media(min-width:900px){ .ts-left { display:block !important } }
        /* Mobile padding */
        @media(max-width:520px){ .ts-form-wrap { padding:24px 20px !important } }
      `}</style>

      {/* ── Left panel ──────────────────────────────────────── */}
      <div className="ts-left" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <img src={BG_IMG} alt="travel" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) brightness(0.6)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right,rgba(22,34,36,.2),rgba(28,107,114,.55))` }}/>

        <div style={{ position: 'absolute', bottom: 52, left: 40 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(244,239,230,0.55)', marginBottom: 10, fontWeight: 600 }}>TripSync</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(30px,3.5vw,44px)', fontWeight: 700, color: '#FDFAF6', lineHeight: 1.15, maxWidth: 380 }}>
            Your crew.<br/><em style={{ fontStyle: 'italic', color: LIGHT.skyTeal }}>One place.</em>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(244,239,230,0.58)', marginTop: 14, lineHeight: 1.7, maxWidth: 330 }}>
            Invite friends with a single code. Plan together live — everyone sees changes the moment they happen.
          </p>

          {/* Steps preview */}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['01', 'Create a trip in under 60 seconds'],
              ['02', 'Invite your crew with a 6-char code'],
              ['03', 'Plan, budget & chat — all in one place'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(91,184,196,0.2)', border: '1px solid rgba(91,184,196,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: LIGHT.skyTeal, flexShrink: 0 }}>{n}</div>
                <p style={{ fontSize: 13, color: 'rgba(244,239,230,0.72)' }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="ts-form-wrap" style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '32px 40px', background: T.bgCard,
        borderLeft: `1px solid ${T.border}`,
        minHeight: '100vh', position: 'relative',
      }}>

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 20, left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✈️</div>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 700, color: T.text }}>TripSync</span>
          </Link>
          <button className="ts-toggle" onClick={() => setDark(d => !d)}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
            {dark ? <Sun size={14}/> : <Moon size={14}/>}
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 26 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: T.text, lineHeight: 1.1, marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>
              Start planning trips together — free forever
            </p>
          </div>

          {/* Google */}
          <button className="ts-google" onClick={() => handleGoogle()} disabled={isLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 20px', borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 18, transition: 'background .15s', fontFamily: "'DM Sans', sans-serif" }}>
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: T.border }}/>
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: T.border }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input className="ts-input" type="text" required placeholder="Jane Doe"
                value={form.name} onChange={set('name')} style={inputStyle}/>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input className="ts-input" type="email" required placeholder="you@example.com"
                value={form.email} onChange={set('email')} style={inputStyle}/>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="ts-input" type={showPass ? 'text' : 'password'} required placeholder="Min. 8 characters"
                  value={form.password} onChange={set('password')}
                  style={{ ...inputStyle, paddingRight: 42 }}/>
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <PasswordStrength password={form.password} T={T}/>
            </div>

            {/* Terms note */}
            <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
              By creating an account you agree to our{' '}
              <a href="#" style={{ color: T.deepTeal, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: T.deepTeal, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
            </p>

            {/* Submit */}
            <button type="submit" className="ts-submit" disabled={isLoading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 18px ${T.deepTeal}35`, transition: 'opacity .15s, transform .15s' }}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Sign in link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: T.textMuted, marginTop: 22 }}>
            Already have an account?{' '}
            <Link to="/login" className="ts-link" style={{ color: T.deepTeal, textDecoration: 'none', fontWeight: 600, transition: 'color .15s' }}>
              Sign in
            </Link>
          </p>

          {/* Social proof */}
          <div style={{ marginTop: 28, padding: '14px 16px', borderRadius: 12, background: T.bgAlt, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {/* Stacked avatars */}
              <div style={{ display: 'flex' }}>
                {['P','H','A','R'].map((l,i) => (
                  <div key={l} style={{ width: 26, height: 26, borderRadius: '50%', marginLeft: i > 0 ? -7 : 0, background: [T.deepTeal, T.sage, T.skyTeal, T.deepTeal][i] + '30', border: `2px solid ${T.bgCard}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: [T.deepTeal, T.sage, T.skyTeal, T.deepTeal][i] }}>
                    {l}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: T.textMid, fontWeight: 600 }}>10,000+ travelers already on TripSync</p>
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.65, fontStyle: 'italic' }}>
              "Reshuffled our whole Thailand trip in minutes. The drag-and-drop itinerary builder alone is worth it."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}