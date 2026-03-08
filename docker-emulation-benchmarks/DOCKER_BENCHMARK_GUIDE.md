# Docker-Based IoT Cryptographic Benchmark Guide

## Overview

This guide provides instructions for running PQC (ML-DSA) vs ECDSA performance benchmarks in a resource-constrained Docker environment that emulates a Raspberry Pi Zero W edge device.

**Resource Constraints:**

- **CPU:** 0.5 cores (ARM11 @ 1GHz equivalent)
- **Memory:** 512MB RAM
- **Environment:** Node.js 20 on Debian Bullseye

---

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v3.8 or higher
- At least 2GB free disk space

Verify installation:

```powershell
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Build the Docker Image

Build the containerized test environment with all dependencies:

```powershell
docker-compose build
```

**Expected output:** Image build completes with all Node.js dependencies installed (typically 2-5 minutes first run).

---

### 2. Run the Benchmark

Execute the benchmark script inside the resource-constrained container:

```powershell
docker-compose run --rm pqc-benchmark
```

**What happens:**

- Container starts with CPU and memory limits enforced
- Benchmark script runs 100 iterations per operation (warmup + testing)
- Results saved to `./iot-benchmark-results/iot-benchmark-results.json`
- Container automatically removed after completion

---

### 3. View Results

The raw JSON output:

```powershell
Get-Content .\iot-benchmark-results\iot-benchmark-results.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Or simply open the file in VS Code:

```powershell
code .\iot-benchmark-results\iot-benchmark-results.json
```

---

## Alternative Execution Methods

### Interactive Shell (for debugging)

Start the container with an interactive shell:

```powershell
docker-compose run --rm pqc-benchmark /bin/bash
```

Then manually run benchmarks:

```bash
node benchmarks/benchmark.js
```

### Run with Memory Profiling

Enable garbage collection exposure for more accurate memory tracking:

```powershell
docker-compose run --rm pqc-benchmark node --expose-gc benchmarks/benchmark.js
```

### Check Resource Limits (Verification)

Verify CPU and memory constraints are applied:

```powershell
docker stats iot-crypto-benchmark
```

Run this in a separate terminal while the benchmark is executing.

---

## Customizing the Benchmark

### Modify Iterations

Edit `benchmarks/benchmark.js` line 18-19:

```javascript
const CONFIG = {
  iterations: 100, // Increase for more statistical significance
  warmupIterations: 10,
  // ...
};
```

### Adjust Resource Limits

Edit `docker-compose.yml` lines 17-18:

```yaml
deploy:
  resources:
    limits:
      cpus: "0.5" # Change to '1.0' for full core
      memory: 512M # Change to '1024M' for 1GB
```

Then rebuild:

```powershell
docker-compose build
```

### Replace Dummy Crypto Functions

In `benchmarks/benchmark.js`, locate the TODO sections:

```javascript
// Lines 25-35: Replace generateKey()
async function generateKey(algorithm) {
  if (algorithm === "ECDSA") {
    // Import your ECDSA implementation
    // const crypto = require('crypto');
    // return crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
  } else if (algorithm === "ML-DSA") {
    // Import your ML-DSA implementation
    // const { mldsa44 } = require('liboqs-node');
    // return await mldsa44.generateKeyPair();
  }
}
```

---

## Troubleshooting

### Issue: "docker-compose: command not found"

**Solution:** Install Docker Desktop or use `docker compose` (without hyphen):

```powershell
docker compose build
docker compose run --rm pqc-benchmark
```

### Issue: Build fails with "gyp ERR!"

**Cause:** Native PQC library compilation failure.

**Solution:** Check that your `package.json` includes the correct PQC library (e.g., `liboqs-node`, `pqclean-wasm`). The Dockerfile includes all necessary build tools.

### Issue: Container uses 100% CPU despite limits

**Cause:** Docker Desktop on Windows requires WSL2 backend for resource limits.

**Solution:**

1. Open Docker Desktop → Settings → General
2. Enable "Use the WSL 2 based engine"
3. Restart Docker Desktop

### Issue: Permission denied errors (Linux)

**Solution:** Run with sudo or add your user to the docker group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## File Structure

```
vc-ecdsa-crypto/
├── Dockerfile                           # Container definition with build tools
├── docker-compose.yml                   # Resource limits and orchestration
├── benchmarks/
│   └── benchmark.js                     # Performance testing script
└── iot-benchmark-results/
    └── iot-benchmark-results.json       # Output data
```

---

## Next Steps for Research

1. **Integrate Real Cryptography:**
   - Replace dummy functions in `benchmark.js` with actual ECDSA (Node.js `crypto` module)
   - Install and integrate ML-DSA library (e.g., `npm install @noble/post-quantum`)

2. **Expand Test Scenarios:**
   - Vary message sizes (64 bytes, 256 bytes, 1KB, 10KB)
   - Test batch operations (signing 100 messages in sequence)
   - Measure signature size overhead

3. **Statistical Analysis:**
   - Export results to your Python ANOVA scripts
   - Compare against non-containerized baseline
   - Generate performance-vs-resources regression curves

4. **Thesis Integration:**
   - Document methodology in your thesis (reproducible research section)
   - Include Dockerfile in appendix or GitHub repository
   - Cite resource constraints as experimental controls

---

## Advanced: Continuous Benchmarking

Run automated benchmarks with different resource profiles:

```powershell
# Test with varying CPU limits
foreach ($cpu in @('0.25', '0.5', '1.0', '2.0')) {
    Write-Host "Testing with $cpu CPU cores..."
    (Get-Content docker-compose.yml) -replace "cpus: '[\d.]+", "cpus: '$cpu'" | Set-Content docker-compose.yml
    docker-compose build
    docker-compose run --rm pqc-benchmark
    Move-Item .\iot-benchmark-results\iot-benchmark-results.json ".\iot-benchmark-results\results-cpu-$cpu.json"
}
```

---

## References

- Docker Resource Constraints: https://docs.docker.com/compose/compose-file/deploy/
- Node.js Performance Hooks: https://nodejs.org/api/perf_hooks.html
- FIPS 204 ML-DSA Specification: https://csrc.nist.gov/pubs/fips/204/final

---

**Author:** Generated for academic research - PQC feasibility study  
**Date:** March 2026  
**License:** MIT (modify as needed for your thesis)
