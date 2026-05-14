// LimoFlight V4 — pages/Booking.jsx
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { loadModels, scanAndMatch, registerFace } from '../api/faceAI'
import { useBrand } from '../context/BrandContext'
import { useNotif } from '../context/NotifContext'

const API = import.meta.env.VITE_API_URL

const CITIES = ['Los Angeles, CA', 'Las Vegas, NV', 'New York, NY', 'Miami, FL', 'New Orleans, LA', 'Chicago, IL', 'Nashville, TN']
const SERVICES = ['City Tour — 4hr', 'Airport Transfer', 'Nightlife Tour', 'Restaurants & Bars', 'Custom Route']
const VEHICLES = [
  { label: 'Lincoln MKT (8 pax)', price: 380 },
  { label: 'Cadillac Escalade (6 pax)', price: 340 },
  { label: 'Mercedes Sprinter (15 pax)', price: 520 },
  { label: 'Cadillac CT6 (4 pax)', price: 280 },
]

export default function Booking() {
  const { brand } = useBrand()
  const { addNotif } = useNotif()
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [scanState, setScanState] = useState('idle') // idle | scanning | matched | unknown
  const [matchedCustomer, setMatchedCustomer] = useState(null)
  const [modelsReady, setModelsReady] = useState(false)

  const [form, setForm] = useState({
    city: CITIES[0], serviceType: SERVICES[0], dateTime: '', vehicleIdx: 0,
    specialRequests: '', name: '', airline: '', phone: '', email: '', groupSize: 'Small Group (3-6)', ageRange: 'Mixed',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    loadModels().then(() => setModelsReady(true)).catch(console.error)
    return () => stopCamera()
  }, [])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const price = VEHICLES[form.vehicleIdx].price + 80 + 20

  async function startScan() {
    setScanState('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640 } })
      streamRef.current = stream
      videoRef.current.srcObject = stream

      // Wait for video to be ready, then match
      videoRef.current.onloadeddata = async () => {
        const result = await scanAndMatch(videoRef.current, 0.85)
        stopCamera()
        if (result.matched) {
          setMatchedCustomer(result.customer)
          setScanState('matched')
          setForm(p => ({
            ...p,
            name: result.customer.full_name,
            airline: result.customer.airline,
            phone: result.customer.phone,
            email: result.customer.email,
            groupSize: result.customer.group_size || p.groupSize,
            city: result.customer.city_preference || p.city,
          }))
          addNotif({ type: 'face_match', title: `Face matched: ${result.customer.full_name}`, body: `${Math.round(result.confidence * 100)}% confidence · form auto-filled` })
        } else {
          setScanState('unknown')
        }
      }
    } catch (err) {
      setScanState('idle')
      console.error('Camera error:', err)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  async function sendWhatsApp() {
    if (!form.phone) return
    const msg = `✈ Hello ${form.name}! Your ${brand.name} booking request received.\n📍 ${form.serviceType} in ${form.city}\n🕐 ${form.dateTime ? new Date(form.dateTime).toLocaleString() : 'TBD'}\nTotal: $${price}\nWe'll confirm shortly!`
    await axios.post(`${API}/api/whatsapp/send`, { to: form.phone, message: msg })
    addNotif({ type: 'whatsapp', title: 'WhatsApp sent', body: `Confirmation sent to ${form.name}` })
  }

  async function submitBooking() {
    setSubmitting(true)
    try {
      await axios.post(`${API}/api/booking`, {
        customerId: matchedCustomer?.id,
        ...form, vehicleId: form.vehicleIdx,
        totalPrice: price,
      })
      await sendWhatsApp()
      setSubmitted(true)
      addNotif({ type: 'booking', title: 'Booking confirmed', body: `${form.name} · ${form.serviceType} · $${price}` })
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: brand.color, marginBottom: 6 }}>Booking Confirmed!</div>
        <div style={{ fontSize: 12, color: '#6A6560', marginBottom: 20 }}>WhatsApp confirmation sent to {form.name}</div>
        <button style={{ ...s.btn, background: brand.color, color: '#08080E', border: 'none' }}
          onClick={() => setSubmitted(false)}>New Booking</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.grid2}>
        {/* LEFT: Face scan + customer info */}
        <div>
          <div style={{ ...s.card, marginBottom: 12 }}>
            <div style={s.ct}>Face recognition — auto-identify</div>
            <div style={{ position: 'relative', background: '#1C1C27', borderRadius: 8, overflow: 'hidden', marginBottom: 10, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${scanState === 'matched' ? '#5DC48A' : scanState === 'unknown' ? '#D47A7A' : 'rgba(201,168,76,.2)'}` }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ display: scanState === 'scanning' ? 'block' : 'none', width: '100%', height: 160, objectFit: 'cover' }} />
              {scanState === 'idle' && <div style={{ textAlign: 'center', color: '#6A6560' }}><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><div style={{ fontSize: 11 }}>Tap to scan customer face</div></div>}
              {scanState === 'matched' && <div style={{ textAlign: 'center', padding: 16 }}><div style={{ fontSize: 28, marginBottom: 6 }}>✅</div><div style={{ fontSize: 12, fontWeight: 500, color: '#5DC48A' }}>{matchedCustomer?.full_name}</div><div style={{ fontSize: 10, color: '#6A6560', marginTop: 3 }}>Auto-filled · {matchedCustomer?.total_rides} previous rides</div></div>}
              {scanState === 'unknown' && <div style={{ textAlign: 'center', padding: 16 }}><div style={{ fontSize: 28, marginBottom: 6 }}>❓</div><div style={{ fontSize: 12, color: '#D47A7A' }}>New customer — fill form manually</div></div>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ ...s.btn, flex: 1, justifyContent: 'center', background: brand.color, color: '#08080E', border: 'none', opacity: !modelsReady ? 0.5 : 1 }}
                onClick={startScan} disabled={!modelsReady || scanState === 'scanning'}>
                {!modelsReady ? 'Loading AI...' : scanState === 'scanning' ? 'Scanning...' : '🔍 Scan face'}
              </button>
              <button style={{ ...s.btn, padding: '7px 12px' }} onClick={() => { setScanState('idle'); setMatchedCustomer(null) }}>↺</button>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.ct}>Customer info</div>
            {[
              { label: 'Full name', key: 'name', placeholder: 'Capt. John Smith', type: 'text' },
              { label: 'Airline / Badge', key: 'airline', placeholder: 'United — UA4821', type: 'text' },
              { label: 'WhatsApp', key: 'phone', placeholder: '+1 (555) 000-0000', type: 'tel' },
              { label: 'Email', key: 'email', placeholder: 'pilot@airline.com', type: 'email' },
            ].map(field => (
              <div key={field.key} style={s.fg}>
                <label style={s.label}>{field.label}</label>
                <input style={s.input} type={field.type} placeholder={field.placeholder} value={form[field.key]} onChange={f(field.key)} />
              </div>
            ))}
            <div style={s.grid2half}>
              <div style={s.fg}>
                <label style={s.label}>Group size</label>
                <select style={s.input} value={form.groupSize} onChange={f('groupSize')}>
                  {['Solo (1)', 'Couple (2)', 'Small Group (3-6)', 'Large Group (7-15)'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={s.fg}>
                <label style={s.label}>Age range</label>
                <select style={s.input} value={form.ageRange} onChange={f('ageRange')}>
                  {['Mixed (All Ages)', 'Young Adults (21-35)', 'Adults (36-55)', 'Senior (55+)'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Booking details + payment */}
        <div>
          <div style={{ ...s.card, marginBottom: 12 }}>
            <div style={s.ct}>Booking details</div>
            <div style={s.fg}><label style={s.label}>City</label><select style={s.input} value={form.city} onChange={f('city')}>{CITIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={s.fg}><label style={s.label}>Service type</label><select style={s.input} value={form.serviceType} onChange={f('serviceType')}>{SERVICES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={s.fg}><label style={s.label}>Date & time</label><input style={s.input} type="datetime-local" value={form.dateTime} onChange={f('dateTime')} /></div>
            <div style={s.fg}>
              <label style={s.label}>Vehicle</label>
              <select style={s.input} value={form.vehicleIdx} onChange={e => setForm(p => ({ ...p, vehicleIdx: +e.target.value }))}>
                {VEHICLES.map((v, i) => <option key={i} value={i}>{v.label} — ${v.price}</option>)}
              </select>
            </div>
            <div style={s.fg}><label style={s.label}>Special requests</label><textarea style={{ ...s.input, resize: 'vertical', minHeight: 60 }} placeholder="Dietary needs, accessibility, preferences..." value={form.specialRequests} onChange={f('specialRequests')} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(201,168,76,.12)' }}>
              <span style={{ fontSize: 11, color: '#6A6560' }}>Estimated total</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: brand.color }}>${price}</span>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.ct}>Confirm & send</div>
            <button style={{ ...s.btn, width: '100%', justifyContent: 'center', marginBottom: 8, background: 'rgba(37,211,102,.1)', border: '1px solid rgba(37,211,102,.3)', color: '#25D166' }} onClick={sendWhatsApp}>
              💬 Send WhatsApp confirmation
            </button>
            <button style={{ ...s.btn, width: '100%', justifyContent: 'center', background: brand.color, color: '#08080E', border: 'none', fontWeight: 500, padding: 11 }}
              onClick={submitBooking} disabled={submitting || !form.name}>
              {submitting ? 'Saving...' : `✓ Confirm booking — $${price}`}
            </button>
            <div style={{ textAlign: 'center', fontSize: 9, color: '#3A3830', marginTop: 8 }}>
              🔒 PCI-DSS · TLS 1.3 · Google Play verified
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
  grid2half: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  card: { background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: 13 },
  ct: { fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: '#6A6560', marginBottom: 10 },
  fg: { marginBottom: 9 },
  label: { display: 'block', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#6A6560', marginBottom: 4 },
  input: { width: '100%', padding: '7px 10px', background: '#1C1C27', border: '1px solid rgba(201,168,76,.18)', borderRadius: 6, color: '#E8E4D9', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(201,168,76,.18)', background: '#1C1C27', color: '#E8E4D9', transition: '.15s' },
}
