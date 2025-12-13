# =========================
# Etapa 1: Build
# =========================
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /app

# Copiar package.json y lockfiles
COPY package*.json ./

# Instalar dependencias exactas
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la app de Next.js
RUN npm run build


# =========================
# Etapa 2: Producción
# =========================
FROM node:20.11.1-alpine3.19 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Copiar solo lo necesario (standalone)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Arrancar Next.js standalone
CMD ["node", "server.js"]
