# ── Build ──────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app
RUN apk add --no-cache curl

# standalone 模式只需要这三个目录
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]
