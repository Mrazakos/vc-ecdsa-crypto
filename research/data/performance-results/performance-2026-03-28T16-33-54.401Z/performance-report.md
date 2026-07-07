# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 28. 17:27:26  
**Test Configuration:** 200 iterations per test

---

## Executive Summary

### Performance Winners

- **Fastest Key Generation:** ECDSA
- **Fastest Signing:** ECDSA
- **Fastest Verification:** RSA-2048

### Size Winners

- **Smallest Key Size:** ECDSA
- **Smallest Signature Size:** ECDSA
- **Smallest Credential Size:** ECDSA

---

## Detailed Performance Metrics

### Key Generation Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 0.748 | 0.44 | 35.03 | 0.55 | 2.44 |
| RSA-PSS 2048 | 1831.951 | 124.90 | 7632.72 | 1416.94 | 1323.56 |
| ML-DSA-44 | 1.551 | 1.00 | 15.03 | 1.30 | 1.15 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 1.532 | 0.98 | 9.18 | 1.26 | 0.82 |
| RSA-PSS 2048 | 69.229 | 53.35 | 127.22 | 64.40 | 12.75 |
| ML-DSA-44 | 6.984 | 2.13 | 39.57 | 5.10 | 5.25 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 3.292 | 2.55 | 7.72 | 2.96 | 0.99 |
| RSA-PSS 2048 | 0.704 | 0.47 | 2.89 | 0.58 | 0.28 |
| ML-DSA-44 | 1.812 | 1.37 | 4.45 | 1.73 | 0.43 |

---

## Size Analysis

### Key Sizes

| Algorithm | Key Size |
|-----------|----------|
| ECDSA secp256k1 | 256-bit (32 bytes private, 65 bytes public) |
| RSA-PSS 2048 | 2048-bit (~1700 bytes each) |
| ML-DSA-44 | 1952 bytes public, 4000 bytes secret |

### Signature Sizes

| Algorithm | Signature Size (bytes) |
|-----------|------------------------|
| ECDSA secp256k1 | 132 |
| RSA-PSS 2048 | 344 |
| ML-DSA-44 | 3228 |

### Average Credential Sizes

| Algorithm | Avg Credential Size (bytes) |
|-----------|------------------------------|
| ECDSA secp256k1 | 554 |
| RSA-PSS 2048 | 755 |
| ML-DSA-44 | 3641 |

---

## Analysis for Thesis

### Performance Trade-offs

1. **ECDSA secp256k1**
   - Extremely fast signing (1.53ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (69.23ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-44 (Post-Quantum)**
   - Fast signing (6.98ms avg)
   - Largest signatures (3228 bytes)
   - Quantum-resistant (future-proof)
   - NIST standardized (FIPS 204)

### Recommendations by Use Case

- **Mobile/IoT Access Control (Current):** ECDSA secp256k1
- **Enterprise PKI (Current):** RSA-PSS 2048
- **Long-term Archival (10+ years):** ML-DSA-44
- **Hybrid Systems:** ECDSA + ML-DSA-44 dual signatures

---

**Raw Data:** See `raw-data.json` for complete timing measurements.
