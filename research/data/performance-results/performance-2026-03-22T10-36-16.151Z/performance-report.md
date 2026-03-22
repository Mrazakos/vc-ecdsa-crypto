# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 22. 11:29:17  
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
| ECDSA secp256k1 | 0.836 | 0.46 | 39.31 | 0.60 | 2.73 |
| RSA-PSS 2048 | 1984.888 | 194.21 | 10042.25 | 1430.95 | 1677.60 |
| ML-DSA-44 | 1.546 | 1.19 | 12.61 | 1.38 | 0.89 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 1.599 | 1.19 | 5.30 | 1.46 | 0.45 |
| RSA-PSS 2048 | 72.799 | 59.30 | 135.42 | 71.75 | 8.34 |
| ML-DSA-44 | 7.624 | 2.33 | 37.56 | 5.75 | 5.59 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 3.740 | 2.71 | 7.75 | 3.33 | 1.11 |
| RSA-PSS 2048 | 0.663 | 0.49 | 1.89 | 0.57 | 0.24 |
| ML-DSA-44 | 2.120 | 1.42 | 4.66 | 1.84 | 0.66 |

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
   - Extremely fast signing (1.60ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (72.80ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-44 (Post-Quantum)**
   - Fast signing (7.62ms avg)
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
