-- ============================================================
--  LimoFlight V4 — PostgreSQL Schema
--  Run: psql -U postgres -d limoflight_db -f schema.sql
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS (admin / dispatch accounts) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'admin', -- admin | dispatch | viewer
  plan          VARCHAR(50)  NOT NULL DEFAULT 'free',  -- free | pro | fleet
  plan_expires_at TIMESTAMPTZ,
  google_play_token TEXT,
  two_fa_secret TEXT,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  brand_config  JSONB DEFAULT '{
    "name":"LimoFlight",
    "tagline":"Pilot Tour Services",
    "logo":"✈",
    "color":"#C9A84C",
    "font":"Playfair Display"
  }',
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CUSTOMERS (pilot profiles) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  airline         VARCHAR(255),
  badge_number    VARCHAR(100),
  phone           VARCHAR(50),   -- WhatsApp number
  email           VARCHAR(255),
  group_size      VARCHAR(50),   -- Solo | Couple | Small | Large
  age_range       VARCHAR(50),   -- Mixed | Young Adults | Adults | Senior
  face_embedding  TEXT,          -- AES-256 encrypted 128-dim vector (JSON)
  face_photo_url  TEXT,          -- encrypted thumbnail (S3 / Cloud Storage)
  city_preference VARCHAR(100),
  special_notes   TEXT,
  tier            VARCHAR(50) DEFAULT 'new', -- new | regular | vip
  total_rides     INT DEFAULT 0,
  total_spent     NUMERIC(10,2) DEFAULT 0,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_airline ON customers(airline);

-- ── VEHICLES (fleet) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_code  VARCHAR(10) NOT NULL,  -- #01, #02 ...
  make          VARCHAR(100),
  model         VARCHAR(100),
  year          INT,
  capacity      INT NOT NULL DEFAULT 6,
  color         VARCHAR(50),
  license_plate VARCHAR(50),
  status        VARCHAR(50) DEFAULT 'standby', -- standby | on-route | dispatched | maintenance
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  heading       NUMERIC(6,2),
  speed         NUMERIC(6,2),
  odometer_miles INT DEFAULT 0,
  next_service_miles INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_status  ON vehicles(status);

-- ── DRIVERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id    UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  license_number VARCHAR(100),
  initials      VARCHAR(5),
  status        VARCHAR(50) DEFAULT 'offline', -- online | offline | on-route
  current_lat   NUMERIC(10,7),
  current_lng   NUMERIC(10,7),
  rating        NUMERIC(3,2) DEFAULT 5.0,
  total_rides   INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  ws_socket_id  VARCHAR(255),  -- Socket.IO session
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id   ON drivers(user_id);
CREATE INDEX idx_drivers_vehicle_id ON drivers(vehicle_id);

-- ── BOOKINGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id       UUID REFERENCES drivers(id) ON DELETE SET NULL,
  city            VARCHAR(100) NOT NULL,
  service_type    VARCHAR(100) NOT NULL, -- City Tour | Airport Transfer | Nightlife | Custom
  pickup_address  TEXT,
  dropoff_address TEXT,
  pickup_lat      NUMERIC(10,7),
  pickup_lng      NUMERIC(10,7),
  date_time       TIMESTAMPTZ NOT NULL,
  duration_hours  NUMERIC(4,1),
  passenger_count INT DEFAULT 1,
  base_price      NUMERIC(10,2) DEFAULT 0,
  extras_price    NUMERIC(10,2) DEFAULT 0,
  total_price     NUMERIC(10,2) DEFAULT 0,
  payment_method  VARCHAR(50),  -- google_play | stripe | paypal
  payment_status  VARCHAR(50) DEFAULT 'pending', -- pending | paid | refunded
  payment_token   TEXT,
  status          VARCHAR(50) DEFAULT 'confirmed', -- confirmed | active | completed | cancelled
  special_requests TEXT,
  wa_sent         BOOLEAN DEFAULT FALSE,
  wa_message_id   TEXT,
  opentable_reservation_id TEXT,
  rating          INT,          -- 1-5
  review_text     TEXT,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user_id     ON bookings(user_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_date_time   ON bookings(date_time);
CREATE INDEX idx_bookings_status      ON bookings(status);

-- ── VENUES (partner restaurants & bars) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opentable_id    VARCHAR(100),
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(100),   -- Restaurant | Bar | Attraction | Show
  city            VARCHAR(100),
  address         TEXT,
  age_restriction VARCHAR(50),    -- All ages | 21+
  cuisine         VARCHAR(100),
  rating          NUMERIC(3,2),
  commission_pct  NUMERIC(5,2) DEFAULT 8.0,
  phone           VARCHAR(50),
  website         VARCHAR(255),
  opentable_url   VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_user_id ON venues(user_id);
CREATE INDEX idx_venues_city    ON venues(city);

-- ── RESERVATIONS (OpenTable linked) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id              UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  venue_id                UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  opentable_confirmation  VARCHAR(255),
  reservation_time        TIMESTAMPTZ NOT NULL,
  party_size              INT NOT NULL,
  first_name              VARCHAR(255),
  last_name               VARCHAR(255),
  phone                   VARCHAR(50),
  email                   VARCHAR(255),
  special_requests        TEXT,
  status                  VARCHAR(50) DEFAULT 'confirmed', -- confirmed | cancelled | no-show
  commission_earned       NUMERIC(10,2) DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL, -- face_match | booking | gps_alert | billing | maintenance
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  icon        VARCHAR(50),
  is_read     BOOLEAN DEFAULT FALSE,
  data        JSONB,   -- arbitrary payload
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON notifications(is_read);

-- ── ANALYTICS EVENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(100) NOT NULL, -- ride_start | ride_end | face_match | payment | wa_sent
  entity_id   UUID,
  entity_type VARCHAR(100),          -- booking | customer | vehicle
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id    ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- ── AUDIT LOG ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id    ON audit_log(user_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan              VARCHAR(50) NOT NULL,
  provider          VARCHAR(50) NOT NULL, -- google_play | stripe | paypal
  provider_sub_id   TEXT,
  purchase_token    TEXT,
  sku               VARCHAR(100),
  status            VARCHAR(50) DEFAULT 'active', -- active | cancelled | expired
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  amount            NUMERIC(10,2),
  currency          VARCHAR(10) DEFAULT 'USD',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- ── CAPCUT REELS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reels (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  title         VARCHAR(255),
  style         VARCHAR(100),
  duration_sec  INT,
  resolution    VARCHAR(20),
  file_url      TEXT,
  thumbnail_url TEXT,
  status        VARCHAR(50) DEFAULT 'generating', -- generating | ready | failed
  views         INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEED: demo admin user (password: LimoFlight2026!) ────────────────────
INSERT INTO users (email, password_hash, full_name, role, plan)
VALUES (
  'admin@limoflight.app',
  crypt('LimoFlight2026!', gen_salt('bf', 12)),
  'John Driver',
  'admin',
  'fleet'
) ON CONFLICT (email) DO NOTHING;

-- ── SEED: sample cities / vehicles ────────────────────────────────────────
-- (Run after inserting a real user_id)
-- INSERT INTO vehicles (user_id, vehicle_code, make, model, capacity, status)
-- VALUES ('<your-user-id>', '#01', 'Lincoln', 'MKT', 8, 'standby');

-- ── Helper: auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'users','customers','vehicles','drivers','bookings','subscriptions'
]) LOOP
  EXECUTE format(
    'CREATE OR REPLACE TRIGGER set_updated_at BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', t);
END LOOP; END $$;

-- Done!
SELECT 'LimoFlight V4 schema installed ✓' AS status;
