# Dockerfile for PQC vs ECDSA IoT Performance Testing
# Emulates resource-constrained edge device (Raspberry Pi Zero W equivalent)

FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Install build tools required for native PQC library compilation
# - build-essential: gcc, g++, make for native modules
# - python3: required by node-gyp for building native addons
# - cmake: needed by liboqs and other cryptographic libraries
# - git: for fetching dependencies if needed
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better layer caching
COPY package*.json ./

# Install Node.js dependencies
# Use --build-from-source flag if PQC libraries need native compilation
RUN npm ci --also=dev || npm install

# Copy application source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Set environment variables for resource-constrained testing
ENV NODE_ENV=production
ENV UV_THREADPOOL_SIZE=4

# Default command - can be overridden in docker-compose
CMD ["node", "benchmarks/benchmark.js"]
