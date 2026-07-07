# Raspberry Pi Performance Benchmark

**Date:** 2026. 07. 07. 18:15:59  
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
| ECDSA secp256k1 | 0.898 | 1.539 | 4.228 | 132 | 650 |
| ML-DSA-44 (Dilithium2) | 1.191 | 4.797 | 1.146 | 3228 | 3737 |
| Falcon-512 | 245.152 | 3.739 | 0.795 | 872 | 1381 |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the current NIST PQ benchmark path.
- Falcon-512 is the heaviest path and may be significantly slower on this hardware.
