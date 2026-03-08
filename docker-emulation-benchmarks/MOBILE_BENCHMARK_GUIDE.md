# Mobile Runtime Benchmark Guide

## Overview

Test your cryptographic library in **simulated mobile device environments** using publicly available Docker images. This simulates Android/iOS JavaScript runtime performance for key generation and signing operations.

**Base Image:** `node:20-alpine` (lightweight, mobile-like constraints)

**Device Tiers:**

- **Low-End:** 2 cores, 2GB RAM (budget Android phones)
- **Mid-Range:** 4 cores, 4GB RAM (typical smartphones)
- **High-End:** 8 cores, 8GB RAM (flagship devices)

---

## Quick Start

### 1. Build Mobile Runtime Image

```powershell
docker build -f Dockerfile.mobile -t vc-mobile .
```

### 2. Run Benchmarks

**Mid-Range Device (recommended):**

```powershell
docker-compose -f docker-compose.mobile.yml run --rm mobile-mid-range
```

**Low-End Device:**

```powershell
docker-compose -f docker-compose.mobile.yml run --rm mobile-low-end
```

**High-End Device:**

```powershell
docker-compose -f docker-compose.mobile.yml run --rm mobile-high-end
```

---

## What Gets Tested

### Mobile-Specific Scenarios

1. **📱 Wallet Creation** - User generates new digital identity
   - Measures key generation time and memory
   - Critical for first-time user experience

2. **✍️ Credential Signing** - User requests access credential
   - Realistic building access/event ticket scenario
   - Measures signing latency (UX critical)

3. **⚡ Rapid Signing** - Batch operations (10 signatures)
   - Multi-sig wallets, batch transactions
   - Tests sustained performance

4. **📊 Mobile Impact Analysis**
   - Key/signature sizes (storage impact)
   - NFC/Bluetooth transfer times
   - QR code compatibility

---

## Results Location

Results are saved to `./mobile-benchmark-results/`:

- `mobile-results-low-end.json` - Low-end device data
- `mobile-results-mid-range.json` - Mid-range device data
- `mobile-results-high-end.json` - High-end device data

### View Results

```powershell
# Quick view
Get-Content .\mobile-benchmark-results\mobile-results-mid-range.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Open in VS Code
code .\mobile-benchmark-results\mobile-results-mid-range.json
```

---

## Compare Across Device Tiers

Run all three tiers and compare:

```powershell
# Run all tiers
docker-compose -f docker-compose.mobile.yml run --rm mobile-low-end
docker-compose -f docker-compose.mobile.yml run --rm mobile-mid-range
docker-compose -f docker-compose.mobile.yml run --rm mobile-high-end

# Compare results
Get-ChildItem .\mobile-benchmark-results\*.json | ForEach-Object {
    Write-Host "`n=== $($_.Name) ===" -ForegroundColor Cyan
    $data = Get-Content $_.FullName | ConvertFrom-Json
    Write-Host "Device: $($data.deviceTier)"
    Write-Host "ECDSA Signing: $([math]::Round($data.results.ECDSA.credentialSigning.avgTime, 2))ms"
    Write-Host "ML-DSA Signing: $([math]::Round($data.results.'ML-DSA-65'.credentialSigning.avgTime, 2))ms"
}
```

---

## Interactive Testing

For debugging or manual testing:

```powershell
# Start interactive shell
docker-compose -f docker-compose.mobile.yml run --rm mobile-mid-range /bin/sh

# Inside container:
node --expose-gc benchmarks/mobile-benchmark.js

# Or test individual operations:
node -e "const { ECDSACryptoService } = require('./dist'); const svc = new ECDSACryptoService(); svc.generateIdentity().then(id => console.log('Key:', id.publicKey.length, 'bytes'))"
```

---

## Customization

### Adjust Iterations

```powershell
# Quick test (50 iterations)
docker-compose -f docker-compose.mobile.yml run --rm -e BENCHMARK_ITERATIONS=50 mobile-mid-range

