# Test Suite for vc-ecdsa-crypto

This directory contains comprehensive test suites designed to validate the security, robustness, and performance of the ECDSA-based cryptographic operations.

## Test Files

### 1. `adversarial-security.test.ts`

**Purpose:** Adversarial security testing to validate cryptographic boundaries

**What it tests:**

- ✅ Signature tampering attack detection
- ✅ Wrong key attack detection
- ✅ Data tampering attack detection
- ✅ Robustness against malformed input
- ✅ Performance under stress conditions
- ✅ Normal operations baseline

**Success Criteria:**

- Security attacks should be **detected and rejected** (failure is success!)
- System should not crash with malformed input
- Performance should remain acceptable
- Normal operations should have >99% success rate

**Run:** `npm run test:adversarial`

### 2. `comprehensive-stress.test.ts`

**Purpose:** High-volume stress testing with random data

**What it tests:**

- ⚡ 2000+ CryptoUtils operations with random data
- 🔐 20+ complete VC workflow scenarios
- 📊 Performance benchmarking (key gen, sign, verify)
- 🎲 Edge cases (unicode, special chars, extreme values)
- 📈 Success rate and reliability metrics

**Success Criteria:**

- > 95% success rate across all operations
- Key generation < 50ms average
- Signing < 50ms average
- Verification < 30ms average

**Run:** `npm run test:stress`

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Adversarial security tests
npm run test:adversarial

# Comprehensive stress tests
npm run test:stress

# Example test (original quick test)
npm run test:example
```

## Generated Reports

Both test suites automatically generate detailed markdown reports:

### Adversarial Security Report

- **Location:** `adversarial-test-results-[timestamp]/`
- **File:** `adversarial-security-report-ecdsa.md`
- **Contains:**
  - Security rating (EXCELLENT/GOOD/FAIR/POOR)
  - Robustness rating
  - Production readiness assessment
  - Detailed attack detection results
  - Performance analysis
  - Key findings and recommendations

### Comprehensive Stress Test Report

- **Location:** `stress-test-results-[timestamp]/`
- **File:** `comprehensive-stress-test-report.md`
- **Contains:**
  - Overall performance metrics
  - ECDSA vs RSA comparison
  - Success rate analysis
  - Individual scenario results
  - Failure analysis (if any)
  - Thesis contributions section
  - Production readiness recommendations

## Test Philosophy

### Why Adversarial Testing?

Unlike normal functional tests that verify expected behavior, adversarial tests:

1. **Attempt to break** the cryptographic operations
2. **Validate security** boundaries are properly enforced
3. **Test system limits** and edge cases
4. **Ensure graceful failures** without information leakage

### Why Stress Testing?

Stress tests validate:

1. **Reliability** under high volume
2. **Performance** with real-world data variations
3. **Robustness** with random and edge-case inputs
4. **Consistency** across many operations

## ECDSA Advantages Validated

These tests specifically validate the claimed advantages of ECDSA over RSA:

| Feature            | ECDSA Target | RSA Baseline | Validation           |
| ------------------ | ------------ | ------------ | -------------------- |
| Key Generation     | <50ms        | 30s-5min     | ✅ Stress test       |
| Signing Speed      | <50ms        | Slow         | ✅ Stress test       |
| Verification Speed | <30ms        | Moderate     | ✅ Stress test       |
| Security           | Strong       | Strong       | ✅ Adversarial test  |
| Robustness         | High         | High         | ✅ Both tests        |
| Mobile Suitability | Excellent    | Poor         | ✅ Performance tests |

## Interpreting Results

### Security Ratings

- **EXCELLENT:** No security breaches, all attacks blocked
- **GOOD:** <1% security issues, well-defended
- **FAIR:** 1-5% security issues, needs review
- **POOR:** >5% security issues, not production ready

### Robustness Ratings

- **EXCELLENT:** No crashes, all malformed input handled
- **GOOD:** <10% crashes, mostly graceful handling
- **FAIR:** 10-25% crashes, needs hardening
- **POOR:** >25% crashes, unstable

### Success Rates

- **>99%:** Excellent, production ready
- **95-99%:** Good, minor improvements recommended
- **90-95%:** Fair, review failures before production
- **<90%:** Poor, significant improvements needed

## For Your Thesis

### Key Contributions

1. **Validates ECDSA superiority** for mobile/IoT applications
2. **Demonstrates security robustness** against attacks
3. **Provides empirical performance data** (100-1000x faster than RSA)
4. **Shows production readiness** through comprehensive testing

### Recommended Sections to Include

1. **Testing Methodology:** Adversarial + Stress testing approach
2. **Performance Comparison:** ECDSA vs RSA benchmarks
3. **Security Analysis:** Attack detection validation
4. **Robustness Evaluation:** Edge case handling
5. **Production Assessment:** Deployment recommendations

### Citations from Reports

Both generated reports include:

- Executive summaries with key metrics
- Detailed analysis sections
- Comparative tables (ECDSA vs RSA)
- Thesis-ready conclusions and recommendations

## Troubleshooting

### Tests Failing?

1. Check Node.js version (>=16.0.0 required)
2. Ensure dependencies installed: `npm install`
3. Build the project first: `npm run build`
4. Check for port conflicts if running servers

### Performance Issues?

1. Close other applications
2. Run tests individually
3. Adjust test counts in test files
4. Check system resources

### Report Not Generated?

1. Check write permissions
2. Ensure `fs` module available
3. Look for console warnings
4. Check disk space

## Contributing

To add more tests:

1. Create new `.test.ts` file in `tests/` directory
2. Follow existing test structure
3. Add test script to `package.json`
4. Update this README

## License

MIT License - Same as parent project
