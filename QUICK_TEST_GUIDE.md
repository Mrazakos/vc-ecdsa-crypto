# Quick Start: Running the Test Suite

## Step 1: Install Dependencies

```powershell
npm install
```

This will install:

- Jest (testing framework)
- ts-jest (TypeScript support)
- @types/jest (TypeScript definitions)

## Step 2: Run Tests

### Option A: Run All Tests

```powershell
npm test
```

### Option B: Run Specific Tests

**Adversarial Security Tests** (validate attack detection):

```powershell
npm run test:adversarial
```

**Comprehensive Stress Tests** (2000+ operations):

```powershell
npm run test:stress
```

**Original Example Test** (quick validation):

```powershell
npm run test:example
```

## Step 3: Check Results

### Console Output

You'll see real-time progress:

```
ADVERSARIAL ECDSA CRYPTOGRAPHIC TESTING SUMMARY
================================================================================
Security Rating: EXCELLENT
Robustness Rating: EXCELLENT
Production Readiness: READY
Security Breaches: 0
Performance Issues: 0
================================================================================
```

### Generated Reports

**Adversarial Security Report:**

```
📁 adversarial-test-results-[timestamp]/
   └── adversarial-security-report-ecdsa.md
```

**Comprehensive Stress Test Report:**

```
📁 stress-test-results-[timestamp]/
   └── comprehensive-stress-test-report.md
```

## Expected Test Duration

- **Adversarial Tests:** ~30-60 seconds
- **Stress Tests:** ~60-120 seconds (2000+ operations)
- **Example Test:** ~1 second

## What You Should See

### ✅ Successful Test Run

```
PASS  tests/adversarial-security.test.ts
  ✓ Signature Tampering Attack Detection (2456ms)
  ✓ Wrong Key Attack Detection (1234ms)
  ✓ Data Tampering Attack Detection (1678ms)
  ✓ Robustness Against Malformed Input (543ms)
  ✓ Performance Under Stress - ECDSA Speed Test (2345ms)
  ✓ Normal Operations Baseline - ECDSA (4567ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

### ✅ Performance Metrics

```
Average performance - KeyGen: 5.23ms, Sign: 12.45ms, Verify: 8.12ms
```

### ✅ Security Validation

```
Security Rating: EXCELLENT
✅ No security vulnerabilities detected - all attacks properly blocked
✅ ECDSA performance excellent - 100-1000x faster than RSA verified
```

## Troubleshooting

### Issue: Tests fail to start

**Solution:** Ensure you've run `npm install` first

### Issue: "Cannot find module"

**Solution:**

```powershell
npm run build
npm test
```

### Issue: Tests timeout

**Solution:** Tests have 60s timeout. If they still timeout:

- Close other applications
- Check system resources
- Run tests individually

### Issue: TypeScript errors

**Solution:** These are just lint warnings. Tests will still run:

```powershell
# Ignore warnings and run anyway
npm test
```

## For Your Thesis

After tests complete:

1. ✅ Open the generated markdown reports
2. ✅ Review the "Thesis Insights" sections
3. ✅ Copy performance comparison tables
4. ✅ Include security analysis results
5. ✅ Reference production readiness assessment

## Report Contents

Each report includes:

- **Executive Summary** - Key metrics at a glance
- **Performance Analysis** - ECDSA vs RSA comparison
- **Security Analysis** - Attack detection results
- **Robustness Analysis** - Edge case handling
- **Thesis Contributions** - Ready-to-cite findings
- **Production Recommendations** - Deployment guidance

---

Need help? Check `tests/README.md` for detailed documentation.
