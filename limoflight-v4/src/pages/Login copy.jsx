// LimoFlight V4 — pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBrand } from '../context/BrandContext'

export default function Login() {
  const { login } = useAuth()
  const { brand } = useBrand()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')

  const s = (k) => ({ ...baseInput, ...k })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (result.requires2FA) { setShow2FA(true); setLoading(false); return }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  async function handle2FA(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password, twoFACode)
      navigate('/')
    } catch {
      setError('Invalid 2FA code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Background grid */}
      <div style={styles.grid} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={{ ...styles.logoIcon, background: brand.color }}>
            {brand.logo}
          </div>
          <div style={{ ...styles.logoText, color: brand.color }}>{brand.name}</div>
          <div style={styles.logoSub}>{brand.tagline}</div>
        </div>

        {!show2FA ? (
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>✉</span>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="admin@limoflight.app"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={styles.label}>Password</label>
                <span style={{ ...styles.label, color: brand.color, cursor: 'pointer' }}>
                  Forgot password?
                </span>
              </div>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btn, background: brand.color, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : `Sign in to ${brand.name}`}
            </button>

            <div style={styles.divider}>
              <div style={styles.divLine} />
              <span style={styles.divText}>secured by Google Play</span>
              <div style={styles.divLine} />
            </div>

            <div style={styles.planRow}>
              <span style={styles.planBadge}>Fleet Plan</span>
              <span style={{ ...styles.planBadge, background: 'rgba(58,125,90,.15)', color: '#5DC48A' }}>
                ✓ Licensed
              </span>
              <span style={{ ...styles.planBadge, background: 'rgba(83,74,183,.15)', color: '#AFA9EC' }}>
                🔒 Encrypted
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handle2FA}>
            <div style={styles.twoFAHead}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Two-factor authentication</div>
              <div style={{ fontSize: 11, color: '#6A6560', marginBottom: 16 }}>
                Enter the 6-digit code from your authenticator app
              </div>
            </div>
            <div style={styles.formGroup}>
              <input
                style={{ ...styles.input, textAlign: 'center', fontSize: 22, letterSpacing: 8, paddingLeft: 0 }}
                type="text"
                placeholder="000000"
                maxLength={6}
                value={twoFACode}
                onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" disabled={loading || twoFACode.length < 6}
              style={{ ...styles.btn, background: brand.color, opacity: (loading || twoFACode.length < 6) ? 0.6 : 1 }}>
              {loading ? 'Verifying...' : 'Verify & sign in'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 10, color: '#6A6560', cursor: 'pointer' }} onClick={() => setShow2FA(false)}>
                ← Back to login
              </span>
            </div>
          </form>
        )}

        <div style={styles.footer}>
          Google Play exclusive · {brand.name} V4 · GDPR & CCPA compliant
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', background: '#08080E', display: 'flex',
    alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(201,168,76,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  },
  card: {
    background: '#16161F', border: '1px solid rgba(201,168,76,.18)',
    borderRadius: 14, padding: '32px 28px', width: 380,
    position: 'relative', zIndex: 1,
  },
  logoWrap: { textAlign: 'center', marginBottom: 28 },
  logoIcon: {
    width: 52, height: 52, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, margin: '0 auto 12px', color: '#08080E',
  },
  logoText: {
    fontFamily: "'Playfair Display', serif", fontSize: 22,
    letterSpacing: 0.5, marginBottom: 4,
  },
  logoSub: { fontSize: 11, color: '#6A6560', letterSpacing: 1 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#6A6560', marginBottom: 5 },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 },
  input: {
    width: '100%', padding: '9px 10px 9px 32px', background: '#1C1C27',
    border: '1px solid rgba(201,168,76,.18)', borderRadius: 7,
    color: '#E8E4D9', fontFamily: 'inherit', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .2s',
  },
  error: {
    background: 'rgba(139,51,51,.18)', border: '1px solid rgba(139,51,51,.3)',
    borderRadius: 7, padding: '8px 12px', fontSize: 11, color: '#D47A7A', marginBottom: 12,
  },
  btn: {
    width: '100%', padding: '11px', border: 'none', borderRadius: 8,
    color: '#08080E', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'opacity .2s', marginBottom: 16,
  },
  divider: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  divLine: { flex: 1, height: 1, background: 'rgba(201,168,76,.15)' },
  divText: { fontSize: 9, color: '#6A6560', letterSpacing: 0.5, whiteSpace: 'nowrap' },
  planRow: { display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  planBadge: {
    padding: '3px 9px', borderRadius: 20, fontSize: 9, fontWeight: 500,
    background: 'rgba(201,168,76,.12)', color: '#C9A84C',
  },
  twoFAHead: { textAlign: 'center', color: '#E8E4D9' },
  footer: {
    marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.05)',
    fontSize: 9, color: '#3A3830', textAlign: 'center', letterSpacing: 0.5,
  },
}
