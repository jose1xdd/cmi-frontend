# =========================
# Etapa 1: Dependencias
# =========================
FROM node:20.11.1-alpine3.19 AS deps

WORKDIR /app

# Instalar dependencias necesarias (para SWC, sharp, etc.)
RUN apk add --no-cache libc6-compat

# Copiar package.json y lockfiles
COPY package*.json ./

# Instalar dependencias exactas (rápido y reproducible)
RUN npm ci

# =========================
# Etapa 2: Build
# =========================
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /app

# Copiar dependencias desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir la app de Next.js
RUN npm run build

# =========================
# Etapa 3: Producción
# =========================
FROM node:20.11.1-alpine3.19 AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

# Copiar package.json para tener metadata
COPY --from=builder /app/package.json ./package.json

# Copiar dependencias solo de producción
COPY --from=deps /app/node_modules ./node_modules

# Copiar build y assets públicos
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Asignar permisos correctos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Iniciar Next.js en modo producción
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
