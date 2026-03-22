# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 18. 18:57:48  
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
| ECDSA secp256k1 | 2.446 | 1.24 | 139.73 | 1.55 | 9.76 |
| RSA-PSS 2048 | 4796.984 | 359.21 | 20874.79 | 3443.60 | 4105.44 |
| ML-DSA-44 | 4.473 | 2.23 | 39.58 | 4.52 | 2.94 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 3.125 | 1.80 | 15.49 | 2.97 | 1.40 |
| RSA-PSS 2048 | 206.723 | 107.15 | 304.78 | 203.02 | 44.02 |
| ML-DSA-44 | 19.898 | 4.40 | 99.68 | 16.36 | 14.19 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 9.203 | 3.32 | 20.86 | 9.46 | 2.57 |
| RSA-PSS 2048 | 1.592 | 1.02 | 8.39 | 1.30 | 0.82 |
| ML-DSA-44 | 5.327 | 2.84 | 9.78 | 5.27 | 1.55 |

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
   - Extremely fast signing (3.13ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (206.72ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-44 (Post-Quantum)**
   - Fast signing (19.90ms avg)
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