# Thorough test (500 iterations)
docker-compose -f docker-compose.mobile.yml run --rm -e BENCHMARK_ITERATIONS=500 mobile-mid-range
```

### Custom Device Constraints

Edit [docker-compose.mobile.yml](docker-compose.mobile.yml):

```yaml
deploy:
  resources:
    limits:
      cpus: "6.0" # Custom CPU limit
      memory: 6G # Custom RAM limit
```

---

## Understanding Results

### Key Metrics

**Wallet Creation (Key Generation):**

- **Target:** <50ms average (good UX)
- **P95:** Should be <100ms (95% of operations)

**Credential Signing:**

- **Target:** <20ms average (imperceptible)
- **P95:** <100ms (acceptable UX)
- **P99:** <200ms (edge cases)

### Mobile UX Guidelines

| Latency    | User Perception              |
| ---------- | ---------------------------- |
| <100ms     | ✅ Imperceptible (instant)   |
| 100-300ms  | ⚠️ Slight delay (acceptable) |
| 300-1000ms | ⚠️ Noticeable (frustrating)  |
| >1000ms    | ❌ Unacceptable              |

### Data Size Impact

- **NFC Transfer:** ~424 kbps (typical NFC speed)
- **Bluetooth LE:** ~2 Mbps (BLE 5.0)
- **QR Code Limit:** 2,953 bytes max

If credentials exceed QR code capacity, they can't be shared via QR codes (common mobile pattern).

---

## Why Node.js Alpine?

**Publicly Available:** Official Docker image, well-maintained

**Lightweight:** ~50MB base (vs 1GB+ for full Node.js)

- Closer to mobile bundle size constraints
- Uses musl libc (similar to Android's bionic libc)

**JavaScript Engine:** V8 (same as Android WebView, Chrome, React Native)

**Limitations:** Not exact mobile replica, but represents:

- Memory constraints
- CPU limitations
- JavaScript runtime performance
- Storage/size constraints

---

## Alternative Public Images

If you need different mobile-like environments:

### React Native Specific

```dockerfile
FROM reactnativecommunity/react-native-android
```

### Minimal (Even lighter)

```dockerfile
FROM node:20-alpine3.18
```

### With More Tools (for debugging)

```dockerfile
FROM node:20-slim
```

To use alternative base image, edit [Dockerfile.mobile](Dockerfile.mobile) line 6.

---

## Comparison with IoT Benchmark

| Aspect         | IoT Benchmark           | Mobile Benchmark     |
| -------------- | ----------------------- | -------------------- |
| **Device**     | Raspberry Pi Zero W     | Smartphone           |
| **CPU**        | 0.5 cores               | 2-8 cores            |
| **RAM**        | 512MB                   | 2-8GB                |
| **Focus**      | Sustained operations    | Interactive UX       |
| **Base Image** | `node:20-bullseye-slim` | `node:20-alpine`     |
| **Use Case**   | Edge devices, gateways  | Mobile wallets, apps |

Run both to understand full deployment spectrum!

---

## Troubleshooting

### Build Fails

```powershell
# Clean rebuild
docker-compose -f docker-compose.mobile.yml build --no-cache
```

### Out of Memory

Reduce iterations:

```powershell
docker-compose -f docker-compose.mobile.yml run --rm -e BENCHMARK_ITERATIONS=50 mobile-low-end
```

### Permission Issues (Linux/Mac)

```bash
sudo chown -R $USER:$USER ./mobile-benchmark-results
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Mobile Benchmarks
  run: |
    docker-compose -f docker-compose.mobile.yml build
    docker-compose -f docker-compose.mobile.yml run --rm mobile-mid-range

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: mobile-benchmark-results
    path: mobile-benchmark-results/
```

---

## Next Steps

1. **Run baseline:** `docker-compose -f docker-compose.mobile.yml run --rm mobile-mid-range`
2. **Analyze results:** Check JSON output for latency, memory, sizes
3. **Compare tiers:** Run low-end to see worst-case performance
4. **Optimize:** If P95 >100ms, consider performance improvements
5. **Document:** Include mobile benchmarks in your thesis

For questions, see [README.md](README.md) or check [benchmarks/mobile-benchmark.js](benchmarks/mobile-benchmark.js) source code.
