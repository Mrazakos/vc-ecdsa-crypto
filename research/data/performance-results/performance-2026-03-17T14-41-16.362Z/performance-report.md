# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 17. 15:27:12  
**Test Configuration:** 200 iterations per test

---

## Executive Summary

### Performance Winners

- **Fastest Key Generation:** ML-DSA-65
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
| ECDSA secp256k1 | 10.266 | 7.08 | 63.17 | 9.30 | 4.68 |
| RSA-PSS 2048 | 3880.986 | 249.47 | 22735.61 | 2365.79 | 4087.06 |
| ML-DSA-65 | 5.090 | 2.18 | 59.13 | 4.77 | 4.23 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 3.916 | 1.79 | 16.58 | 3.75 | 1.52 |
| RSA-PSS 2048 | 203.199 | 114.45 | 341.72 | 200.38 | 44.98 |
| ML-DSA-65 | 21.499 | 4.34 | 114.28 | 16.70 | 15.67 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 12.082 | 5.10 | 22.71 | 12.60 | 2.79 |
| RSA-PSS 2048 | 2.320 | 1.11 | 8.07 | 2.29 | 0.84 |
| ML-DSA-65 | 6.033 | 2.87 | 11.51 | 6.13 | 1.99 |

---

## Size Analysis

### Key Sizes

| Algorithm | Key Size |
|-----------|----------|
| ECDSA secp256k1 | 256-bit (32 bytes private, 65 bytes public) |
| RSA-PSS 2048 | 2048-bit (~1700 bytes each) |
| ML-DSA-65 | 1952 bytes public, 4000 bytes secret |

### Signature Sizes

| Algorithm | Signature Size (bytes) |
|-----------|------------------------|
| ECDSA secp256k1 | 132 |
| RSA-PSS 2048 | 344 |
| ML-DSA-65 | 3228 |

### Average Credential Sizes

| Algorithm | Avg Credential Size (bytes) |
|-----------|------------------------------|
| ECDSA secp256k1 | 554 |
| RSA-PSS 2048 | 755 |
| ML-DSA-65 | 3641 |

---

## Analysis for Thesis

### Performance Trade-offs

1. **ECDSA secp256k1**
   - Extremely fast signing (3.92ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (203.20ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-65 (Post-Quantum)**
   - Fast signing (21.50ms avg)
   - Largest signatures (3228 bytes)
   - Quantum-resistant (future-proof)
   - NIST standardized (FIPS 204)

### Recommendations by Use Case

- **Mobile/IoT Access Control (Current):** ECDSA secp256k1
- **Enterprise PKI (Current):** RSA-PSS 2048
- **Long-term Archival (10+ years):** ML-DSA-65
- **Hybrid Systems:** ECDSA + ML-DSA-65 dual signatures

---

**Raw Data:** See `raw-data.json` for complete timing measurements.
