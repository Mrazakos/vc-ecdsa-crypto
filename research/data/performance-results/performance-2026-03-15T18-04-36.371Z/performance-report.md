# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 15. 18:47:38  
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
| ECDSA secp256k1 | 10.692 | 7.33 | 65.80 | 9.61 | 4.89 |
| RSA-PSS 2048 | 4761.917 | 320.91 | 21504.91 | 3453.03 | 3889.45 |
| ML-DSA-65 | 3.510 | 2.16 | 41.41 | 2.63 | 3.12 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 3.065 | 1.75 | 14.41 | 2.56 | 1.53 |
| RSA-PSS 2048 | 189.898 | 115.77 | 286.60 | 195.43 | 27.94 |
| ML-DSA-65 | 17.836 | 4.31 | 62.41 | 14.65 | 11.35 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 9.231 | 4.54 | 16.58 | 9.33 | 3.14 |
| RSA-PSS 2048 | 1.372 | 1.11 | 3.54 | 1.30 | 0.28 |
| ML-DSA-65 | 3.419 | 2.83 | 6.38 | 3.20 | 0.69 |

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
   - Extremely fast signing (3.06ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (189.90ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-65 (Post-Quantum)**
   - Fast signing (17.84ms avg)
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
