FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package.json .
RUN npm install
COPY server/ .

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src/ ./src/
COPY index.html vite.config.js ./
RUN npm run build

FROM node:20-alpine AS runtime
RUN addgroup -S limoflight && adduser -S limoflight -G limoflight
WORKDIR /app
COPY --from=frontend-builder /app/dist ./public/
COPY --from=backend-builder /app/server ./server/
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
RUN chown -R limoflight:limoflight /app
USER limoflight
WORKDIR /app/server
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
CMD ["node", "api.js"]