# Stage 1: Build React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using lockfile from sweety subfolder
COPY sweety/package*.json ./
RUN npm ci

# Copy client source and build production bundle
COPY sweety/ ./
RUN npm run build

# Stage 2: Serve production assets via Nginx
FROM nginx:alpine

# Copy built distribution to nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
