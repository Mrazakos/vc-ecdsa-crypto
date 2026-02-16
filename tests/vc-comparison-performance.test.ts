import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  ECDSACryptoService,
  RSACryptoService,
  PQCryptoService,
  VCIssuer,
  VCVerifier,
  CryptoService,
} from "../src";

/**
 * PERFORMANCE COMPARISON TEST
 *
 * Compares ECDSA, RSA-PSS 2048, and ML-DSA-65 algorithms
 * for Verifiable Credentials:
 *
 * 1. Key Generation Performance
 * 2. VC Issuance (Signing) Performance
 * 3. VC Verification Performance
 * 4. Size Analysis (keys, signatures, credentials)
 *
 * Results are formatted for thesis presentation.
 */

interface AlgorithmMetrics {
  name: string;
  keySize: string;
  signatureSize: number;
  keyGenTime: number[];
  signTime: number[];
  verifyTime: number[];
  credentialSize: number[];
}

interface ComparisonResults {
  timestamp: string;
  testConfig: {
    iterations: number;
  };
  algorithms: {
    ecdsa: AlgorithmMetrics;
    rsa2048: AlgorithmMetrics;
    dilithium3: AlgorithmMetrics;
  };
  summary: {
    fastest: {
      keyGen: string;
      signing: string;
      verification: string;
    };
    smallest: {
      keySize: string;
      signatureSize: string;
      credentialSize: string;
    };
  };
}

