# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 01. 07. 22:37:34  
**Test Configuration:** 30 iterations per test

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
| ECDSA secp256k1 | 12.960 | 7.47 | 94.36 | 9.96 | 15.22 |
| RSA-PSS 2048 | 2465.872 | 407.58 | 9450.25 | 1747.04 | 2020.85 |
| ML-DSA-65 | 2.859 | 1.86 | 15.74 | 2.22 | 2.48 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 1.856 | 1.36 | 3.93 | 1.63 | 0.53 |
| RSA-PSS 2048 | 81.401 | 57.65 | 116.42 | 78.41 | 17.54 |
| ML-DSA-65 | 10.906 | 3.48 | 24.85 | 9.80 | 6.07 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 4.618 | 3.44 | 7.04 | 4.28 | 0.92 |
| RSA-PSS 2048 | 0.743 | 0.51 | 1.75 | 0.64 | 0.27 |
| ML-DSA-65 | 3.258 | 2.33 | 5.97 | 2.87 | 0.96 |

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
| ML-DSA-65 | 6620 |

### Average Credential Sizes

| Algorithm | Avg Credential Size (bytes) |
|-----------|------------------------------|
| ECDSA secp256k1 | 554 |
| RSA-PSS 2048 | 755 |
| ML-DSA-65 | 7033 |

---

## Analysis for Thesis

### Performance Trade-offs

1. **ECDSA secp256k1**
   - Extremely fast signing (1.86ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (81.40ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-65 (Post-Quantum)**
   - Fast signing (10.91ms avg)
   - Largest signatures (6620 bytes)
   - Quantum-resistant (future-proof)
   - NIST standardized (FIPS 204)

### Recommendations by Use Case

- **Mobile/IoT Access Control (Current):** ECDSA secp256k1
- **Enterprise PKI (Current):** RSA-PSS 2048
- **Long-term Archival (10+ years):** ML-DSA-65
- **Hybrid Systems:** ECDSA + ML-DSA-65 dual signatures

---

**Raw Data:** See `raw-data.json` for complete timing measurements.
