# Tahap 1: Base image untuk dependensi
FROM node:20-alpine AS base
# Install dependencies yang diperlukan untuk alpine (opsional tapi disarankan)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Tahap 2: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./

RUN npm ci
RUN npm install sharp --os=linux --libc=musl --cpu=x64 --no-save

# Tahap 3: Build aplikasi
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nonaktifkan telemetri Next.js saat build
ENV NEXT_TELEMETRY_DISABLED 1

# Build aplikasi
RUN npm run build

# Tahap 4: Production image (Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat user system agar container tidak berjalan sebagai root (keamanan)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file public dan static
COPY --from=builder /app/public ./public

# Set permission agar user nextjs bisa akses cache prerender
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy hasil build standalone (fitur yang kita aktifkan di langkah 1)
# Next.js otomatis menyertakan node_modules yang hanya diperlukan untuk production
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# Gunakan hostname 0.0.0.0 agar bisa diakses dari luar container
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]