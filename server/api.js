// LimoFlight V4 — server/api.js
// Node.js + Express backend — run with: node server/api.js

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import pg from 'pg'

const app = express()
app.set('trust proxy', 1)
const httpServer = createServer(app)
const io = new SocketIO(httpServer, { cors: { origin: process.env.ALLOWED_ORIGINS } })
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// ── Middleware ─────────────────────────────────────────────────────────────
//app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }))
app.use(rateLimit({ windowMs: 60_000, max: 120, message: 'Rate limit exceeded' }))
app.use(express.json({ limit: '10mb' }))

// ── Auth middleware ────────────────────────────────────────────────────────
import jwt from 'jsonwebtoken'
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  // Demo token bypass
  if (token === 'demo-token-2026') {
    req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'admin@limoflight.app', plan: 'fleet', full_name: 'Admin' }
    return next()
  }

  // Real JWT verification
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ── Google Play License middleware ────────────────────────────────────────
async function licenseMiddleware(req, res, next) {
  const { plan } = req.user
  if (plan === 'free' && req.path.includes('/face/')) {
    return res.status(403).json({ error: 'Face AI requires Pro or Fleet plan' })
  }
  next()
}

// ── FACE API ──────────────────────────────────────────────────────────────
app.post('/api/face/match', authMiddleware, licenseMiddleware, async (req, res) => {
  try {
    const { descriptor, threshold = 0.85 } = req.body
    const { rows } = await db.query(
      'SELECT id, name, airline, phone, group_size, city_pref, total_rides, embedding FROM customers WHERE user_id = $1',
      [req.user.id]
    )
    let bestMatch = null, bestScore = 0
    for (const row of rows) {
      const stored = JSON.parse(row.embedding)
      const score = cosineSimilarity(descriptor, stored)
      if (score > bestScore) { bestScore = score; bestMatch = row }
    }
    if (bestScore >= threshold) {
      res.json({ matched: true, customer: bestMatch, confidence: bestScore })
    } else {
      res.json({ matched: false })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/face/register', authMiddleware, async (req, res) => {
  const { descriptor, customer } = req.body
  const { rows } = await db.query(
    `INSERT INTO customers (user_id, name, airline, phone, email, group_size, age_range, embedding, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING id`,
    [req.user.id, customer.name, customer.airline, customer.phone, customer.email,
     customer.groupSize, customer.ageRange, JSON.stringify(descriptor)]
  )
  res.json({ success: true, customerId: rows[0].id })
})

// ── BOOKING API ───────────────────────────────────────────────────────────
app.post('/api/booking', authMiddleware, async (req, res) => {
  const { customerId, city, serviceType, dateTime, vehicleId, specialRequests } = req.body
  const { rows } = await db.query(
    `INSERT INTO bookings (user_id, customer_id, city, service_type, date_time, vehicle_id, special_requests, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed',NOW()) RETURNING id`,
    [req.user.id, customerId, city, serviceType, dateTime, vehicleId, specialRequests]
  )
  // Send WhatsApp confirmation
  await sendWhatsApp(customerId, rows[0].id)
  res.json({ success: true, bookingId: rows[0].id })
})

// ── WHATSAPP API (Meta Cloud API) ─────────────────────────────────────────
app.post('/api/whatsapp/send', authMiddleware, async (req, res) => {
  const { to, message } = req.body
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  )
  const data = await response.json()
  res.json({ success: true, messageId: data.messages?.[0]?.id })
})

async function sendWhatsApp(customerId, bookingId) {
  const { rows } = await db.query('SELECT name, phone FROM customers WHERE id = $1', [customerId])
  const { rows: booking } = await db.query('SELECT service_type, date_time, city FROM bookings WHERE id = $1', [bookingId])
  if (!rows.length) return
  const msg = `✈ Hello ${rows[0].name}! Your LimoFlight booking is confirmed.\n📍 ${booking[0].service_type} in ${booking[0].city}\n🕐 ${new Date(booking[0].date_time).toLocaleString()}\nThank you for choosing us!`
  await fetch(`https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: rows[0].phone.replace(/\D/g, ''), type: 'text', text: { body: msg } }),
  })
}

// ── OPENTABLE API ─────────────────────────────────────────────────────────
app.get('/api/venues', authMiddleware, async (req, res) => {
  const { city, date, partySize, cuisine } = req.query
  const response = await fetch(
    `https://platform.opentable.com/sync/v2/restaurants/availability?` +
    new URLSearchParams({ city, date, party_size: partySize, cuisine, client_id: process.env.OPENTABLE_CLIENT_ID }),
    { headers: { Authorization: `Bearer ${process.env.OPENTABLE_ACCESS_TOKEN}` } }
  )
  const data = await response.json()
  res.json(data)
})

app.post('/api/venues/reserve', authMiddleware, async (req, res) => {
  const { restaurantId, dateTime, partySize, firstName, lastName, email, phone } = req.body
  const response = await fetch('https://platform.opentable.com/sync/v2/reservations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENTABLE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ restaurant_id: restaurantId, date_time: dateTime,
      party_size: partySize, first_name: firstName, last_name: lastName, email, phone }),
  })
  const data = await response.json()
  res.json({ success: true, confirmationId: data.confirmation_id })
})

