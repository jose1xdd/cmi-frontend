# =========================
# Etapa 1: Dependencias
# =========================
FROM oven/bun:1 AS deps

WORKDIR /app

# Copiar package.json y lockfile
COPY package.json bun.lock ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# =========================
# Etapa 2: Build
# =========================
FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir Next.js (usa bun en lugar de npm)
RUN bun run build

# =========================
# Etapa 3: Producción
# =========================
FROM oven/bun:1 AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

RUN chown -R nextjs:nodejs /app
USER nextjs

CMD ["bun", "run", "start", "--port", "3000"]
