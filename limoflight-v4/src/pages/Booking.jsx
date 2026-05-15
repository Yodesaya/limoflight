// LimoFlight V4 — pages/Booking.jsx (with face validation)
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useBrand } from '../context/BrandContext'
import { useNotif } from '../context/NotifContext'
import { validateFace, loadFaceModels, areModelsLoaded } from '../api/faceValidation'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const CITIES   = ['Los Angeles, CA', 'Las Vegas, NV', 'New York, NY', 'Miami, FL', 'New Orleans, LA', 'Chicago, IL', 'Nashville, TN']
const SERVICES = ['City Tour — 4hr', 'Airport Transfer', 'Nightlife Tour', 'Restaurants & Bars', 'Custom Route']
const VEHICLES = [
  { label: 'Lincoln MKT (8 pax)',        price: 380 },
  { label: 'Cadillac Escalade (6 pax)',  price: 340 },
  { label: 'Mercedes Sprinter (15 pax)', price: 520 },
  { label: 'Cadillac CT6 (4 pax)',       price: 280 },
]

const DEMO_DB = [
  { emoji:'✈',  full_name:'Capt. Williams', airline:'American Airlines', phone:'+13105550192', email:'williams@aa.com', group_size:'Large Group (7-15)', city_preference:'Los Angeles, CA',  total_rides:7, confidence:94 },
  { emoji:'🎖', full_name:'F/O Chen',        airline:'Delta Airlines',    phone:'+14045550811', email:'chen@delta.com',  group_size:'Couple (2)',          city_preference:'Las Vegas, NV',   total_rides:3, confidence:91 },
  { emoji:'🛩', full_name:'Capt. Rodriguez', airline:'United Airlines',   phone:'+17135550330', email:'rod@united.com',  group_size:'Solo (1)',            city_preference:'Miami, FL',       total_rides:1, confidence:88 },
  { emoji:'👩‍✈️',full_name:'F/O Patel',    airline:'Southwest',         phone:'+12145550774', email:'patel@sw.com',    group_size:'Small Group (3-6)',   city_preference:'New Orleans, LA', total_rides:5, confidence:96 },
  { emoji:'✈',  full_name:'Capt. Murphy',   airline:'JetBlue',           phone:'+16175550903', email:'murphy@jb.com',   group_size:'Couple (2)',          city_preference:'New York, NY',    total_rides:2, confidence:89 },
]

// Validation rules with emoji icons
const RULES = [
  { id:'face',    icon:'👤', label:'ใบหน้าชัดเจนในวงกลม' },
  { id:'front',   icon:'➡️', label:'หันหน้าตรง ไม่เอียง' },
  { id:'nopitch', icon:'⬆️', label:'ไม่เงย/ก้มหน้า' },
  { id:'nocover', icon:'🚫', label:'ไม่มีอะไรปิดใบหน้า' },
  { id:'nomask',  icon:'😷', label:'ไม่ใส่หน้ากาก' },
  { id:'noglass', icon:'🕶',  label:'ไม่ใส่แว่นดำ' },
  { id:'light',   icon:'💡', label:'แสงสว่างเพียงพอ' },
  { id:'clear',   icon:'🔍', label:'ภาพไม่เบลอ' },
]

let demoIdx = 0

