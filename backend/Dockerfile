# Stage 1: The "Builder" Stage
# Purpose: Install all dependencies (including dev) and create a full workspace.
# ==================================
FROM node:18-alpine AS builder

# [FINAL FIX] Install build-base for robust native module compilation (like bcrypt)
RUN apk add --no-cache build-base

WORKDIR /usr/src/app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# CRITICAL FIX: Use 'npm install' instead of 'npm ci' to overcome lock file version issues
RUN npm install

# Copy the rest of the source code
COPY . .

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
RUN npm install --omit=dev

# Copy the application code from the 'builder' stage.
# The --chown flag sets the correct permissions for our non-root user.
COPY --from=builder --chown=appuser:appgroup /usr/src/app .

# Switch to the non-root user
USER appuser

# Expose the port the API server will run on
EXPOSE 5000

# The default command to run when the container starts.
CMD ["node", "server.js"]