describe("Verifiable Credential Performance Comparison", () => {
  const ITERATIONS = 30;

  let results: ComparisonResults;

  beforeAll(() => {
    results = {
      timestamp: new Date().toISOString(),
      testConfig: {
        iterations: ITERATIONS,
      },
      algorithms: {
        ecdsa: {
          name: "ECDSA secp256k1",
          keySize: "256-bit (32 bytes private, 65 bytes public)",
          signatureSize: 0,
          keyGenTime: [],
          signTime: [],
          verifyTime: [],
          credentialSize: [],
        },
        rsa2048: {
          name: "RSA-PSS 2048-bit",
          keySize: "2048-bit (~1700 bytes each)",
          signatureSize: 0,
          keyGenTime: [],
          signTime: [],
          verifyTime: [],
          credentialSize: [],
        },
        dilithium3: {
          name: "ML-DSA-65 (Dilithium3)",
          keySize: "1952 bytes public, 4000 bytes secret",
          signatureSize: 0,
          keyGenTime: [],
          signTime: [],
          verifyTime: [],
          credentialSize: [],
        },
      },
      summary: {
        fastest: { keyGen: "", signing: "", verification: "" },
        smallest: { keySize: "", signatureSize: "", credentialSize: "" },
      },
    };
  });

  afterAll(() => {
    generateComparisonReport();
  });

  describe("Key Generation Performance", () => {
    test("ECDSA secp256k1 key generation", async () => {
      const crypto = new ECDSACryptoService();
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await crypto.generateIdentity();
        const end = performance.now();
        times.push(end - start);
      }

      results.algorithms.ecdsa.keyGenTime = times;
      console.log(
        `ECDSA Key Gen: ${avg(times).toFixed(3)}ms avg (${min(times).toFixed(
          2
        )}ms - ${max(times).toFixed(2)}ms)`
      );
    });

    test("RSA-PSS 2048-bit key generation", async () => {
      const crypto = new RSACryptoService(2048);
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await crypto.generateIdentity();
        const end = performance.now();
        times.push(end - start);
      }

      results.algorithms.rsa2048.keyGenTime = times;
      console.log(
        `RSA-2048 Key Gen: ${avg(times).toFixed(3)}ms avg (${min(times).toFixed(
          2
        )}ms - ${max(times).toFixed(2)}ms)`
      );
    });

    test("ML-DSA-65 key generation", async () => {
      const crypto = new PQCryptoService();
      const times: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await crypto.generateIdentity();
        const end = performance.now();
        times.push(end - start);
      }

      results.algorithms.dilithium3.keyGenTime = times;
      console.log(
        `ML-DSA-65 Key Gen: ${avg(times).toFixed(3)}ms avg (${min(
          times
        ).toFixed(2)}ms - ${max(times).toFixed(2)}ms)`
      );
    });
  });

  describe("VC Issuance (Signing) Performance", () => {
    test("ECDSA VC issuance", async () => {
      await testVCIssuance(new ECDSACryptoService(), results.algorithms.ecdsa);
    });

    test("RSA-2048 VC issuance", async () => {
      await testVCIssuance(
        new RSACryptoService(2048),
        results.algorithms.rsa2048
      );
    });

    test("ML-DSA-65 VC issuance", async () => {
      await testVCIssuance(
        new PQCryptoService(),
        results.algorithms.dilithium3
      );
    });
  });

  describe("VC Verification Performance", () => {
    test("ECDSA VC verification", async () => {
      await testVCVerification(
        new ECDSACryptoService(),
        results.algorithms.ecdsa
      );
    });

    test("RSA-2048 VC verification", async () => {
      await testVCVerification(
        new RSACryptoService(2048),
        results.algorithms.rsa2048
      );
    });

    test("ML-DSA-65 VC verification", async () => {
      await testVCVerification(
        new PQCryptoService(),
        results.algorithms.dilithium3
      );
    });
  });

  describe("Size Analysis", () => {
    test("Compare signature and credential sizes", async () => {
      await analyzeSizes(
        new ECDSACryptoService(),
        results.algorithms.ecdsa,
        "ECDSA"
      );
      await analyzeSizes(
        new RSACryptoService(2048),
        results.algorithms.rsa2048,
        "RSA-2048"
      );
      await analyzeSizes(
        new PQCryptoService(),
        results.algorithms.dilithium3,
        "ML-DSA-65"
      );

      // Determine smallest
      const sizes = [
        { name: "ECDSA", size: results.algorithms.ecdsa.signatureSize },
        { name: "RSA-2048", size: results.algorithms.rsa2048.signatureSize },
        {
          name: "ML-DSA-65",
          size: results.algorithms.dilithium3.signatureSize,
        },
      ];
      sizes.sort((a, b) => a.size - b.size);
      results.summary.smallest.signatureSize = sizes[0].name;
      results.summary.smallest.keySize = "ECDSA";
      results.summary.smallest.credentialSize = sizes[0].name;
    });
  });

  // Helper functions
  async function testVCIssuance(
    crypto: CryptoService,
    metrics: AlgorithmMetrics
  ) {
    const issuer = new VCIssuer(crypto);
    const identity = await crypto.generateIdentity();
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await issuer.issueCredential(
        { id: "did:example:issuer123", name: "Test Issuer" },
        {
          id: "did:example:user456",
          name: "Test User",
          accessLevel: "premium",
        },
        identity.privateKey,
        identity.publicKey,
        {
          credentialTypes: ["AccessControlCredential"],
          validityDays: 30,
        }
      );

      const end = performance.now();
      times.push(end - start);
    }

    metrics.signTime = times;
    console.log(
      `${metrics.name} Signing: ${avg(times).toFixed(3)}ms avg (${min(
        times
      ).toFixed(2)}ms - ${max(times).toFixed(2)}ms)`
    );
  }

  async function testVCVerification(
    crypto: CryptoService,
    metrics: AlgorithmMetrics
  ) {
    const issuer = new VCIssuer(crypto);
    const verifier = new VCVerifier(crypto);
    const identity = await crypto.generateIdentity();

    const vc = await issuer.issueCredential(
      { id: "did:example:issuer123" },
      { id: "did:example:user456", accessLevel: "premium" },
      identity.privateKey,
      identity.publicKey,
      { validityDays: 30 }
    );

    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await verifier.verifyCredential(vc, identity.publicKey, {
        checkExpiration: true,
      });

      const end = performance.now();
      times.push(end - start);
    }

    metrics.verifyTime = times;
    console.log(
      `${metrics.name} Verification: ${avg(times).toFixed(3)}ms avg (${min(
        times
      ).toFixed(2)}ms - ${max(times).toFixed(2)}ms)`
    );
  }

  async function analyzeSizes(
    crypto: CryptoService,
    metrics: AlgorithmMetrics,
    name: string
  ) {
    const issuer = new VCIssuer(crypto);
    const identity = await crypto.generateIdentity();

    const vc = await issuer.issueCredential(
      { id: "did:example:issuer123" },
      { id: "did:example:user456", accessLevel: "premium" },
      identity.privateKey,
      identity.publicKey
    );

    const proof = Array.isArray(vc.proof) ? vc.proof[0] : vc.proof;
    metrics.signatureSize = proof.proofValue.length;
    metrics.credentialSize.push(JSON.stringify(vc).length);

    console.log(`${name} Signature Size: ${metrics.signatureSize} bytes`);
    console.log(`${name} Credential Size: ${JSON.stringify(vc).length} bytes`);
  }

  function avg(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function min(arr: number[]): number {
    return Math.min(...arr);
  }

  function max(arr: number[]): number {
    return Math.max(...arr);
  }

  function median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function stdDev(arr: number[]): number {
    const mean = avg(arr);
    const variance =
      arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  function generateComparisonReport() {
    // Calculate summary statistics
    results.summary.fastest.keyGen = getFastest([
      { name: "ECDSA", time: avg(results.algorithms.ecdsa.keyGenTime) },
      { name: "RSA-2048", time: avg(results.algorithms.rsa2048.keyGenTime) },
      {
        name: "ML-DSA-65",
        time: avg(results.algorithms.dilithium3.keyGenTime),
      },
    ]);

    results.summary.fastest.signing = getFastest([
      { name: "ECDSA", time: avg(results.algorithms.ecdsa.signTime) },
      { name: "RSA-2048", time: avg(results.algorithms.rsa2048.signTime) },
      { name: "ML-DSA-65", time: avg(results.algorithms.dilithium3.signTime) },
    ]);

    results.summary.fastest.verification = getFastest([
      { name: "ECDSA", time: avg(results.algorithms.ecdsa.verifyTime) },
      { name: "RSA-2048", time: avg(results.algorithms.rsa2048.verifyTime) },
      {
        name: "ML-DSA-65",
        time: avg(results.algorithms.dilithium3.verifyTime),
      },
    ]);

    // Generate markdown report
    const report = generateMarkdownReport();

    // Save report
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const dir = join(
      __dirname,
      "..",
      "comparison-results",
      `performance-${timestamp}`
    );
    mkdirSync(dir, { recursive: true });

    writeFileSync(join(dir, "performance-report.md"), report);
    writeFileSync(join(dir, "raw-data.json"), JSON.stringify(results, null, 2));

    console.log(`\n${"=".repeat(80)}`);
    console.log("PERFORMANCE COMPARISON REPORT GENERATED");
    console.log(`${"=".repeat(80)}`);
    console.log(`Location: ${dir}`);
    console.log(`Files: performance-report.md, raw-data.json`);
    console.log(`${"=".repeat(80)}\n`);
  }

  function getFastest(items: { name: string; time: number }[]): string {
    return items.reduce((fastest, current) =>
      current.time < fastest.time ? current : fastest
    ).name;
  }

  function generateMarkdownReport(): string {
    const { algorithms, summary } = results;

    return `# Verifiable Credential Cryptographic Performance Comparison

**Date:** ${new Date(results.timestamp).toLocaleString()}  
**Test Configuration:** ${ITERATIONS} iterations per test

---

## Executive Summary

### Performance Winners

- **Fastest Key Generation:** ${summary.fastest.keyGen}
- **Fastest Signing:** ${summary.fastest.signing}
- **Fastest Verification:** ${summary.fastest.verification}

### Size Winners

- **Smallest Key Size:** ${summary.smallest.keySize}
- **Smallest Signature Size:** ${summary.smallest.signatureSize}
- **Smallest Credential Size:** ${summary.smallest.credentialSize}

---

## Detailed Performance Metrics

### Key Generation Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | ${avg(algorithms.ecdsa.keyGenTime).toFixed(3)} | ${min(
      algorithms.ecdsa.keyGenTime
    ).toFixed(2)} | ${max(algorithms.ecdsa.keyGenTime).toFixed(2)} | ${median(
      algorithms.ecdsa.keyGenTime
    ).toFixed(2)} | ${stdDev(algorithms.ecdsa.keyGenTime).toFixed(2)} |
| RSA-PSS 2048 | ${avg(algorithms.rsa2048.keyGenTime).toFixed(3)} | ${min(
      algorithms.rsa2048.keyGenTime
    ).toFixed(2)} | ${max(algorithms.rsa2048.keyGenTime).toFixed(2)} | ${median(
      algorithms.rsa2048.keyGenTime
    ).toFixed(2)} | ${stdDev(algorithms.rsa2048.keyGenTime).toFixed(2)} |
| ML-DSA-65 | ${avg(algorithms.dilithium3.keyGenTime).toFixed(3)} | ${min(
      algorithms.dilithium3.keyGenTime
    ).toFixed(2)} | ${max(algorithms.dilithium3.keyGenTime).toFixed(
      2
    )} | ${median(algorithms.dilithium3.keyGenTime).toFixed(2)} | ${stdDev(
      algorithms.dilithium3.keyGenTime
    ).toFixed(2)} |

### VC Issuance (Signing) Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | ${avg(algorithms.ecdsa.signTime).toFixed(3)} | ${min(
      algorithms.ecdsa.signTime
    ).toFixed(2)} | ${max(algorithms.ecdsa.signTime).toFixed(2)} | ${median(
      algorithms.ecdsa.signTime
    ).toFixed(2)} | ${stdDev(algorithms.ecdsa.signTime).toFixed(2)} |
| RSA-PSS 2048 | ${avg(algorithms.rsa2048.signTime).toFixed(3)} | ${min(
      algorithms.rsa2048.signTime
    ).toFixed(2)} | ${max(algorithms.rsa2048.signTime).toFixed(2)} | ${median(
      algorithms.rsa2048.signTime
    ).toFixed(2)} | ${stdDev(algorithms.rsa2048.signTime).toFixed(2)} |
| ML-DSA-65 | ${avg(algorithms.dilithium3.signTime).toFixed(3)} | ${min(
      algorithms.dilithium3.signTime
    ).toFixed(2)} | ${max(algorithms.dilithium3.signTime).toFixed(
      2
    )} | ${median(algorithms.dilithium3.signTime).toFixed(2)} | ${stdDev(
      algorithms.dilithium3.signTime
    ).toFixed(2)} |

### VC Verification Performance

| Algorithm | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Std Dev |
|-----------|----------|----------|----------|-------------|---------|
| ECDSA secp256k1 | ${avg(algorithms.ecdsa.verifyTime).toFixed(3)} | ${min(
      algorithms.ecdsa.verifyTime
    ).toFixed(2)} | ${max(algorithms.ecdsa.verifyTime).toFixed(2)} | ${median(
      algorithms.ecdsa.verifyTime
    ).toFixed(2)} | ${stdDev(algorithms.ecdsa.verifyTime).toFixed(2)} |
| RSA-PSS 2048 | ${avg(algorithms.rsa2048.verifyTime).toFixed(3)} | ${min(
      algorithms.rsa2048.verifyTime
    ).toFixed(2)} | ${max(algorithms.rsa2048.verifyTime).toFixed(2)} | ${median(
      algorithms.rsa2048.verifyTime
    ).toFixed(2)} | ${stdDev(algorithms.rsa2048.verifyTime).toFixed(2)} |
| ML-DSA-65 | ${avg(algorithms.dilithium3.verifyTime).toFixed(3)} | ${min(
      algorithms.dilithium3.verifyTime
    ).toFixed(2)} | ${max(algorithms.dilithium3.verifyTime).toFixed(
      2
    )} | ${median(algorithms.dilithium3.verifyTime).toFixed(2)} | ${stdDev(
      algorithms.dilithium3.verifyTime
    ).toFixed(2)} |

---

## Size Analysis

### Key Sizes

| Algorithm | Key Size |
|-----------|----------|
| ECDSA secp256k1 | ${algorithms.ecdsa.keySize} |
| RSA-PSS 2048 | ${algorithms.rsa2048.keySize} |
| ML-DSA-65 | ${algorithms.dilithium3.keySize} |

### Signature Sizes

| Algorithm | Signature Size (bytes) |
|-----------|------------------------|
| ECDSA secp256k1 | ${algorithms.ecdsa.signatureSize} |
| RSA-PSS 2048 | ${algorithms.rsa2048.signatureSize} |
| ML-DSA-65 | ${algorithms.dilithium3.signatureSize} |

### Average Credential Sizes

| Algorithm | Avg Credential Size (bytes) |
|-----------|------------------------------|
| ECDSA secp256k1 | ${Math.round(avg(algorithms.ecdsa.credentialSize))} |
| RSA-PSS 2048 | ${Math.round(avg(algorithms.rsa2048.credentialSize))} |
| ML-DSA-65 | ${Math.round(avg(algorithms.dilithium3.credentialSize))} |

---

## Analysis for Thesis

### Performance Trade-offs

1. **ECDSA secp256k1**
   - Extremely fast signing (${avg(algorithms.ecdsa.signTime).toFixed(2)}ms avg)
   - Smallest signatures (${algorithms.ecdsa.signatureSize} bytes)
   - Vulnerable to quantum attacks (future risk)
   - Best for current mobile/IoT deployments

2. **RSA-PSS 2048**
   - Slower signing (${avg(algorithms.rsa2048.signTime).toFixed(2)}ms avg)
   - Moderate signature size (${algorithms.rsa2048.signatureSize} bytes)
   - Also vulnerable to quantum attacks
   - Industry standard, widely trusted

3. **ML-DSA-65 (Post-Quantum)**
   - Fast signing (${avg(algorithms.dilithium3.signTime).toFixed(2)}ms avg)
   - Largest signatures (${algorithms.dilithium3.signatureSize} bytes)
   - Quantum-resistant (future-proof)
   - NIST standardized (FIPS 204)

### Recommendations by Use Case

- **Mobile/IoT Access Control (Current):** ECDSA secp256k1
- **Enterprise PKI (Current):** RSA-PSS 2048
- **Long-term Archival (10+ years):** ML-DSA-65
- **Hybrid Systems:** ECDSA + ML-DSA-65 dual signatures

---

**Raw Data:** See \`raw-data.json\` for complete timing measurements.
`;
  }
});
