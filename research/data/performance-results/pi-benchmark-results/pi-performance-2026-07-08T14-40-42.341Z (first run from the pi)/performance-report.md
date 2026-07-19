# Raspberry Pi Performance Benchmark

**Date:** 08/07/2026, 16:35:03  
**Iterations:** 200 per operation

## Environment

- Platform: linux 6.18.34+rpt-rpi-v8
- Architecture: arm64
- CPU: Cortex-A53
- Cores: 4
- Memory: 0.88 GB
- Node.js: v24.18.0

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
| ECDSA secp256k1 | 5.136 | 8.271 | 17.968 | 132 | 650 |
| ML-DSA-44 (Dilithium2) | 13.459 | 46.333 | 13.037 | 3228 | 3737 |
| Falcon-512 | 1533.019 | 39.444 | 8.623 | 872 | 1381 |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the current NIST PQ benchmark path.
- Falcon-512 is the heaviest path and may be significantly slower on this hardware.
