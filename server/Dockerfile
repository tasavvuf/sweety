FROM node:20-slim

WORKDIR /app

# Install production dependencies using the existing lockfile
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/

# Default environment configuration
ENV NODE_ENV=production \
    PORT=3000

# Expose backend API port
EXPOSE 3000

# Health check using Node built-in fetch against /health
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the API server
CMD ["node", "src/server.js"]
