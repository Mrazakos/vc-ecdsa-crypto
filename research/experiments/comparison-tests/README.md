# Comparison Tests

Comprehensive performance and security comparison of cryptographic algorithms for Verifiable Credentials.

## Algorithms Tested

1. **ECDSA (secp256k1)** - Modern, fast elliptic curve
2. **RSA-PSS (2048-bit)** - Classical industry standard
3. **ML-DSA-65** - NIST-standardized post-quantum lattice-based

## Quick Start

### Run All Comparison Tests

```powershell
.\run-comparison.ps1
```

### Run Performance Tests Only

```powershell
npm run build && npm test -- vc-comparison-performance
```

### Run Security Tests Only

```powershell
npm run build && npm test -- vc-comparison-security
```

## What Gets Tested

### Performance Metrics

- ✓ Key generation time (ms)
- ✓ Credential signing time (ms)
- ✓ Credential verification time (ms)
- ✓ Signature size (bytes)
- ✓ Credential size (bytes)
- ✓ Overall throughput (credentials/sec)

### Security Metrics

- ✓ Signature tampering resistance
- ✓ Wrong-key attack detection
- ✓ Credential field tampering detection
- ✓ Malformed input handling
- ✓ Edge case robustness

## Output

Results are saved to `comparison-results/` with timestamps:

```
comparison-results/
├── performance-2026-03-22T10-30-45.123Z/
│   ├── performance-report.md
│   ├── raw-data.json
│   └── visualization.json
└── security-2026-03-22T10-30-45.123Z/
    ├── security-report.md
    └── security-results.json
```

Each report includes:

- Comparison tables
- Statistical analysis (mean, median, std dev)
- Algorithm rankings
- Recommendations

## Files

| File                 | Purpose                             |
| -------------------- | ----------------------------------- |
| `run-comparison.ps1` | PowerShell automation script        |
| `config.json`        | Experiment configuration & metadata |
| `README.md`          | This file                           |

## Further Analysis

After running tests, use ANOVA statistical analysis:

```powershell
cd ..\..\analysis\anova
.\run-anova.ps1
```

This will:

- Perform robust statistical testing
- Generate distribution plots
- Test assumptions (normality, homogeneity)
- Identify statistically significant differences
