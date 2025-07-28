#backend/Dockerfile
# Stage 1: The "Builder" Stage
# Purpose: Install all dependencies (including dev) and create a full workspace.
# ==================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Use 'npm ci' for faster, more reliable builds in CI environments
RUN npm ci

# Copy the rest of the source code
COPY . .

# (Optional) If you had a build step like TypeScript, it would run here
# RUN npm run build

# ==================================
# Stage 2: The "Production" Stage
# Purpose: Create the final, lean image with only what's needed to run the app.
# ==================================
FROM node:18-alpine

WORKDIR /usr/src/app

# Create a non-root user for security best practices
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the necessary package files from the 'builder' stage
COPY --from=builder /usr/src/app/package.json /usr/src/app/package-lock.json ./

# [CRITICAL FIX] Install ONLY production dependencies.
# This is the key to a small and secure image.
RUN npm install --omit=dev

# Copy the application code from the 'builder' stage.
# The --chown flag sets the correct permissions for our non-root user.
# We copy the whole app directory structure, as it's already prepared.
COPY --from=builder --chown=appuser:appgroup /usr/src/app .

# Switch to the non-root user
USER appuser

# Expose the port the API server will run on
EXPOSE 5000

# The default command to run when the container starts.
CMD ["node", "server.js"]