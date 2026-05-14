// LimoFlight V4 — src/guards/SubscriptionGuard.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBrand } from '../context/BrandContext'

// Map route → minimum plan required
const GATED_ROUTES = {
  '/face-ai':    'pro',
  '/opentable':  'pro',
  '/analytics':  'pro',
  '/driver-app': 'pro',
  '/capcut':     'fleet',
  '/tracking':   'fleet',
  '/whitelabel': 'fleet',
}

const PLAN_RANK = { free: 0, pro: 1, fleet: 2 }

function hasAccess(userPlan, requiredPlan) {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0)
}

export default function SubscriptionGuard({ children }) {
  const { user } = useAuth()
  const { brand } = useBrand()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const plan = user?.plan || 'free'
  const required = GATED_ROUTES[pathname]

  if (required && !hasAccess(plan, required)) {
    const planLabel = required.charAt(0).toUpperCase() + required.slice(1)
    return (
      <div style={styles.wrap}>
        <div style={styles.icon}>🔒</div>
        <div style={styles.title}>Feature locked</div>
        <div style={styles.sub}>
          This feature requires the <strong style={{ color: brand.color }}>{planLabel}</strong> plan or higher.
          <br />Your current plan: <strong>{plan}</strong>
        </div>
        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, background: brand.color, color: '#08080E', border: 'none' }}
            onClick={() => navigate('/billing')}
          >
            View plans & upgrade
          </button>
          <button
            style={styles.btn}
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return children
}

const styles = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: 420,
    fontFamily: "'DM Sans', system-ui, sans-serif", color: '#E8E4D9',
    textAlign: 'center', padding: '2rem',
  },
  icon:    { fontSize: 48, marginBottom: 16 },
  title:   { fontSize: 18, fontWeight: 500, marginBottom: 8 },
  sub:     { fontSize: 13, color: '#6A6560', lineHeight: 1.7, marginBottom: 24, maxWidth: 360 },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btn: {
    padding: '9px 20px', borderRadius: 8, fontSize: 12,
    fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
    border: '1px solid rgba(201,168,76,.3)', background: 'transparent', color: '#E8E4D9',
  },
}