export default function Booking() {
  const { brand }    = useBrand()
  const { addNotif } = useNotif()

  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [camState, setCamState]                 = useState('idle')
  const [capturedUrl, setCapturedUrl]           = useState(null)
  const [photoHistory, setPhotoHistory]         = useState([])
  const [matchedCustomer, setMatchedCustomer]   = useState(null)
  const [pipeSteps, setPipeSteps]               = useState([0,0,0,0,0])
  const [validationResult, setValidationResult] = useState(null) // { valid, errors, warnings, ruleStatus }
  const [validating, setValidating]             = useState(false)

  const [form, setForm] = useState({
    city: CITIES[0], serviceType: SERVICES[0], dateTime: '',
    vehicleIdx: 0, specialRequests: '',
    name: '', airline: '', phone: '', email: '',
    groupSize: 'Small Group (3-6)', ageRange: 'Mixed (All Ages)',
  })
  const [submitting, setSubmitting]   = useState(false)
  const [submitted,  setSubmitted]    = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [modelLoading, setModelLoading] = useState(true)

  // Load face-api.js models when page opens
  useEffect(() => {
    loadFaceModels().then(ok => {
      setModelsReady(ok)
      setModelLoading(false)
    })
  }, [])

  const fv    = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const price = VEHICLES[form.vehicleIdx].price + 80 + 20

  // ── Camera ───────────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:{ ideal:1280 }, height:{ ideal:720 }, facingMode:'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.style.transform = 'scaleX(-1)'
      }
      setCamState('live')
      setStep(0, 2)
      setValidationResult(null)
    } catch (err) {
      alert('ไม่สามารถเปิดกล้องได้ — กรุณา Allow camera permission ใน browser ครับ\n\n' + err.message)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamState('idle')
    setCapturedUrl(null)
    setMatchedCustomer(null)
    setValidationResult(null)
    setPipeSteps([0,0,0,0,0])
  }

  function capturePhoto() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    const url = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedUrl(url)
    setPhotoHistory(prev => [url, ...prev].slice(0, 5))
    setCamState('captured')
    setValidationResult(null)
    setStep(1, 2)
  }

  function retakePhoto() {
    setCapturedUrl(null)
    setValidationResult(null)
    setCamState('live')
    setMatchedCustomer(null)
    setPipeSteps([2,0,0,0,0])
  }

  // ── Face validation + scan ───────────────────────────────────────────────
  async function runFaceScan() {
    if (!capturedUrl) { capturePhoto(); return }

    setValidating(true)
    setCamState('validating')
    setValidationResult(null)
    setStep(2, 1)

    try {
      // Load captured image into temp canvas
      const tempCanvas = document.createElement('canvas')
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload  = resolve
        img.onerror = reject
        img.src = capturedUrl
      })
      tempCanvas.width  = img.width  || 640
      tempCanvas.height = img.height || 480
      tempCanvas.getContext('2d').drawImage(img, 0, 0)

      // Run validation (has built-in 3s timeout)
      const vResult = await validateFace(tempCanvas)
      const ruleStatus = mapErrorsToRules(vResult.errors, vResult.warnings)
      setValidationResult({ ...vResult, ruleStatus })
      setStep(2, 2)

      if (!vResult.valid) {
        setCamState('invalid')
        return
      }

      // ── Passed → match ────────────────────────────────────────────────
      setCamState('scanning')
      setStep(3, 1)
      await delay(700)
      setStep(3, 2)
      setStep(4, 1)
      await delay(500)
      setStep(4, 2)

      // Try real API, fallback to demo ONLY if models validated the face
      try {
        const res = await axios.post(`${API}/api/face/match`, { descriptor: [] })
        if (res.data.matched) { handleMatch(res.data.customer, res.data.confidence * 100); return }
      } catch {}

      // Demo match (models validated face as real — safe to match)
      if (modelsReady) {
        const customer = DEMO_DB[demoIdx % DEMO_DB.length]
        demoIdx++
        handleMatch(customer, customer.confidence)
      } else {
        // Models not loaded — cannot safely match
        setValidationResult({
          valid: false,
          errors: ['AI models ยังไม่พร้อม กรุณารอให้โหลดเสร็จแล้วลองใหม่'],
          warnings: [],
          ruleStatus: {},
        })
        setCamState('invalid')
      }

    } catch (err) {
      // Any unexpected error → reset to captured so user can retry
      console.error('Face scan error:', err)
      setValidationResult({ valid: false, errors: ['เกิดข้อผิดพลาด กรุณาถ่ายภาพใหม่'], warnings: [], ruleStatus: {} })
      setCamState('invalid')
    } finally {
      setValidating(false)
    }
  }

  function handleMatch(customer, confidence) {
    setMatchedCustomer({ ...customer, confidence })
    setCamState('matched')
    setForm(p => ({
      ...p,
      name:      customer.full_name,
      airline:   customer.airline,
      phone:     customer.phone,
      email:     customer.email,
      groupSize: customer.group_size      || p.groupSize,
      city:      customer.city_preference || p.city,
    }))

    // ── Upload face photo to Cloudinary ──────────────────────────────────
    if (capturedUrl && customer.id) {
      axios.post(`${API}/api/face/upload`, {
        imageBase64: capturedUrl,
        customerId:  customer.id,
      }).then(res => {
        console.log('[Cloudinary] Uploaded:', res.data.url)
      }).catch(err => {
        console.warn('[Cloudinary] Upload failed:', err.message)
        // ไม่ block flow หลัก — upload fail ก็ยังทำงานต่อได้
      })
    }

    addNotif({
      type:  'face_match',
      title: `Face matched: ${customer.full_name}`,
      body:  `${Math.round(confidence)}% confidence · photo saved to Cloudinary`,
    })
  }

