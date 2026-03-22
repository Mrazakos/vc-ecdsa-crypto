# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 03. 18. 17:58:00  
**Test Configuration:** 200 iterations per test

---

## Executive Summary

### Performance Winners

- **Fastest Key Generation:** ECDSA
- **Fastest Signing:** ECDSA
- **Fastest Verification:** RSA-2048

### Size Winners

- **Smallest Key Size:** 
- **Smallest Signature Size:** 
- **Smallest Credential Size:** 

---

## Detailed Performance Metrics

### Key Generation Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | NaN | Infinity | -Infinity | NaN | NaN |
| RSA-PSS 2048 | NaN | Infinity | -Infinity | NaN | NaN |
| ML-DSA-44 | NaN | Infinity | -Infinity | NaN | NaN |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | NaN | Infinity | -Infinity | NaN | NaN |
| RSA-PSS 2048 | NaN | Infinity | -Infinity | NaN | NaN |
| ML-DSA-44 | NaN | Infinity | -Infinity | NaN | NaN |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 3.746 | 3.20 | 5.56 | 3.60 | 0.46 |
| RSA-PSS 2048 | 0.828 | 0.63 | 1.96 | 0.77 | 0.18 |
| ML-DSA-44 | 2.240 | 1.72 | 8.17 | 2.08 | 0.77 |

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
| ECDSA secp256k1 | 0 |
| RSA-PSS 2048 | 0 |
| ML-DSA-44 | 0 |

### Average Credential Sizes

| Algorithm | Avg Credential Size (bytes) |
|-----------|------------------------------|
| ECDSA secp256k1 | NaN |
| RSA-PSS 2048 | NaN |
| ML-DSA-44 | NaN |

---

## Analysis for Thesis

### Performance Trade-offs

1. **ECDSA secp256k1**
   - Extremely fast signing (NaNms avg)
   - Smallest signatures (0 bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (NaNms avg)
   - Moderate signature size (0 bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-44 (Post-Quantum)**
   - Fast signing (NaNms avg)
   - Largest signatures (0 bytes)
   - Quantum-resistant (future-proof)
   - NIST standardized (FIPS 204)

### Recommendations by Use Case

- **Mobile/IoT Access Control (Current):** ECDSA secp256k1
- **Enterprise PKI (Current):** RSA-PSS 2048
- **Long-term Archival (10+ years):** ML-DSA-44
- **Hybrid Systems:** ECDSA + ML-DSA-44 dual signatures

---

**Raw Data:** See `raw-data.json` for complete timing measurements.
