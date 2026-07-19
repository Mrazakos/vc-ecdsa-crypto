# Raspberry Pi Performance Benchmark

**Date:** 2026. 07. 13. 16:16:35  
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
| ECDSA secp256k1 | 0.905 | 1.501 | 4.042 | 132 | 650 |
| ML-DSA-44 (Dilithium2) | 1.183 | 5.043 | 1.140 | 3228 | 3737 |
| Falcon-512 | 235.743 | 3.627 | 0.745 | 876 | 1385 |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the current NIST PQ benchmark path.
- Falcon-512 is the heaviest path and may be significantly slower on this hardware.
