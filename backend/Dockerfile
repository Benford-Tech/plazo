# Build from the repository root (product.json lives there):
#   docker build -f backend/Dockerfile -t plazo-backend .
FROM node:22 AS base

RUN apt-get update && apt-get upgrade -y && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 appuser

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./

# Build stage - install all dependencies and build
FROM base AS builder

RUN npm ci && npm cache clean --force

COPY product.json /app/product.json
COPY backend/ ./

RUN npm run build

# Production stage
FROM base AS production

COPY --from=builder /app/product.json /app/product.json
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/backend/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/backend/package.json ./

# Prisma schema + migrations so prisma migrate deploy can run at startup
COPY --from=builder --chown=appuser:appuser /app/backend/src/prisma ./src/prisma

RUN mkdir -p logs && chown -R appuser:appuser /app/backend

ENV NODE_ENV=production
ENV PORT=3005

USER appuser

EXPOSE 3005

# Run pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
