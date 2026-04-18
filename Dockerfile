# ---- Backend Dockerfile ----
# Uses Node.js 18 LTS on Alpine for a small image footprint

FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first (Docker layer caching: only re-run npm install if package.json changed)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application source
COPY . .

# Expose the port Express listens on
EXPOSE 5000

# Health check instruction (Docker-native; also verified by CI/CD pipeline)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start the Express server
CMD ["node", "server.js"]
