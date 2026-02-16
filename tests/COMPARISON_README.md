# Cryptographic Algorithm Comparison Tests

This directory contains **simplified performance comparison tests** for three cryptographic algorithms used in Verifiable Credentials:

1. **ECDSA secp256k1** (Current standard)
2. **RSA-PSS 2048** (Classical cryptography)
3. **ML-DSA-65** (Post-Quantum, formerly Dilithium3)

## Test File

### `vc-comparison-performance.test.ts`

Measures and compares performance across all three algorithms:

- **Key generation speed** (30 iterations each)
- **VC issuance (signing) speed** (30 iterations each)
- **VC verification speed** (30 iterations each)
- **Signature sizes** (bytes)
- **Credential sizes** (bytes)

**Run:** `npm test -- vc-comparison-performance`

## Output

Test results are automatically saved to `comparison-results/` with timestamped folders:

```
comparison-results/
└── performance-2026-01-07T12-00-00-000Z/
    ├── performance-report.md    (Thesis-ready tables & analysis)
    └── raw-data.json             (Complete timing data)
```

## Expected Results

Based on 30 iterations per algorithm:

| Metric          | ECDSA      | RSA-2048   | ML-DSA-65   |
| --------------- | ---------- | ---------- | ----------- |
| Key Generation  | ~16ms      | ~242ms     | ~4.5ms      |
| Signing         | ~2.6ms     | ~1363ms    | ~13.4ms     |
| Verification    | ~5.1ms     | ~37ms      | ~4.2ms      |
| Signature Size  | 132 bytes  | 344 bytes  | 6620 bytes  |
| Credential Size | ~554 bytes | ~755 bytes | ~7033 bytes |

## Using Results in Your Thesis

1. Run the test: `npm test -- vc-comparison-performance`
2. Open `comparison-results/performance-<timestamp>/performance-report.md`
3. Copy the markdown tables directly into your thesis
4. Use `raw-data.json` for custom statistical analysis or visualizations