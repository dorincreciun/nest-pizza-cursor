# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiez doar fișierele necesare pentru install și build
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalare dependențe (inclusiv dev pentru build)
RUN npm ci

# Generare Prisma Client (obligatoriu la orice modificare schema.prisma)
RUN npx prisma generate

# Copiez sursele și construiesc aplicația
COPY . .
RUN npm run build

# ============================================
# Stage 2: Runtime
# ============================================
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copiez doar ce e necesar pentru rulare (fără .env)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Migrații la pornire (prisma migrate deploy – nu șterge date pe server)
# Apoi pornirea aplicației
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
