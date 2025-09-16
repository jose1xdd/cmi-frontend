# =========================
# Etapa 1: Dependencias
# =========================
FROM oven/bun:1 AS deps

WORKDIR /app

# Copiar package.json (y bun.lock si existe)
COPY package.json bun.lock ./

# Instalar dependencias (usando bun)
RUN bun install --frozen-lockfile

# =========================
# Etapa 2: Build
# =========================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir la app Next.js con límites de memoria (1.5 GB máx)
RUN NODE_OPTIONS="--max-old-space-size=1536" bun run build

# =========================
# Etapa 3: Producción
# =========================
FROM oven/bun:1 AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Crear usuario no-root (compatible con Debian/Ubuntu)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nextjs

# Copiar archivos necesarios
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Asignar permisos correctos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Iniciar Next.js en modo producción con Bun
CMD ["bun", "run", "start", "--port", "3000"]
