// LimoFlight V4 — src/api/faceValidation.js (strict version)
import * as faceapi from '@vladmandic/face-api'

let modelsLoaded = false
let loadingPromise = null

export async function loadFaceModels() {
  if (modelsLoaded) return true
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      const MODEL_URL = '/limoflight/models'
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ])
      modelsLoaded = true
      console.log('[FaceAI] Models loaded ✓')
      return true
    } catch (err) {
      console.error('[FaceAI] Model load failed:', err)
      modelsLoaded = false
      loadingPromise = null
      return false
    }
  })()
  return loadingPromise
}

export function areModelsLoaded() { return modelsLoaded }

export async function validateFace(canvas) {
  if (!modelsLoaded) {
    return { valid: false, errors: ['ระบบ AI ยังไม่พร้อม กรุณารอสักครู่'], warnings: [], ruleStatus: makeRules('fail') }
  }

  const errors = []
  const warnings = []
  const { width, height } = canvas

  // Detect face + landmarks
  const detection = await faceapi
    .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.55 }))
    .withFaceLandmarks()

  // RULE 1: ต้องพบใบหน้า
  if (!detection) {
    errors.push('ไม่พบใบหน้า กรุณาวางใบหน้าให้อยู่ในวงกลม')
    return buildResult(errors, warnings)
  }

  const { landmarks, detection: det } = detection
  const box = det.box
  const pts = landmarks.positions

  // RULE 2: ขนาดใบหน้า
  const faceArea = (box.width * box.height) / (width * height)
  if (faceArea < 0.04) errors.push('ใบหน้าเล็กเกินไป กรุณาเข้าใกล้กล้องมากขึ้น')
  if (faceArea > 0.80) errors.push('ใกล้กล้องเกินไป กรุณาถอยออกเล็กน้อย')

  // RULE 3: กึ่งกลาง
  if (Math.abs((box.x + box.width/2)  - width/2)  / width  > 0.35) errors.push('ใบหน้าไม่อยู่กึ่งกลาง กรุณาจัดให้อยู่ตรงวงกลม')
  if (Math.abs((box.y + box.height/2) - height/2) / height > 0.38) errors.push('ใบหน้าไม่อยู่กึ่งกลาง กรุณาจัดให้อยู่ตรงวงกลม')

  const leftEye  = landmarks.getLeftEye()
  const rightEye = landmarks.getRightEye()
  const mouth    = landmarks.getMouth()
  const lex = avg(leftEye.map(p=>p.x));  const ley = avg(leftEye.map(p=>p.y))
  const rex = avg(rightEye.map(p=>p.x)); const rey = avg(rightEye.map(p=>p.y))
  const noseTip = pts[30]

  // RULE 4: Yaw (หันซ้าย/ขวา)
  const yawRatio = Math.abs(noseTip.x - (lex+rex)/2) / box.width
  if (yawRatio > 0.20) errors.push('กรุณาหันหน้าตรงเข้าหากล้อง อย่าหันซ้ายหรือขวา')

  // RULE 5: Roll (เอียงหัว)
  if (Math.abs(ley - rey) / (rex - lex + 0.001) > 0.25) errors.push('กรุณาอย่าเอียงหัว ให้ตั้งตรง')

  // RULE 6: Pitch (เงย/ก้ม)
  const nosePosY = (noseTip.y - box.y) / box.height
  if (nosePosY < 0.30) errors.push('กรุณาอย่าเงยหน้า ให้มองตรงเข้ากล้อง')
  if (nosePosY > 0.74) errors.push('กรุณาอย่าก้มหน้า ให้มองตรงเข้ากล้อง')

  // RULE 7: Hidden landmarks (มือปิดหน้า)
  const hidden = pts.filter(p =>
    p.x < box.x - 5 || p.x > box.x + box.width + 5 ||
    p.y < box.y - 5 || p.y > box.y + box.height + 5
  ).length
  if (hidden > 10) errors.push('ตรวจพบสิ่งบดบังใบหน้า กรุณาเอามือออกจากหน้า')

  // RULE 8: Occlusion ดวงตา (มือปิดตา)
  const ctx = canvas.getContext('2d')
  const imgData = ctx.getImageData(0, 0, width, height)

  const leftOcc  = occlusionScore(imgData, width, lex, ley, box)
  const rightOcc = occlusionScore(imgData, width, rex, rey, box)
  if (leftOcc > 0.75 || rightOcc > 0.75) {
    errors.push('มีสิ่งปิดบังบริเวณดวงตา กรุณาเอามือหรือวัตถุออก')
  }

  // RULE 9: หน้ากาก (nose-mouth distance)
  const mouthCY = avg(mouth.map(p=>p.y))
  if (Math.abs(mouthCY - noseTip.y) < box.height * 0.07) {
    errors.push('ตรวจพบหน้ากาก กรุณาถอดออกก่อนสแกน')
  }

  // RULE 10: แว่นดำ (eye region brightness)
  const lb = regionBrightness(imgData, width, lex, ley, box)
  const rb = regionBrightness(imgData, width, rex, rey, box)
  if ((lb+rb)/2 < 32) errors.push('ตรวจพบแว่นดำ กรุณาถอดออกก่อนสแกน')
  else if ((lb+rb)/2 < 58) warnings.push('แว่นตาอาจลดความแม่นยำ แนะนำให้ถอดก่อนสแกน')

  // RULE 11: Image quality
  const q = imageQuality(imgData, width, height)
  if (q.brightness < 38)  errors.push('ภาพมืดเกินไป กรุณาหาที่สว่างกว่านี้')
  if (q.brightness > 228) errors.push('แสงสว่างเกินไป กรุณาหลีกเลี่ยงแสงจ้า')
  if (q.sharpness  < 6)   errors.push('ภาพเบลอ กรุณาอยู่นิ่งๆ แล้วถ่ายใหม่')

  return buildResult(errors, warnings)
}

