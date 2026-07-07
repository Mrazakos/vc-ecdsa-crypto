# Raspberry Pi Performance Benchmark

**Date:** 2026. 07. 07. 18:15:40  
**Iterations:** 1 per operation

## Environment

- Platform: win32 10.0.26200
- Architecture: x64
- CPU: 12th Gen Intel(R) Core(TM) i7-1260P
- Cores: 16
- Memory: 15.63 GB
- Node.js: v22.18.0

## Summary

- Fastest key generation: ML-DSA-44
- Fastest signing: ECDSA
- Fastest verification: ML-DSA-44
- Smallest key size: ECDSA
- Smallest signature size: ECDSA
- Smallest credential size: ECDSA

## Results

| Algorithm | Key Gen Avg (ms) | Sign Avg (ms) | Verify Avg (ms) | Signature Size (bytes) | Credential Size (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| ECDSA secp256k1 | 43.683 | 6.668 | 5.948 | 132 | 650 |
| ML-DSA-44 (Dilithium2) | 11.580 | 12.510 | 2.125 | 3228 | 3737 |
| Falcon-512 | 244.628 | 15.379 | 2.213 | 876 | 1385 |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the current NIST PQ benchmark path.
- Falcon-512 is the heaviest path and may be significantly slower on this hardware.
