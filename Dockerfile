# Multi-stage Docker build for StockFlow Production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies
RUN npm run install:all

# Copy source files
COPY server/ server/
COPY client/ client/

# Generate Prisma Client & Build TypeScript + Vite
RUN npm --prefix server run prisma:generate
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV DATABASE_URL="file:/data/stockflow.db"

# Create persistent data directory
RUN mkdir -p /data && chown -R node:node /data

# Copy production dependencies and built assets
COPY package.json ./
COPY server/package.json server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

# Expose server port
EXPOSE 5001

USER node

# Run prisma migration and start production server
CMD ["sh", "-c", "npx --prefix server prisma migrate deploy && node server/dist/index.js"]
