// LimoFlight V4 — src/pages/OpenTable.jsx
import { useState } from 'react'
import { useBrand } from '../context/BrandContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const DEMO_VENUES = [
  { em: '🥩', name: 'Spago Beverly Hills',  type: 'Fine dining',    rating: '4.9', avail: '8 PM open',  comm: '8%',  age: 'All ages' },
  { em: '🍣', name: 'Nobu Malibu',           type: 'Japanese',       rating: '4.8', avail: '7:30 open',  comm: '10%', age: 'All ages' },
  { em: '🍷', name: 'Catch LA',              type: 'American / Bar', rating: '4.6', avail: '9 PM open',  comm: '9%',  age: 'All ages' },
  { em: '🥂', name: "Perino's Rooftop",      type: 'Italian',        rating: '4.7', avail: '7 PM open',  comm: '11%', age: 'All ages' },
  { em: '🍸', name: 'SkyBar Mondrian',       type: 'Bar / Lounge',   rating: '4.5', avail: '10 PM open', comm: '12%', age: '21+' },
  { em: '🦞', name: 'Water Grill',           type: 'Seafood',        rating: '4.9', avail: '6:30 open',  comm: '8%',  age: 'All ages' },
]

export default function OpenTable() {
  const { brand } = useBrand()
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState('')

  async function bookVenue(name) {
    setBooking(true)
    try {
      // Real call when backend is connected
      // await axios.post(`${API}/api/venues/reserve`, { ... })
      await new Promise(r => setTimeout(r, 800)) // demo delay
      setBooked(name)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      {booked && (
        <div style={{ background: 'rgba(58,125,90,.15)', border: '1px solid rgba(58,125,90,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#5DC48A' }}>
          ✓ Table reserved at <strong>{booked}</strong> — confirmation sent via WhatsApp
          <button onClick={() => setBooked('')} style={{ marginLeft: 12, fontSize: 10, color: '#5DC48A', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={card}>
          <div style={ct}>OpenTable API status</div>
          {[['Status', '✓ Live', '#5DC48A'], ['Partner venues', '38 restaurants · 24 bars', null], ['Today reservations', '7 booked', null], ['Commission earned', '$840', '#5DC48A']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 11 }}>
              <span style={{ color: '#6A6560' }}>{l}</span>
              <span style={{ color: c || '#E8E4D9' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={ct}>Quick reservation</div>
          {['Customer', 'Cuisine preference', 'Party size'].map(l => (
            <div key={l} style={{ marginBottom: 8 }}>
              <label style={lbl}>{l}</label>
              <input style={inp} placeholder={l + '...'} />
            </div>
          ))}
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Date & time</label>
            <input style={inp} type="datetime-local" />
          </div>
          <button
            onClick={() => bookVenue('Selected venue')}
            disabled={booking}
            style={{ width: '100%', padding: 8, borderRadius: 7, background: brand.color, color: '#08080E', border: 'none', fontFamily: 'inherit', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: booking ? 0.7 : 1 }}
          >
            {booking ? 'Searching...' : '🔍 Find & book table'}
          </button>
        </div>
      </div>

      <div style={card}>
        <div style={ct}>Recommended venues — Los Angeles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
          {DEMO_VENUES.map(v => (
            <div key={v.name} onClick={() => bookVenue(v.name)}
              style={{ background: '#1C1C27', border: '1px solid rgba(201,168,76,.15)', borderRadius: 9, padding: 10, cursor: 'pointer', transition: '.15s' }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>{v.em}</div>
              <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 2 }}>{v.name}</div>
              <div style={{ fontSize: 9, color: '#6A6560', marginBottom: 5 }}>{v.type} · {v.age}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: brand.color }}>★ {v.rating} · {v.avail}</span>
                <span style={{ fontSize: 9, background: 'rgba(58,125,90,.15)', color: '#5DC48A', padding: '1px 6px', borderRadius: 10 }}>{v.comm}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Billing.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function Billing() {
  const { brand } = useBrand()

  const PLANS = [
    { name: 'Free',  price: 0,   period: 'forever', color: '#6A6560', features: ['5 bookings/month', '1 driver account', 'Basic dashboard'], locked: ['Face AI', 'WhatsApp auto-send', 'GPS tracking', 'White-label'] },
    { name: 'Pro',   price: 49,  period: '/month',  color: brand.color, popular: true, features: ['Unlimited bookings', '5 driver accounts', 'AI face recognition', 'WhatsApp auto-send', 'Partner venues', 'Advanced reports'], locked: ['GPS tracking', 'White-label branding'] },
    { name: 'Fleet', price: 149, period: '/month',  color: '#AFA9EC', current: true, features: ['Everything in Pro', 'Unlimited drivers', 'Live GPS tracking', 'White-label branding', 'CapCut AI reels', 'Priority support'], locked: [] },
  ]

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
        {PLANS.map(p => (
          <div key={p.name} style={{ background: '#16161F', border: `${p.current ? 2 : 1}px solid ${p.current ? p.color : 'rgba(201,168,76,.15)'}`, borderRadius: 12, padding: 16, position: 'relative' }}>
            {(p.popular || p.current) && (
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: p.color, color: p.current ? '#08080E' : '#08080E', fontSize: 9, fontWeight: 500, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {p.current ? 'Current plan' : 'Most popular'}
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: p.color, marginBottom: 2 }}>
              {p.price === 0 ? 'Free' : `$${p.price}`}
              <span style={{ fontSize: 11, color: '#6A6560' }}>{p.period}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(201,168,76,.12)', margin: '10px 0' }} />
            {p.features.map(f => <div key={f} style={{ fontSize: 10, color: '#E8E4D9', padding: '3px 0' }}>✓ {f}</div>)}
            {p.locked.map(f => <div key={f} style={{ fontSize: 10, color: '#3A3830', padding: '3px 0' }}>✕ {f}</div>)}
            <button
              style={{ width: '100%', padding: 8, borderRadius: 8, marginTop: 12, fontSize: 11, fontFamily: 'inherit', cursor: p.current ? 'default' : 'pointer', background: p.current ? 'transparent' : p.color, color: p.current ? p.color : '#08080E', border: `1px solid ${p.color}`, fontWeight: 500 }}
              disabled={p.current}
            >
              {p.current ? 'Current plan' : `Upgrade to ${p.name}`}
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <div style={card}>
          <div style={ct}>Google Play license</div>
          {[['Server', '✓ Connected', '#5DC48A'], ['Signature', 'Verified ✓', '#5DC48A'], ['Install source', 'Play Store only', null], ['Anti-clone', 'Active', '#5DC48A'], ['Next billing', 'Jun 9 · $149', brand.color]].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 10 }}>
              <span style={{ color: '#6A6560' }}>{l}</span>
              <span style={{ color: c || '#E8E4D9' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={ct}>Payment methods</div>
          {[['Google Play Billing', 'Primary', '#5DC48A'], ['Stripe / Credit card', 'Backup', '#7AAAE0'], ['PayPal', 'Backup', '#7AAAE0']].map(([m, s, c]) => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 11 }}>
              <span>{m}</span>
              <span style={{ background: c + '20', color: c, fontSize: 9, padding: '1px 7px', borderRadius: 10 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={ct}>Recent invoices</div>
          {['May 2026', 'Apr 2026', 'Mar 2026', 'Feb 2026'].map(m => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 10 }}>
              <span style={{ color: '#6A6560' }}>{m}</span>
              <span style={{ color: '#5DC48A' }}>$149 Paid</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Security.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function Security() {
  const CHECKS = [
    { icon: 'ti-lock',        label: 'TLS 1.3 encryption',     status: 'Active',      ok: true  },
    { icon: 'ti-fingerprint', label: 'Face biometric',          status: 'Active',      ok: true  },
    { icon: 'ti-credit-card', label: 'PCI-DSS compliance',      status: 'Active',      ok: true  },
    { icon: 'ti-key',         label: '2FA admin login',          status: 'Recommended', ok: false },
    { icon: 'ti-copy-off',    label: 'Anti-clone (Google Play)', status: 'Enforced',    ok: true  },
    { icon: 'ti-database',    label: 'GDPR + CCPA',              status: 'Compliant',   ok: true  },
    { icon: 'ti-eye-off',     label: 'Data retention',           status: '90 days',     ok: true  },
    { icon: 'ti-activity',    label: 'Audit logging',            status: 'Active',      ok: true  },
  ]
  const AUDIT = [
    ['✓', 'Admin login — 10:24 AM · IP 192.168.1.1', '#5DC48A'],
    ['✓', 'Face match Capt. Williams — 10:31 AM',    '#5DC48A'],
    ['✓', 'Booking #1042 created — 10:33 AM',        '#5DC48A'],
    ['✓', 'WhatsApp sent → Williams — 10:33 AM',     '#5DC48A'],
    ['✓', 'OpenTable reserved Spago — 10:45 AM',     '#5DC48A'],
    ['⚠', 'Failed login attempt blocked — 11:02 AM', '#C9A84C'],
    ['✓', 'License verified — 11:15 AM Play Store',  '#5DC48A'],
    ['✓', 'Payment $480 processed — 11:20 AM',       '#5DC48A'],
  ]
  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={card}>
          <div style={ct}>Security status</div>
          {CHECKS.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 11 }}>
              <i className={`ti ${c.icon}`} style={{ fontSize: 13, color: c.ok ? '#5DC48A' : '#C9A84C', width: 14 }} aria-hidden="true" />
              <span style={{ flex: 1 }}>{c.label}</span>
              <span style={{ background: c.ok ? 'rgba(58,125,90,.15)' : 'rgba(201,168,76,.12)', color: c.ok ? '#5DC48A' : '#C9A84C', fontSize: 9, padding: '1px 7px', borderRadius: 10 }}>{c.status}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={ct}>Audit log</div>
          {AUDIT.map(([ic, msg, color], i) => (
            <div key={i} style={{ fontSize: 10, padding: '4px 0', color: '#6A6560', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <span style={{ color }}>{ic}</span> {msg}
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={ct}>Data collected per customer</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {['📷 Face embedding (AES-256 encrypted)', '👤 Name, airline, badge #', '📱 WhatsApp number', '✉️ Email address', '👥 Group size & age range', '🏙 City history & preferences', '🛣 Route & venue history', '💳 Payment token (never raw card)'].map((d, i) => (
            <div key={i} style={{ background: '#1C1C27', borderRadius: 7, padding: '8px 10px', fontSize: 10, color: '#6A6560' }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/FaceAI.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function FaceAI() {
  const { brand } = useBrand()
  const [scanning, setScanning]       = useState(false)
  const [result, setResult]           = useState(null)
  const [scanIdx, setScanIdx]         = useState(0)

  const FACES = [
    { emoji: '✈', name: 'Capt. Williams', airline: 'American Airlines', rides: 7,  conf: 94 },
    { emoji: '🎖', name: 'F/O Chen',       airline: 'Delta Airlines',    rides: 3,  conf: 91 },
    { emoji: '🛩', name: 'Capt. Rodriguez', airline: 'United Airlines',  rides: 1,  conf: 88 },
    { emoji: '👩‍✈️', name: 'F/O Patel',    airline: 'Southwest',         rides: 5,  conf: 96 },
    { emoji: '✈', name: 'Capt. Murphy',   airline: 'JetBlue',           rides: 2,  conf: 89 },
  ]

  function demoScan() {
    setScanning(true)
    setResult(null)
    setTimeout(() => {
      const f = FACES[scanIdx % FACES.length]
      setScanIdx(i => i + 1)
      setResult(f)
      setScanning(false)
    }, 1500)
  }

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={ct}>Recognition scanner</div>
          <div onClick={!scanning ? demoScan : undefined}
            style={{ background: '#1C1C27', borderRadius: 8, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1px dashed ${result ? (result.conf >= 85 ? '#5DC48A' : '#D47A7A') : 'rgba(201,168,76,.2)'}`, cursor: scanning ? 'wait' : 'pointer', marginBottom: 10, transition: 'border-color .3s' }}>
            {scanning ? (
              <>
                <div style={{ fontSize: 36, animation: 'spin 1s linear infinite' }}>⟳</div>
                <div style={{ fontSize: 11, color: '#6A6560' }}>Scanning face...</div>
              </>
            ) : result ? (
              <>
                <div style={{ fontSize: 36 }}>{result.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#5DC48A' }}>{result.name}</div>
                <div style={{ fontSize: 10, color: '#6A6560' }}>{result.airline} · {result.rides} rides · {result.conf}% confidence</div>
              </>
            ) : (
              <>
                <i className="ti ti-scan" style={{ fontSize: 36, color: '#6A6560' }} aria-hidden="true" />
                <div style={{ fontSize: 11, color: '#6A6560' }}>Tap to activate demo scan</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={demoScan} disabled={scanning}
              style={{ flex: 1, padding: 8, borderRadius: 7, background: brand.color, color: '#08080E', border: 'none', fontFamily: 'inherit', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: scanning ? 0.6 : 1 }}>
              {scanning ? 'Scanning...' : '🔍 Demo scan'}
            </button>
            <button onClick={() => { setResult(null); setScanIdx(0) }}
              style={{ padding: '7px 12px', borderRadius: 7, background: '#1C1C27', border: '1px solid rgba(201,168,76,.18)', color: '#E8E4D9', cursor: 'pointer' }}>
              ↺
            </button>
          </div>
        </div>
        <div style={card}>
          <div style={ct}>Face database — {FACES.length} profiles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
            {FACES.map((f, i) => (
              <div key={i} onClick={() => { setResult(f); setScanIdx(i + 1) }}
                style={{ background: '#1C1C27', border: `1px solid ${result?.name === f.name ? brand.color : 'rgba(201,168,76,.15)'}`, borderRadius: 8, padding: 9, textAlign: 'center', cursor: 'pointer', transition: '.15s' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{f.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 500 }}>{f.name}</div>
                <div style={{ fontSize: 9, color: '#6A6560' }}>{f.airline}</div>
                <div style={{ fontSize: 9, color: brand.color, marginTop: 2 }}>{f.rides} rides</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// src/pages/CapCutAI.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function CapCutAI() {
  const { brand } = useBrand()
  const [generating, setGenerating]   = useState(false)
  const [progress, setProgress]       = useState(0)
  const [step, setStep]               = useState('')
  const [reels, setReels]             = useState([
    { title: 'Beverly Hills Tour',  dur: '47 sec', res: '4K',   date: 'Today',     views: 142, status: 'ready' },
    { title: 'Jazz District Night', dur: '31 sec', res: '4K',   date: 'Yesterday', views: 89,  status: 'ready' },
    { title: 'Hollywood Sign Loop', dur: '58 sec', res: '1080p',date: 'Jun 5',     views: 204, status: 'ready' },
  ])
  const [effects, setEffects] = useState([
    { icon: 'ti-sun',              label: 'Golden hour',    sel: true  },
    { icon: 'ti-movie',            label: 'Cinematic',      sel: false },
    { icon: 'ti-layout-grid',      label: 'Split-screen',   sel: false },
    { icon: 'ti-text-size',        label: 'Auto captions',  sel: true  },
    { icon: 'ti-map',              label: 'Route overlay',  sel: false },
    { icon: 'ti-music',            label: 'Beat sync',      sel: false },
    { icon: 'ti-brand-instagram',  label: '9:16 crop',      sel: false },
    { icon: 'ti-color-filter',     label: 'Color grade',    sel: true  },
  ])

  const STEPS = ['Analyzing footage...', 'Detecting highlights...', 'Syncing to music...', 'Applying AI effects...', 'Rendering 4K output...', 'Finalizing reel...']

  function generate() {
    setGenerating(true); setProgress(0)
    let p = 0, si = 0
    const iv = setInterval(() => {
      p = Math.min(p + 3 + Math.random() * 5, 100)
      setProgress(Math.round(p))
      setStep(STEPS[Math.min(si++, STEPS.length - 1)])
      if (p >= 100) {
        clearInterval(iv)
        setGenerating(false)
        setReels(r => [{ title: 'Downtown LA Cruise', dur: '44 sec', res: '4K', date: 'Just now', views: 0, status: 'ready' }, ...r])
      }
    }, 220)
  }

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={card}>
            <div style={ct}>AI highlight reel generator</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(83,74,183,.15)', border: '1px solid rgba(83,74,183,.25)', borderRadius: 20, fontSize: 10, color: '#AFA9EC', marginBottom: 10 }}>
              ✨ Powered by CapCut AI · Auto-edit enabled
            </div>
            {[['Tour source', ['Beverly Hills Tour — Today', 'Jazz District Night', 'Hollywood Sign Loop']], ['Reel style', ['Cinematic luxury', 'Fast-cut energetic', 'Vlog travel diary', 'Social media short']], ['Duration', ['15 sec (Instagram)', '30 sec (TikTok)', '60 sec (YouTube Shorts)']], ['AI music', ['Jazz lounge', 'Epic cinematic', 'Upbeat pop', 'Lo-fi chill']]].map(([l, opts]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <label style={lbl}>{l}</label>
                <select style={inp}>{opts.map(o => <option key={o}>{o}</option>)}</select>
              </div>
            ))}
            {generating && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: '#6A6560' }}>{step}</span>
                  <span style={{ color: brand.color }}>{progress}%</span>
                </div>
                <div style={{ height: 4, background: '#1C1C27', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: brand.color, borderRadius: 2, width: progress + '%', transition: 'width .15s' }} />
                </div>
              </div>
            )}
            <button onClick={generate} disabled={generating}
              style={{ width: '100%', padding: 9, borderRadius: 8, background: brand.color, color: '#08080E', border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: generating ? 0.7 : 1 }}>
              {generating ? 'Generating...' : '✨ Generate AI reel'}
            </button>
          </div>
          <div style={card}>
            <div style={ct}>AI effects & filters</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {effects.map((ef, i) => (
                <div key={ef.label}
                  onClick={() => setEffects(e => e.map((x, j) => j === i ? { ...x, sel: !x.sel } : x))}
                  style={{ background: '#1C1C27', border: `1px solid ${ef.sel ? brand.color : 'rgba(201,168,76,.15)'}`, borderRadius: 7, padding: '7px 4px', textAlign: 'center', cursor: 'pointer', color: ef.sel ? brand.color : '#6A6560', transition: '.15s' }}>
                  <i className={`ti ${ef.icon}`} style={{ display: 'block', fontSize: 16, marginBottom: 3 }} aria-hidden="true" />
                  <div style={{ fontSize: 8 }}>{ef.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={ct}>Reel library</div>
          {reels.map((r, i) => (
            <div key={i} style={{ background: '#1C1C27', border: '1px solid rgba(201,168,76,.15)', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 38, borderRadius: 6, background: '#16161F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: brand.color }}>▶</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: 9, color: '#6A6560' }}>{r.dur} · {r.res} · {r.date}{r.views > 0 ? ` · ${r.views} views` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button style={{ padding: '4px 8px', borderRadius: 6, fontSize: 9, cursor: 'pointer', background: '#1C1C27', border: '1px solid rgba(201,168,76,.2)', color: '#E8E4D9' }}>↗ Share</button>
                <button style={{ padding: '4px 8px', borderRadius: 6, fontSize: 9, cursor: 'pointer', background: '#1C1C27', border: '1px solid rgba(201,168,76,.2)', color: '#E8E4D9' }}>↓</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── shared style tokens ───────────────────────────────────────────────────────
const card = { background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: 13 }
const ct   = { fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: '#6A6560', marginBottom: 10 }
const lbl  = { display: 'block', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#6A6560', marginBottom: 4 }
const inp  = { width: '100%', padding: '7px 10px', background: '#1C1C27', border: '1px solid rgba(201,168,76,.18)', borderRadius: 6, color: '#E8E4D9', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' }
