# Raspberry Pi Performance Benchmark

**Date:** 2026. 07. 13. 16:17:51  
**Iterations:** 200 per operation

## Environment

- Platform: win32 10.0.26200
- Architecture: x64
- CPU: 12th Gen Intel(R) Core(TM) i7-1260P
- Cores: 16
- Memory: 15.63 GB
- Node.js: v22.18.0

## Summary

- Fastest key generation: ECDSA
- Fastest signing: ECDSA
- Fastest verification: Falcon-512
- Smallest key size: ECDSA
- Smallest signature size: ECDSA
- Smallest credential size: ECDSA

## Results

| Algorithm | Key Gen Avg (ms) | Sign Avg (ms) | Verify Avg (ms) | Signature Size (bytes) | Credential Size (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| ECDSA secp256k1 | 0.960 | 1.400 | 3.889 | 132 | 650 |
| ML-DSA-44 (Dilithium2) | 1.147 | 4.977 | 1.197 | 3228 | 3737 |
| Falcon-512 | 239.533 | 3.737 | 0.831 | 876 | 1385 |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the current NIST PQ benchmark path.
- Falcon-512 is the heaviest path and may be significantly slower on this hardware.
