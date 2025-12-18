# TNAP BOT — CLOUD RUN FINAL IMAGE
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production deps
RUN npm ci --omit=dev

# Copy source
COPY . .

# Cloud Run injects PORT
ENV PORT=8080

# Optional, but clear intent
EXPOSE 8080

# 🔥 IMPORTANT: run node directly
CMD ["node", "src/index.js"]