// ── ANALYTICS AI ──────────────────────────────────────────────────────────
app.get('/api/analytics/insights', authMiddleware, async (req, res) => {
  const { rows } = await db.query(`
    SELECT city, service_type, DATE_TRUNC('week', date_time) as week,
           COUNT(*) as rides, AVG(total_price) as avg_price, SUM(total_price) as revenue
    FROM bookings WHERE user_id = $1 AND date_time > NOW() - INTERVAL '90 days'
    GROUP BY city, service_type, week ORDER BY week DESC`, [req.user.id])

  // Simple AI: find peak times, top routes, revenue trends
  const insights = generateInsights(rows)
  res.json({ insights, rawData: rows })
})

function generateInsights(data) {
  const byCity = data.reduce((acc, r) => { acc[r.city] = (acc[r.city] || 0) + Number(r.revenue); return acc }, {})
  const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0]
  return [
    { type: 'top_market', title: `Top city: ${topCity?.[0] || 'LA'}`, value: topCity?.[1] || 0, recommendation: 'Allocate 2 extra vehicles on weekends' },
    { type: 'forecast', title: 'Next 7 days forecast', value: Math.round((topCity?.[1] || 48000) * 1.08), recommendation: 'Revenue trending +8% — consider surge pricing Friday PM' },
  ]
}

// ── LIVE GPS WebSocket ─────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log('[WS] Driver connected:', socket.id)
  socket.on('location_update', async data => {
    await db.query('UPDATE vehicles SET lat=$1, lng=$2, heading=$3, speed=$4, updated_at=NOW() WHERE id=$5',
      [data.lat, data.lng, data.heading, data.speed, data.vehicleId])
    socket.broadcast.emit('vehicle_moved', data) // broadcast to dashboard
  })
  socket.on('disconnect', () => console.log('[WS] Driver disconnected:', socket.id))
})

// ── BILLING ───────────────────────────────────────────────────────────────
app.post('/api/billing/verify-google-play', authMiddleware, async (req, res) => {
  const { purchaseToken, sku } = req.body
  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    })
    const androidPublisher = google.androidpublisher({ version: 'v3', auth })
    const result = await androidPublisher.purchases.subscriptions.get({
      packageName: 'com.limoflight.app', subscriptionId: sku, token: purchaseToken,
    })
    const plan = sku.split('_')[0]
    await db.query('UPDATE users SET plan=$1, plan_expires_at=$2 WHERE id=$3',
      [plan, new Date(parseInt(result.data.expiryTimeMillis)), req.user.id])
    res.json({ success: true, plan, expiresAt: result.data.expiryTimeMillis })
  } catch (e) {
    res.status(400).json({ error: 'License verification failed: ' + e.message })
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  return dot / (magA * magB)
}

//เพิ่มใหม่
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'v4' })
})

// Auth login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' })
    const user = rows[0]
    const bcrypt = await import('bcrypt')
    const valid = await bcrypt.default.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { id: user.id, email: user.email, plan: user.plan, full_name: user.full_name },
      process.env.JWT_SECRET || 'limoflight-secret',
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, plan: user.plan } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
//ถึงตรงนี้

// ── CLOUDINARY — Upload face photo ────────────────────────────────────────
/*app.post('/api/face/upload', authMiddleware, async (req, res) => {
  try {
    const { imageBase64, customerId } = req.body
    if (!imageBase64) return res.status(400).json({ error: 'No image data' })

    // Upload to Cloudinary
    const cloudinary = await import('cloudinary')
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const uploadResult = await cloudinary.v2.uploader.upload(imageBase64, {
      folder:         'limoflight/faces',
      public_id:      `customer_${customerId || Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      // Security: ไม่ให้เข้าถึงโดยตรงโดยไม่มี signed URL
      type: 'authenticated',
    })

    // Save URL to database
    if (customerId) {
      await db.query(
        'UPDATE customers SET face_photo_url=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
        [uploadResult.secure_url, customerId, req.user.id]
      )
    }

    res.json({
      success:    true,
      url:        uploadResult.secure_url,
      public_id:  uploadResult.public_id,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})*/

// ── CLOUDINARY — Upload face photo ───────────────────────────────────────
app.post('/api/face/upload', authMiddleware, async (req, res) => {
  try {
    const { imageBase64, customerId } = req.body
    if (!imageBase64) return res.status(400).json({ error: 'No image data' })

    const { v2: cloudinary } = await import('cloudinary')
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const result = await cloudinary.uploader.upload(imageBase64, {
      folder:         'limoflight/faces',
      public_id:      `customer_${customerId || Date.now()}`,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    })

    if (customerId) {
      await db.query(
        'UPDATE customers SET face_photo_url=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
        [result.secure_url, customerId, req.user.id]
      )
    }

    res.json({ success: true, url: result.secure_url })
  } catch (e) {
    console.error('[Cloudinary] Upload error:', e.message)
    res.status(500).json({ error: e.message })
  }
})
//------------------

// ── CLOUDINARY — Delete face photo ────────────────────────────────────────
app.delete('/api/face/photo/:customerId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT face_photo_url FROM customers WHERE id=$1 AND user_id=$2',
      [req.params.customerId, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })

    const cloudinary = await import('cloudinary')
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const publicId = `limoflight/faces/customer_${req.params.customerId}`
    await cloudinary.v2.uploader.destroy(publicId, { type: 'authenticated' })
    await db.query(
      'UPDATE customers SET face_photo_url=NULL WHERE id=$1',
      [req.params.customerId]
    )
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
//------------------

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`[LimoFlight API] Running on port ${PORT}`))
