# ============================================================
#  LimoFlight V4 — Dockerfile (multi-stage)
#  Frontend: React + Vite  |  Backend: Node.js + Express
# ============================================================

# ── Stage 1: Build frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Copy source & build
COPY src/       ./src/
COPY public/    ./public/
COPY index.html vite.config.js ./

# Build args → Vite env vars (pass at build time: --build-arg KEY=value)
ARG VITE_API_URL
ARG VITE_GOOGLE_MAPS_KEY
ARG VITE_MAP_ID
ARG VITE_WS_URL
ARG VITE_APP_NAME=LimoFlight

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY
ENV VITE_MAP_ID=$VITE_MAP_ID
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build
# Output: /app/dist

# ── Stage 2: Build backend ────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm ci --frozen-lockfile --omit=dev

COPY server/ ./

# ── Stage 3: Final runtime image ──────────────────────────────────────────
FROM node:20-alpine AS runtime

# Security: run as non-root
RUN addgroup -S limoflight && adduser -S limoflight -G limoflight

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/dist ./public/

# Copy backend + node_modules
COPY --from=backend-builder /app/server ./server/
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# Copy face-api.js TensorFlow models
COPY public/models ./public/models/

# Serve static files from Express
RUN echo "Static files ready"

# Set ownership
RUN chown -R limoflight:limoflight /app
USER limoflight

WORKDIR /app/server

# Expose API + WebSocket port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "api.js"]
