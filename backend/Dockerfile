# Production Dockerfile
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3001

CMD ["node", "src/server.js"]