# ============================================================================
# DESIGNHUB BACKEND - MULTI-STAGE DOCKERFILE
# ============================================================================
#
# Build stages:
# 1. builder - Install dependencies
# 2. final - Run application (minimal size)
#
# Usage:
# docker build -t designhub-api .
# docker run -p 5000:5000 --env-file .env designhub-api
#
# ============================================================================

# Stage 1: Builder (dependencies)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev for builds if needed)
RUN npm ci --only=production

# Stage 2: Runtime (final image)
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly (PID 1)
RUN apk add --no-cache dumb-init

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run node (handles signals correctly)
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
