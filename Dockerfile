# TNAP Bot — Cloud Run production image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy everything (includes .env, src, controllers, etc.)
COPY . .

# Cloud Run will set PORT in env
ENV PORT=8080

# Not required but good practice
EXPOSE 8080

# Start app using npm start (defined in package.json)
CMD ["npm", "start"]

