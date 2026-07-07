# Raspberry Pi Performance Benchmark

**Date:** 2026. 07. 07. 17:25:38  
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
- Fastest verification: RSA-2048
- Smallest key size: ECDSA
- Smallest signature size: ECDSA
- Smallest credential size: ECDSA

## Results

| Algorithm | Key Gen Avg (ms) | Sign Avg (ms) | Verify Avg (ms) | Signature Size (bytes) | Credential Size (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| ECDSA secp256k1 | 47.917 | 8.506 | 7.101 | 132 | 650 |
| RSA-PSS 2048-bit | 3175.671 | 100.758 | 2.026 | 344 | 851 |
| ML-DSA-44 (Dilithium2) | 16.887 | 9.452 | 2.796 | 3228 | 3737 |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the heaviest path and may be significantly slower on this hardware.
