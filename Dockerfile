# Multi-stage build for full-stack interview prep application
# Author: Aakarsh Sharma

FROM node:20-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci

# Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy full source
COPY . .

# Build client production bundle
RUN cd client && npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/server ./server
COPY --from=builder /app/client ./client
COPY --from=builder /app/package*.json ./

EXPOSE 5000 3000

CMD ["npm", "start"]
