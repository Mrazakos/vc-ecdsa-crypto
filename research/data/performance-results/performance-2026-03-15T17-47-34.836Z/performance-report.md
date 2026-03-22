# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 15. 18:33:34  
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
| ECDSA secp256k1 | 10.171 | 7.92 | 68.93 | 9.83 | 4.27 |
| RSA-PSS 2048 | 4066.364 | 250.53 | 17897.70 | 3134.81 | 3361.72 |
| ML-DSA-65 | 1.760 | 0.99 | 12.90 | 1.58 | 0.91 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 1.676 | 1.11 | 5.03 | 1.45 | 0.64 |
| RSA-PSS 2048 | 82.748 | 59.53 | 138.51 | 76.56 | 18.14 |
| ML-DSA-65 | 7.203 | 2.12 | 35.43 | 5.69 | 5.23 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 4.330 | 2.77 | 7.65 | 4.04 | 1.05 |
| RSA-PSS 2048 | 0.742 | 0.59 | 1.83 | 0.72 | 0.17 |
| ML-DSA-65 | 2.043 | 1.55 | 3.65 | 1.98 | 0.31 |

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
   - Extremely fast signing (1.68ms avg)
   - Smallest signatures (132 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (82.75ms avg)
   - Moderate signature size (344 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-65 (Post-Quantum)**
   - Fast signing (7.20ms avg)
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