// ── ตรวจ occlusion: คืน 0-1 (ยิ่งสูง = ยิ่งถูกปิดบัง) ────────────────────
function occlusionScore(imgData, w, cx, cy, box) {
  const data = imgData.data
  const rw   = box.width  * 0.16
  const rh   = box.height * 0.10
  const x0   = Math.max(0, Math.round(cx - rw))
  const x1   = Math.min(w-1, Math.round(cx + rw))
  const y0   = Math.max(0, Math.round(cy - rh))
  const y1   = Math.min(imgData.height-1, Math.round(cy + rh))

  const brights = []
  for (let y = y0; y <= y1; y += 2) {
    for (let x = x0; x <= x1; x += 2) {
      const i = (y*w+x)*4
      brights.push(data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114)
    }
  }
  if (!brights.length) return 0

  const m    = avg(brights)
  const s    = stdDev(brights, m)
  // Low variance + extreme brightness = occlusion (hand or mask)
  const varScore  = 1 - Math.min(s / 40, 1)   // low variance → high score
  const brightScore = (m < 60 || m > 210) ? 0.5 : 0  // very dark or very bright
  return Math.min(varScore + brightScore, 1)
}

function regionBrightness(imgData, w, cx, cy, box) {
  const data = imgData.data
  const rw   = box.width  * 0.12
  const rh   = box.height * 0.08
  const x0 = Math.max(0, Math.round(cx-rw)); const x1 = Math.min(w-1, Math.round(cx+rw))
  const y0 = Math.max(0, Math.round(cy-rh)); const y1 = Math.min(imgData.height-1, Math.round(cy+rh))
  const vals = []
  for (let y = y0; y <= y1; y += 2)
    for (let x = x0; x <= x1; x += 2) {
      const i = (y*w+x)*4
      vals.push(data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114)
    }
  return vals.length ? avg(vals) : 128
}

function imageQuality(imgData, w, h) {
  const data = imgData.data
  let bSum = 0, lapSum = 0, lapCount = 0
  for (let i = 0; i < data.length; i += 4)
    bSum += data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114
  for (let y = 1; y < h-1; y += 2)
    for (let x = 1; x < w-1; x += 2) {
      const c=gray(data,w,x,y), n=gray(data,w,x,y-1), s=gray(data,w,x,y+1), l=gray(data,w,x-1,y), r=gray(data,w,x+1,y)
      lapSum += Math.abs(-4*c+n+s+l+r); lapCount++
    }
  return { brightness: bSum/(w*h), sharpness: lapCount ? lapSum/lapCount : 0 }
}

function gray(data,w,x,y){const i=(y*w+x)*4; return data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114}
function avg(arr){return arr.length?arr.reduce((s,v)=>s+v,0)/arr.length:0}
function stdDev(arr,m){return Math.sqrt(avg(arr.map(v=>(v-m)**2)))}
function makeRules(state){
  return Object.fromEntries(['face','front','nopitch','noroll','nocover','nomask','noglass','light','clear'].map(k=>[k,state]))
}
function buildResult(errors,warnings){
  return { valid:errors.length===0, errors, warnings, ruleStatus:mapToRules(errors,warnings) }
}
function mapToRules(errors,warnings){
  const s=makeRules('pass')
  const map={face:['ไม่พบ','เล็กเก','ใกล้ก','กึ่งก'],front:['หันหน้า','หันซ้าย','หันขวา'],nopitch:['เงยหน้า','ก้มหน้า'],noroll:['เอียงหัว'],nocover:['บดบัง','ปิดบัง','ดวงตา'],nomask:['หน้ากาก'],noglass:['แว่นดำ'],light:['มืดเก','สว่างเก'],clear:['เบลอ']}
  errors.forEach(err=>Object.entries(map).forEach(([rule,keys])=>{if(keys.some(k=>err.includes(k)))s[rule]='fail'}))
  warnings.forEach(w=>{if(w.includes('แว่น'))s.noglass=s.noglass==='pass'?'warn':s.noglass})
  return s
}
