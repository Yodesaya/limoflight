// LimoFlight V4 — billing.js
// Google Play Billing Library v6 + PayPal + Stripe

// ── Subscription tiers ────────────────────────────────────────────────────
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    bookingsPerMonth: 5,
    drivers: 1,
    features: ['basic_dashboard', 'manual_booking'],
  },
  pro: {
    name: 'Pro',
    price: 49,
    sku: 'pro_monthly',
    bookingsPerMonth: Infinity,
    drivers: 5,
    features: ['basic_dashboard', 'manual_booking', 'face_ai', 'whatsapp', 'partner_venues', 'advanced_reports'],
  },
  fleet: {
    name: 'Fleet',
    price: 149,
    sku: 'fleet_monthly',
    bookingsPerMonth: Infinity,
    drivers: Infinity,
    features: ['all'], // all features unlocked
  },
}

// ── Feature gate — call before rendering locked features ──────────────────
export function isFeatureAllowed(plan, feature) {
  if (PLANS[plan]?.features.includes('all')) return true
  return PLANS[plan]?.features.includes(feature) ?? false
}

// ── Google Play Billing (runs inside Android WebView via JS bridge) ───────
export async function initGooglePlayBilling() {
  if (typeof Android === 'undefined') return null // Not in Android app
  return new Promise(resolve => {
    // Android.startBillingConnection() is injected by the native wrapper
    Android.startBillingConnection()
    window.onBillingReady = () => resolve(true)
    setTimeout(() => resolve(false), 5000) // timeout fallback
  })
}

export async function purchaseSubscription(sku) {
  if (typeof Android !== 'undefined') {
    // Google Play native billing sheet
    Android.launchPurchaseFlow(sku)
    return new Promise(resolve => {
      window.onPurchaseComplete = (token) => resolve({ provider: 'google_play', token })
    })
  }
  // Fallback: web Stripe checkout
  return stripeFallback(sku)
}

// ── Server-side license verification (call from backend) ──────────────────
export async function verifyGooglePlayLicense(purchaseToken, sku) {
  // Uses Google Play Developer API — MUST run server-side
  const { google } = await import('googleapis')
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  })
  const androidPublisher = google.androidpublisher({ version: 'v3', auth })
  const result = await androidPublisher.purchases.subscriptions.get({
    packageName: 'com.limoflight.app',
    subscriptionId: sku,
    token: purchaseToken,
  })
  const sub = result.data
  return {
    valid: sub.paymentState === 1,
    plan: sku.split('_')[0],
    expiresAt: new Date(parseInt(sub.expiryTimeMillis)),
    autoRenewing: sub.autoRenewing,
  }
}

// ── Anti-clone: verify app signature (server-side) ────────────────────────
export async function verifyAppSignature(signedData, signature) {
  const crypto = await import('crypto')
  const publicKey = process.env.GOOGLE_PLAY_PUBLIC_KEY
  const verify = crypto.createVerify('SHA1')
  verify.update(signedData)
  return verify.verify(publicKey, signature, 'base64')
}

// ── Stripe fallback for web users ─────────────────────────────────────────
async function stripeFallback(sku) {
  const { data } = await import('axios').then(m => m.default.post('/api/billing/stripe-session', { sku }))
  window.location.href = data.url // redirect to Stripe checkout
}
