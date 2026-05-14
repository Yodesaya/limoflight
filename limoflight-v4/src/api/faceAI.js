// LimoFlight V4 — faceAI.js
// Uses face-api.js (TensorFlow.js) for 128-dim face embeddings
import * as faceapi from 'face-api.js'
import axios from 'axios'

const MODEL_URL = '/models' // place SSD MobileNet + FaceRecognitionNet here

// ── Load models once at app start ──────────────────────────────────────────
export async function loadModels() {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ])
  console.log('[FaceAI] Models loaded ✓')
}

// ── Capture + match from video element ────────────────────────────────────
export async function scanAndMatch(videoEl, threshold = 0.85) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!detection) return { matched: false, reason: 'no_face_detected' }

  const descriptor = Array.from(detection.descriptor) // Float32Array → plain array

  // Send to backend for secure comparison (never expose DB client-side)
  const { data } = await axios.post('/api/face/match', {
    descriptor,
    threshold,
  })

  return data // { matched, customer, confidence } | { matched: false }
}

// ── Register a new face ───────────────────────────────────────────────────
export async function registerFace(videoEl, customerData) {
  const detection = await faceapi
    .detectSingleFace(videoEl)
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!detection) throw new Error('No face detected — please position clearly')

  const descriptor = Array.from(detection.descriptor)

  const { data } = await axios.post('/api/face/register', {
    descriptor,
    customer: customerData,
  })

  return data
}

// ── Draw detection overlay on canvas ──────────────────────────────────────
export function drawDetectionBox(canvas, videoEl, detection, matchResult) {
  const dims = faceapi.matchDimensions(canvas, videoEl, true)
  const resized = faceapi.resizeResults(detection, dims)

  faceapi.draw.drawDetections(canvas, resized)
  faceapi.draw.drawFaceLandmarks(canvas, resized)

  if (matchResult?.matched) {
    new faceapi.draw.DrawTextField(
      [`${matchResult.customer.name}`, `${Math.round(matchResult.confidence * 100)}% match`],
      resized.detection.box.topLeft
    ).draw(canvas)
  }
}
