# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 18. 16:29:11  
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
| ECDSA secp256k1 | 1.060 | 0.68 | 50.47 | 0.75 | 3.51 |
| RSA-PSS 2048 | 3342.324 | 299.10 | 17934.78 | 2413.02 | 2961.99 |
| ML-DSA-65 | 2.880 | 2.21 | 31.49 | 2.61 | 2.11 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 2.456 | 1.77 | 10.31 | 2.26 | 0.77 |
| RSA-PSS 2048 | 130.024 | 112.43 | 214.14 | 128.36 | 12.35 |
| ML-DSA-65 | 10.570 | 4.41 | 55.52 | 8.22 | 7.41 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 5.011 | 4.36 | 9.39 | 4.72 | 0.79 |
| RSA-PSS 2048 | 1.473 | 1.08 | 7.77 | 1.23 | 0.62 |
| ML-DSA-65 | 3.708 | 2.86 | 9.54 | 3.31 | 0.98 |

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
   - Extremely fast signing (2.46ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (130.02ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-65 (Post-Quantum)**
   - Fast signing (10.57ms avg)
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