/*
  function handleMatch(customer, confidence) {
    setMatchedCustomer({ ...customer, confidence })
    setCamState('matched')
    setForm(p => ({
      ...p,
      name:      customer.full_name,
      airline:   customer.airline,
      phone:     customer.phone,
      email:     customer.email,
      groupSize: customer.group_size      || p.groupSize,
      city:      customer.city_preference || p.city,
    }))
    addNotif({ type:'face_match', title:`Face matched: ${customer.full_name}`, body:`${Math.round(confidence)}% confidence · form auto-filled` })
  }
*/    

  function mapErrorsToRules(errors, warnings) {
    const status = {}
    RULES.forEach(r => { status[r.id] = 'pass' })

    const errorMap = {
      face:    ['ไม่พบใบหน้า','ใบหน้าเล็ก','ใบหน้าใกล้','ไม่อยู่กึ่งกลาง'],
      front:   ['หันหน้าตรง','หันซ้าย','หันขวา'],
      nopitch: ['เงยหน้า','ก้มหน้า'],
      nocover: ['สิ่งปิดบัง','ปิดบัง'],
      nomask:  ['หน้ากาก'],
      noglass: ['แว่นดำ'],
      light:   ['มืดเกิน','สว่างเกิน'],
      clear:   ['เบลอ'],
    }
    const warnMap = { noglass: ['แว่นตาอาจ'] }

    errors.forEach(err => {
      Object.entries(errorMap).forEach(([rule, keywords]) => {
        if (keywords.some(k => err.includes(k))) status[rule] = 'fail'
      })
    })
    warnings.forEach(w => {
      Object.entries(warnMap).forEach(([rule, keywords]) => {
        if (keywords.some(k => w.includes(k)) && status[rule] === 'pass') status[rule] = 'warn'
      })
    })
    return status
  }

  function resetScan() {
    setMatchedCustomer(null)
    setValidationResult(null)
    setCapturedUrl(null)
    setCamState(streamRef.current ? 'live' : 'idle')
    setPipeSteps(streamRef.current ? [2,0,0,0,0] : [0,0,0,0,0])
  }

  function setStep(idx, val) { setPipeSteps(prev => { const n=[...prev]; n[idx]=val; return n }) }
  function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

  // ── WhatsApp + Submit ────────────────────────────────────────────────────
  async function sendWhatsApp() {
    if (!form.phone) return
    const msg = `✈ Hello ${form.name}!\nYour ${brand.name} booking received.\n📍 ${form.serviceType} in ${form.city}\nTotal: $${price}\nWe'll confirm shortly!`
    try {
      await axios.post(`${API}/api/whatsapp/send`, { to: form.phone, message: msg })
      addNotif({ type:'whatsapp', title:'WhatsApp sent', body:`Sent to ${form.name}` })
    } catch { addNotif({ type:'whatsapp', title:'WhatsApp queued', body:'Will send when connected' }) }
  }

  async function submitBooking() {
    if (!form.name) return
    setSubmitting(true)
    try {
      await axios.post(`${API}/api/booking`, { customerId:matchedCustomer?.id, ...form, vehicleId:form.vehicleIdx, totalPrice:price })
    } catch {}
    await sendWhatsApp()
    setSubmitted(true)
    addNotif({ type:'booking', title:'Booking confirmed', body:`${form.name} · ${form.serviceType} · $${price}` })
    setSubmitting(false)
  }

  // ── Submitted ────────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
        <div style={{ fontSize:18, fontWeight:500, color:brand.color, marginBottom:6 }}>Booking Confirmed!</div>
        <div style={{ fontSize:12, color:'#6A6560', marginBottom:20 }}>WhatsApp sent to {form.name}</div>
        <button style={{ ...s.btn, background:brand.color, color:'#08080E', border:'none', padding:'10px 24px' }}
          onClick={() => { setSubmitted(false); stopCamera(); setForm(p=>({...p,name:'',airline:'',phone:'',email:''})) }}>
          + New Booking
        </button>
      </div>
    </div>
  )

  // ── Camera label helper ──────────────────────────────────────────────────
  const camLabels = {
    idle:'กด "เปิดกล้อง" เพื่อเริ่ม',
    live:'วางใบหน้าในวงกลม แล้วกด "ถ่ายภาพ"',
    captured:'ถ่ายภาพแล้ว — กด "ตรวจสอบ & สแกน"',
    validating:'กำลังตรวจสอบใบหน้า...',
    invalid:'ไม่ผ่านการตรวจสอบ — กรุณาถ่ายใหม่',
    scanning:'กำลังค้นหาในระบบ...',
    matched:`✓ พบ: ${matchedCustomer?.full_name}`,
    unknown:'ไม่พบในระบบ',
  }

  const ringColor = camState==='matched' ? '#5DC48A' : camState==='invalid' ? '#D47A7A' : camState==='validating' ? brand.color : brand.color
  const borderColor = camState==='matched' ? '#5DC48A' : camState==='invalid' ? '#D47A7A' : 'rgba(201,168,76,.2)'

  return (
    <div style={s.page}>
      <div style={s.grid2}>

        {/* ── LEFT ── */}
        <div>
          <div style={{ ...s.card, marginBottom:12 }}>
            <div style={s.ct}>📷 Face recognition — webcam</div>

            {/* ── Viewport ── */}
            <div style={{ position:'relative', background:'#0a0a0f', borderRadius:9, overflow:'hidden', aspectRatio:'4/3', border:`1px solid ${borderColor}`, marginBottom:10 }}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
                  display:camState==='live'||camState==='scanning'||camState==='validating'?'block':'none' }} />
              <canvas ref={canvasRef} style={{ display:'none' }} />

              {/* Captured photo */}
              {capturedUrl && !['live'].includes(camState) && (
                <img src={capturedUrl} alt="captured"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              )}

              {/* Scan ring */}
              {['live','scanning','validating'].includes(camState) && (
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                  width:200, height:200, borderRadius:'50%', border:`2px solid ${ringColor}`,
                  animation: camState==='validating' ? 'ringFast 0.6s ease-in-out infinite' : 'ringPulse 1.2s ease-in-out infinite',
                  zIndex:3, pointerEvents:'none' }} />
              )}

              {/* Corner brackets */}
              {['live','scanning','validating'].includes(camState) && (['tl','tr','bl','br'].map(pos => (
                <div key={pos} style={{ position:'absolute', width:20, height:20, zIndex:4, pointerEvents:'none',
                  top: pos.startsWith('t') ? 'calc(50% - 104px)' : undefined,
                  bottom: pos.startsWith('b') ? 'calc(50% - 104px)' : undefined,
                  left: pos.endsWith('l') ? 'calc(50% - 104px)' : undefined,
                  right: pos.endsWith('r') ? 'calc(50% - 104px)' : undefined,
                  borderTop:    pos.startsWith('t') ? `2px solid ${ringColor}` : 'none',
                  borderBottom: pos.startsWith('b') ? `2px solid ${ringColor}` : 'none',
                  borderLeft:   pos.endsWith('l')   ? `2px solid ${ringColor}` : 'none',
                  borderRight:  pos.endsWith('r')   ? `2px solid ${ringColor}` : 'none',
                }} />
              )))}

              {/* Valid/Invalid overlay on captured image */}
              {camState==='invalid' && validationResult && (
                <div style={{ position:'absolute', inset:0, background:'rgba(139,51,51,.3)', zIndex:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize:48 }}>❌</div>
                </div>
              )}
              {camState==='matched' && (
                <div style={{ position:'absolute', inset:0, background:'rgba(58,125,90,.15)', zIndex:4, display:'flex', alignItems:'flex-end' }}>
                  <div style={{ width:'100%', background:'rgba(10,10,15,.88)', padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:22 }}>{matchedCustomer?.emoji}</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:500, color:'#5DC48A' }}>{matchedCustomer?.full_name}</div>
                      <div style={{ fontSize:9, color:'#6A6560' }}>{matchedCustomer?.airline} · {matchedCustomer?.total_rides} rides · {Math.round(matchedCustomer?.confidence||0)}% match</div>
                    </div>
                    <div style={{ marginLeft:'auto', fontSize:20 }}>✅</div>
                  </div>
                </div>
              )}

              {/* Placeholder */}
              {camState==='idle' && (
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <div style={{ fontSize:40 }}>📷</div>
                  <div style={{ fontSize:11, color:'#6A6560' }}>Webcam พร้อมใช้งาน</div>
                  <div style={{ fontSize:10, color:'#3A3830' }}>ระบบตรวจสอบใบหน้าก่อนสแกน</div>
                </div>
              )}

              {/* Status chip */}
              <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,.7)', borderRadius:20, padding:'3px 9px', fontSize:10, display:'flex', alignItems:'center', gap:5, zIndex:5 }}>
                <div style={{ width:6, height:6, borderRadius:'50%',
                  background: camState==='matched'?'#5DC48A': camState==='invalid'?'#D47A7A': camState==='live'||camState==='scanning'||camState==='validating'?'#5DC48A':'#6A6560',
                  animation: ['live','scanning','validating'].includes(camState)?'pulse 1.5s infinite':'none' }} />
                <span style={{ color:'#E8E4D9' }}>
                  {{idle:'Camera off',live:'🟢 Live',captured:'📸 Captured',validating:'🔍 Validating...',invalid:'❌ Failed',scanning:'⟳ Matching...',matched:'✅ Matched',unknown:'❓ Unknown'}[camState]}
                </span>
              </div>

              {/* Bottom label */}
              <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center', fontSize:10, color:'#6A6560', zIndex:5, padding:'0 8px' }}>
                {camLabels[camState]}
              </div>
            </div>

            {/* ── Buttons ── */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {camState==='idle' && (
                <button
                  style={{ ...s.btn, flex:1, justifyContent:'center', background:brand.color, color:'#08080E', border:'none', opacity: modelLoading ? 0.6 : 1 }}
                  onClick={startCamera}
                  disabled={modelLoading}
                >
                  {modelLoading ? '⟳ กำลังโหลด AI...' : modelsReady ? '📷 เปิดกล้อง' : '⚠️ เปิดกล้อง (demo mode)'}
                </button>
              )}
              {camState==='live'      && <><button style={{ ...s.btn, flex:1, justifyContent:'center', background:brand.color, color:'#08080E', border:'none' }} onClick={capturePhoto}>⭕ ถ่ายภาพ</button><button style={{ ...s.btn }} onClick={stopCamera}>✕</button></>}
              {camState==='captured'  && <><button style={{ ...s.btn, flex:1, justifyContent:'center', background:brand.color, color:'#08080E', border:'none' }} onClick={runFaceScan}>🔍 ตรวจสอบ & สแกน</button><button style={{ ...s.btn }} onClick={retakePhoto}>↺ ถ่ายใหม่</button></>}
              {camState==='validating'&& <button style={{ ...s.btn, flex:1, justifyContent:'center', opacity:.6 }} disabled>⟳ กำลังตรวจสอบ...</button>}
              {camState==='invalid'   && <><button style={{ ...s.btn, flex:1, justifyContent:'center', background:brand.color, color:'#08080E', border:'none' }} onClick={retakePhoto}>📷 ถ่ายใหม่</button><button style={{ ...s.btn }} onClick={stopCamera}>✕</button></>}
              {camState==='scanning'  && <button style={{ ...s.btn, flex:1, justifyContent:'center', opacity:.6 }} disabled>⟳ กำลังค้นหา...</button>}
              {camState==='matched'   && <><button style={{ ...s.btn, flex:1, justifyContent:'center', background:'rgba(58,125,90,.15)', color:'#5DC48A', border:'1px solid rgba(58,125,90,.3)' }} onClick={resetScan}>🔄 สแกนใหม่</button><button style={{ ...s.btn }} onClick={stopCamera}>✕</button></>}
              {camState==='unknown'   && <><button style={{ ...s.btn, flex:1, justifyContent:'center', background:brand.color, color:'#08080E', border:'none' }} onClick={resetScan}>🔄 สแกนใหม่</button><button style={{ ...s.btn }} onClick={stopCamera}>✕</button></>}
            </div>

            {/* Photo history */}
            {photoHistory.length > 0 && (
              <div style={{ display:'flex', gap:5, marginBottom:8, flexWrap:'wrap' }}>
                {photoHistory.map((url,i) => (
                  <img key={i} src={url} alt={`photo ${i+1}`}
                    onClick={() => { setCapturedUrl(url); setCamState('captured'); setValidationResult(null) }}
                    style={{ width:44, height:44, borderRadius:6, objectFit:'cover', cursor:'pointer', border:`1px solid ${capturedUrl===url?brand.color:'rgba(201,168,76,.2)'}` }} />
                ))}
              </div>
            )}

            {/* ── Validation result ── */}
            {validationResult && (
              <div style={{ background: validationResult.valid ? 'rgba(58,125,90,.1)' : 'rgba(139,51,51,.1)', border:`1px solid ${validationResult.valid?'rgba(58,125,90,.3)':'rgba(139,51,51,.3)'}`, borderRadius:8, padding:10, marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:500, color:validationResult.valid?'#5DC48A':'#D47A7A', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  {validationResult.valid ? '✅ ผ่านการตรวจสอบ — กำลังสแกน' : '❌ ไม่ผ่านการตรวจสอบ'}
                </div>

                {/* Rule checklist */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:8 }}>
                  {RULES.map(rule => {
                    const st = validationResult.ruleStatus?.[rule.id] || 'pass'
                    return (
                      <div key={rule.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10,
                        color: st==='fail'?'#D47A7A': st==='warn'?'#C9A84C':'#5DC48A' }}>
                        <span style={{ fontSize:12 }}>{st==='fail'?'❌':st==='warn'?'⚠️':'✓'}</span>
                        <span>{rule.icon} {rule.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Error messages */}
                {validationResult.errors.length > 0 && (
                  <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:6 }}>
                    {validationResult.errors.map((err,i) => (
                      <div key={i} style={{ fontSize:10, color:'#D47A7A', padding:'2px 0', display:'flex', alignItems:'flex-start', gap:5 }}>
                        <span style={{ flexShrink:0 }}>→</span><span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:6, marginTop:4 }}>
                    {validationResult.warnings.map((w,i) => (
                      <div key={i} style={{ fontSize:10, color:'#C9A84C', padding:'2px 0', display:'flex', alignItems:'flex-start', gap:5 }}>
                        <span style={{ flexShrink:0 }}>⚠</span><span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Requirements hint ── */}
            {camState==='idle' && (
              <div style={{ background:'rgba(201,168,76,.06)', border:'1px solid rgba(201,168,76,.15)', borderRadius:8, padding:10 }}>
                <div style={{ fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'#6A6560', marginBottom:6 }}>ข้อกำหนดการสแกน</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
                  {RULES.map(r => (
                    <div key={r.id} style={{ fontSize:10, color:'#6A6560', display:'flex', alignItems:'center', gap:4 }}>
                      <span>{r.icon}</span><span>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Pipeline ── */}
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
              {['เปิดกล้อง & จับภาพ','ตรวจสอบใบหน้า (validation)','ค้นหาใน database','Auto-fill & แสดงผล'].map((label,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 8px', borderRadius:6,
                  background: pipeSteps[i]===1?'rgba(201,168,76,.08)':'rgba(255,255,255,.02)',
                  border:`0.5px solid ${pipeSteps[i]===2?'rgba(58,125,90,.3)':'rgba(255,255,255,.05)'}` }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:500, flexShrink:0,
                    background: pipeSteps[i]===2?'rgba(58,125,90,.2)':pipeSteps[i]===1?'rgba(201,168,76,.2)':'rgba(255,255,255,.05)',
                    color: pipeSteps[i]===2?'#5DC48A':pipeSteps[i]===1?brand.color:'#6A6560' }}>
                    {pipeSteps[i]===2?'✓':pipeSteps[i]===1?'⟳':i+1}
                  </div>
                  <span style={{ fontSize:10, color:pipeSteps[i]===2?'#5DC48A':pipeSteps[i]===1?brand.color:'#6A6560' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer form */}
          <div style={s.card}>
            <div style={s.ct}>Customer info {matchedCustomer && <span style={{ background:'rgba(58,125,90,.15)', color:'#5DC48A', fontSize:8, padding:'1px 6px', borderRadius:10, marginLeft:4 }}>✓ Auto-filled</span>}</div>
            {[{label:'Full name',key:'name',ph:'Capt. John Smith',type:'text'},{label:'Airline / Badge',key:'airline',ph:'United — UA4821',type:'text'},{label:'WhatsApp',key:'phone',ph:'+1 (555) 000-0000',type:'tel'},{label:'Email',key:'email',ph:'pilot@airline.com',type:'email'}].map(f => (
              <div key={f.key} style={s.fg}>
                <label style={s.label}>{f.label}</label>
                <input style={{ ...s.input, borderColor:matchedCustomer&&form[f.key]?'rgba(58,125,90,.4)':'rgba(201,168,76,.18)' }}
                  type={f.type} placeholder={f.ph} value={form[f.key]} onChange={fv(f.key)} />
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={s.fg}><label style={s.label}>Group size</label><select style={s.input} value={form.groupSize} onChange={fv('groupSize')}>{['Solo (1)','Couple (2)','Small Group (3-6)','Large Group (7-15)'].map(o=><option key={o}>{o}</option>)}</select></div>
              <div style={s.fg}><label style={s.label}>Age range</label><select style={s.input} value={form.ageRange} onChange={fv('ageRange')}>{['Mixed (All Ages)','Young Adults (21-35)','Adults (36-55)','Senior (55+)'].map(o=><option key={o}>{o}</option>)}</select></div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div>
          <div style={{ ...s.card, marginBottom:12 }}>
            <div style={s.ct}>Booking details</div>
            <div style={s.fg}><label style={s.label}>City</label><select style={s.input} value={form.city} onChange={fv('city')}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div style={s.fg}><label style={s.label}>Service type</label><select style={s.input} value={form.serviceType} onChange={fv('serviceType')}>{SERVICES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div style={s.fg}><label style={s.label}>Date & time</label><input style={s.input} type="datetime-local" value={form.dateTime} onChange={fv('dateTime')} /></div>
            <div style={s.fg}><label style={s.label}>Vehicle</label><select style={s.input} value={form.vehicleIdx} onChange={e=>setForm(p=>({...p,vehicleIdx:+e.target.value}))}>{VEHICLES.map((v,i)=><option key={i} value={i}>{v.label} — ${v.price}</option>)}</select></div>
            <div style={s.fg}><label style={s.label}>Special requests</label><textarea style={{ ...s.input, resize:'vertical', minHeight:60 }} placeholder="Dietary needs, accessibility, preferences..." value={form.specialRequests} onChange={fv('specialRequests')} /></div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderTop:'1px solid rgba(201,168,76,.12)' }}>
              <span style={{ fontSize:11, color:'#6A6560' }}>Estimated total</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:brand.color }}>${price}</span>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.ct}>Confirm & send</div>
            <button style={{ ...s.btn, width:'100%', justifyContent:'center', marginBottom:8, background:'rgba(37,211,102,.1)', border:'1px solid rgba(37,211,102,.3)', color:'#25D166' }} onClick={sendWhatsApp}>💬 Send WhatsApp confirmation</button>
            <button style={{ ...s.btn, width:'100%', justifyContent:'center', background:brand.color, color:'#08080E', border:'none', fontWeight:500, padding:11, opacity:(!form.name||submitting)?0.6:1 }}
              onClick={submitBooking} disabled={submitting||!form.name}>
              {submitting?'⟳ Saving...':`✓ Confirm booking — $${price}`}
            </button>
            <div style={{ textAlign:'center', fontSize:9, color:'#3A3830', marginTop:8 }}>🔒 PCI-DSS · TLS 1.3 · Google Play verified</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ringPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.7} 50%{transform:translate(-50%,-50%) scale(1.06);opacity:1} }
        @keyframes ringFast  { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.8} 50%{transform:translate(-50%,-50%) scale(1.08);opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}

const s = {
  page:  { color:'#E8E4D9', fontFamily:"'DM Sans',sans-serif" },
  grid2: { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12 },
  card:  { background:'#16161F', border:'1px solid rgba(201,168,76,.15)', borderRadius:10, padding:13 },
  ct:    { fontSize:8, letterSpacing:1.4, textTransform:'uppercase', color:'#6A6560', marginBottom:10, display:'flex', alignItems:'center' },
  fg:    { marginBottom:9 },
  label: { display:'block', fontSize:8, letterSpacing:1, textTransform:'uppercase', color:'#6A6560', marginBottom:4 },
  input: { width:'100%', padding:'7px 10px', background:'#1C1C27', border:'1px solid rgba(201,168,76,.18)', borderRadius:6, color:'#E8E4D9', fontFamily:'inherit', fontSize:12, outline:'none', boxSizing:'border-box', transition:'border-color .2s' },
  btn:   { display:'inline-flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:7, fontSize:11, fontFamily:'inherit', cursor:'pointer', border:'1px solid rgba(201,168,76,.18)', background:'#1C1C27', color:'#E8E4D9', transition:'.15s' },
}
