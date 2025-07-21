# Multi-stage build for optimal production image
FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy package files (adjusted for backend root directory)
COPY package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage  
FROM base AS build

# Copy source code (from backend root)
COPY src ./src
COPY tsconfig.json biome.json ./

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies and built application
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/package.json ./package.json

# Switch to non-root user
USER backend

# Expose port (Railway uses PORT environment variable)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: process.env.PORT || 8080, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "dist/index.js"]