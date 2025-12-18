# FILE: Dockerfile
# TNAP BOT — CLOUD RUN PRODUCTION IMAGE
# ------------------------------------
# ✔ Fast startup
# ✔ Cloud Run compliant
# ✔ No dev dependencies
# ✔ Stable Node process
# ✔ Correct PORT handling

FROM node:18-slim

# -----------------------------------------------------
# System-level best practices
# -----------------------------------------------------
ENV NODE_ENV=production
ENV PORT=8080

# Optional but recommended: avoid zombie processes
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
  && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------
# App directory
# -----------------------------------------------------
WORKDIR /app

# -----------------------------------------------------
# Install dependencies (cached layer)
# -----------------------------------------------------
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# -----------------------------------------------------
# Copy application source
# -----------------------------------------------------
COPY . .

# -----------------------------------------------------
# Cloud Run networking
# -----------------------------------------------------
EXPOSE 8080

# -----------------------------------------------------
# Start app (Cloud Run entrypoint)
# -----------------------------------------------------
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]


