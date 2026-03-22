# Verifiable Credential Cryptographic Performance Comparison

**Date:** 2026. 01. 06. 23:39:42  
**Test Configuration:** 30 iterations per test

---

## Executive Summary

### Performance Winners

- **Fastest Key Generation:** Dilithium3
- **Fastest Signing:** ECDSA
- **Fastest Verification:** Dilithium3

### Size Winners

- **Smallest Key Size:** ECDSA
- **Smallest Signature Size:** ECDSA
- **Smallest Credential Size:** ECDSA

---

## Detailed Performance Metrics

### Key Generation Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 16.051 | 11.28 | 92.70 | 13.06 | 14.35 |
| RSA-PSS 2048 | 242.250 | 77.57 | 639.27 | 173.10 | 155.36 |
| RSA-PSS 4096 | NaN | Infinity | -Infinity | NaN | NaN |
| Dilithium3 | 4.583 | 2.99 | 21.83 | 3.37 | 3.48 |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 2.631 | 1.79 | 6.91 | 2.04 | 1.08 |
| RSA-PSS 2048 | 1362.809 | 1299.27 | 1590.81 | 1335.90 | 71.84 |
| RSA-PSS 4096 | NaN | Infinity | -Infinity | NaN | NaN |
| Dilithium3 | 13.439 | 5.47 | 42.81 | 10.26 | 10.56 |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | 5.130 | 4.71 | 6.67 | 5.00 | 0.42 |
| RSA-PSS 2048 | 37.113 | 34.40 | 57.09 | 36.36 | 3.91 |
| RSA-PSS 4096 | NaN | Infinity | -Infinity | NaN | NaN |
| Dilithium3 | 4.207 | 3.68 | 6.73 | 3.99 | 0.62 |

---

## Size Analysis

### Key Sizes

| Algorithm | Key Size |
|-----------|----------|
| ECDSA secp256k1 | 256-bit (32 bytes private, 65 bytes public) |
| RSA-PSS 2048 | 2048-bit (~1700 bytes each) |
| RSA-PSS 4096 | 4096-bit (~3200 bytes each) |
| Dilithium3 | 1952 bytes public, 4000 bytes secret |

### Signature Sizes

| Algorithm | Signature Size (bytes) |
|-----------|------------------------|
| ECDSA secp256k1 | 132 |
| RSA-PSS 2048 | 344 |
| RSA-PSS 4096 | 684 |
| Dilithium3 | 6620 |

### Average Credential Sizes

| Algorithm | Avg Credential Size (bytes) |
|-----------|------------------------------|
| ECDSA secp256k1 | 554 |
| RSA-PSS 2048 | 755 |
| RSA-PSS 4096 | 1095 |
| Dilithium3 | 7033 |

---

## Analysis for Thesis

### Performance Trade-offs

1. **ECDSA secp256k1**
   - Extremely fast key generation and signing
   - Smallest key and signature sizes
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS**
   - Slower key generation (especially 4096-bit)
   - Moderate signing/verification speed
   - Larger keys and signatures
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **Dilithium3 (Post-Quantum)**
   - Fast key generation
   - Moderate signing speed
   - Very fast verification
   - Largest signatures (3-10x larger)
   - Quantum-resistant (future-proof)
   - Best for long-term credential validity

### Recommendations by Use Case

- **Mobile/IoT Access Control (Current):** ECDSA secp256k1
- **Enterprise PKI (Current):** RSA-PSS 2048
- **Long-term Archival (10+ years):** Dilithium3
- **Hybrid Systems:** ECDSA + Dilithium3 dual signatures

---

**Raw Data:** See `raw-data.json` for complete timing measurements.
