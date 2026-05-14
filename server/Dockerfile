FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY package.json ./
RUN npm install
COPY . ./

FROM node:20-alpine AS runtime
RUN addgroup -S limoflight && adduser -S limoflight -G limoflight
WORKDIR /app/server
COPY --from=backend-builder /app/server ./
RUN chown -R limoflight:limoflight /app
USER limoflight
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
CMD ["node", "api.js"]
