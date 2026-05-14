# ✈ LimoFlight V4 — Production Setup Guide

Luxury limousine & pilot tour management platform.
**Google Play exclusive · Fleet Plan · All features unlocked**

---

## 🗂 Project Structure

```
limoflight-v4/
├── src/
│   ├── pages/           # Dashboard, Booking, Tracking, FaceAI, Analytics...
│   ├── components/      # Layout, Sidebar, LiveMap, FaceScanner, VenueGrid...
│   ├── api/
│   │   ├── faceAI.js    # TensorFlow face-api.js — face recognition
│   │   ├── billing.js   # Google Play Billing v6 + Stripe + PayPal
│   │   ├── maps.js      # Google Maps JS API + Routes API + WebSocket
│   │   └── whatsapp.js  # WhatsApp Business Cloud API (Meta)
│   ├── context/         # Auth, Brand, Notification React contexts
│   ├── guards/          # SubscriptionGuard — feature gating
│   └── styles/
│       └── brand.css    # CSS variables for white-label theming
├── server/
│   └── api.js           # Node.js + Express + Socket.IO backend
├── public/
│   └── models/          # face-api.js TensorFlow model files (download separately)
├── .env.example         # Copy to .env and fill in your keys
├── package.json
└── vite.config.js
```

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# → Fill in all API keys (see below)

# 3. Download face-api.js models (TensorFlow)
npx face-api-models --dest public/models

# 4. Set up PostgreSQL database
psql -U postgres -c "CREATE DATABASE limoflight_db"
psql -U postgres limoflight_db < server/schema.sql

# 5. Run frontend + backend
npm run dev          # Frontend on http://localhost:5173
npm run server       # Backend API on http://localhost:3001
```

---

## 🔑 API Keys Required

| Service | Where to get | Used for |
|---|---|---|
| Google Maps JS API | console.cloud.google.com | Live tracking, routes |
| Google Play Developer | play.google.com/console | License verification, billing |
| WhatsApp Business (Meta) | developers.facebook.com | Booking confirmations |
| OpenTable Partner API | opentable.com/partner | Restaurant reservations |
| Stripe | dashboard.stripe.com | Credit card payments |
| PayPal Commerce | developer.paypal.com | PayPal payments |

---

## 📱 Google Play Setup (Anti-clone)

1. Upload signed APK/AAB to Google Play Console
2. Enable **Google Play Licensing** in your app
3. Add `GOOGLE_PLAY_PUBLIC_KEY` from Play Console → Your app → Monetize → Licensing
4. The server verifies every app launch via the Developer API
5. Sideloaded or cloned APKs **cannot pass license verification** and are blocked

---

## 🧠 Face AI Setup

```bash
# Download required TensorFlow models to public/models/
# Required models:
# - ssd_mobilenetv1 (face detection)
# - face_recognition_net (128-dim embeddings)
# - face_landmark_68_net (facial landmarks)

npx face-api-models --dest public/models
# or download manually from: github.com/justadudewhohacks/face-api.js
```

Face vectors are **encrypted** before storage (AES-256).
Matching is done **server-side only** — raw embeddings never leave the server.

---

## 🗺 Google Maps Live Tracking

1. Enable **Maps JavaScript API** + **Routes API** + **Places API** in Google Cloud Console
2. Create a **Map ID** with dark style in Google Maps Platform
3. Set up a WebSocket server (Socket.IO included in `server/api.js`)
4. Driver app sends GPS coordinates every 3 seconds via WebSocket
5. Dashboard receives real-time updates and moves markers

---

## 💳 Subscription Tiers

| Plan | Price | Bookings | Drivers | Features |
|---|---|---|---|---|
| Free | $0 | 5/month | 1 | Basic dashboard |
| Pro | $49/mo | Unlimited | 5 | Face AI, WhatsApp, Venues, Reports |
| Fleet | $149/mo | Unlimited | Unlimited | All + GPS tracking, White-label, CapCut AI |

---

## 🚀 Deployment (Google Cloud Run)

```bash
# Build Docker image
docker build -t limoflight-v4 .

# Deploy to Cloud Run
gcloud run deploy limoflight-api \
  --image limoflight-v4 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# Frontend: deploy to Firebase Hosting or Vercel
npm run build
firebase deploy --only hosting
```

---

## 🔒 Security Checklist

- [x] TLS 1.3 (HTTPS everywhere)
- [x] JWT authentication with rotation
- [x] Rate limiting (100 req/min per IP)
- [x] Helmet.js security headers
- [x] Face vectors encrypted at rest (AES-256)
- [x] Payment tokens only (never store raw card data)
- [x] Google Play anti-clone license verification
- [x] GDPR compliant — 90-day data retention
- [x] CCPA compliant — data deletion on request
- [ ] Enable 2FA for admin accounts (recommended)
- [ ] Set up audit log alerting (recommended)

---

## 📞 Support

Built for: Pilot tour limousine services (USA)
Target: Groups of all ages — airlines crews on layover
Platform: Google Play (Android) exclusive

**LimoFlight V4** — All modules integrated ✈
