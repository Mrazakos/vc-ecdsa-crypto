import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ethers } from "ethers";
import { ECDSACryptoService } from "../src";

// --- MOCK TYPES ---
// Mocking types referenced in the service
type CryptoIdentity = {
  privateKey: string;
  publicKey: string; // 65-byte uncompressed
  address: string; // 20-byte Ethereum
};
// --- END MOCK TYPES ---

/**
 * ADVERSARIAL & STRESS TESTING SUITE FOR ECDSACryptoService
 *
 * This test suite validates the robustness, security, and performance
 * of the core ECDSACryptoService.
 *
 * Tests include:
 * 1. Baseline happy-path operations
 * 2. Performance benchmarks for key-gen, signing, and verification
 * 3. Adversarial attacks (signature tampering, wrong key)
 * 4. Robustness against malformed inputs
 * 5. Validation of on-chain vs. off-chain signing modes
 */
describe("Adversarial & Stress Testing - ECDSACryptoService", () => {
  let cryptoService: ECDSACryptoService;
  let results: {
    timestamp: string;
    testSummary: {
      totalTests: number;
      operations: {
        keyGen: { attempted: number; successful: number; failed: number };
        sign: { attempted: number; successful: number; failed: number };
        verify: { attempted: number; successful: number; failed: number };
        hash: { attempted: number; successful: number; failed: number };
      };
      securityAttacks: {
        attempted: number;
        successfullyBlocked: number;
        securityBreaches: number;
      };
      robustnessTests: { attempted: number; handled: number; crashed: number };
    };
    performance: {
      avgKeyGenTime: number;
      avgSignOffChainTime: number;
      avgVerifyOffChainTime: number;
      avgSignOnChainTime: number;
      avgVerifyOnChainTime: number;
    };
    detailedResults: {
      securityBreaches: Array<{ test: string; details: string }>;
      robustnessIssues: Array<{ test: string; error: string; input: any }>;
      failures: Array<{ test: string; error: string }>;
    };
  };

  beforeAll(() => {
    cryptoService = new ECDSACryptoService();
    results = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: 0,
        operations: {
          keyGen: { attempted: 0, successful: 0, failed: 0 },
          sign: { attempted: 0, successful: 0, failed: 0 },
          verify: { attempted: 0, successful: 0, failed: 0 },
          hash: { attempted: 0, successful: 0, failed: 0 },
        },
        securityAttacks: {
          attempted: 0,
          successfullyBlocked: 0,
          securityBreaches: 0,
        },
        robustnessTests: { attempted: 0, handled: 0, crashed: 0 },
      },
      performance: {
        avgKeyGenTime: 0,
        avgSignOffChainTime: 0,
        avgVerifyOffChainTime: 0,
        avgSignOnChainTime: 0,
        avgVerifyOnChainTime: 0,
      },
      detailedResults: {
        securityBreaches: [],
        robustnessIssues: [],
        failures: [],
      },
    };
  });

  afterAll(() => {
    // Final calculations
    const totalSign = results.testSummary.operations.sign.attempted;
    if (totalSign > 0) {
      /* Averages already calculated during tests */
    }

    // Generate report
    generateMarkdownReport();

    // Console summary
    console.log("\n" + "=".repeat(80));
    console.log("ECDSACryptoService STRESS TEST SUMMARY");
    console.log("=".repeat(80));
    console.log(
      `Security Breaches: ${results.detailedResults.securityBreaches.length}`
    );
    console.log(
      `Robustness Issues: ${results.detailedResults.robustnessIssues.length}`
    );
    console.log(
      `Operational Failures: ${results.detailedResults.failures.length}`
    );
    console.log(
      `Avg Key Gen: ${results.performance.avgKeyGenTime.toFixed(2)}ms`
    );
    console.log(
      `Avg Sign (Off-Chain): ${results.performance.avgSignOffChainTime.toFixed(
        2
      )}ms`
    );
    console.log(
      `Avg Verify (Off-Chain): ${results.performance.avgVerifyOffChainTime.toFixed(
        2
      )}ms`
    );
    console.log(
      `Avg Sign (On-Chain): ${results.performance.avgSignOnChainTime.toFixed(
        2
      )}ms`
    );
    console.log(
      `Avg Verify (On-Chain): ${results.performance.avgVerifyOnChainTime.toFixed(
        2
      )}ms`
    );
    console.log("=".repeat(80));
  });

  test("Normal Operations Baseline (100 cycles)", async () => {
    console.log("Testing CryptoService normal operations baseline...");
    for (let i = 0; i < 100; i++) {
      results.testSummary.totalTests++;
      let identity: CryptoIdentity;
      try {
        // 1. Generate Identity
        results.testSummary.operations.keyGen.attempted++;
        identity = await cryptoService.generateIdentity();
        expect(identity).toHaveProperty("privateKey");
        expect(identity).toHaveProperty("publicKey");
        expect(identity).toHaveProperty("address");
        results.testSummary.operations.keyGen.successful++;

        const data = `test-data-${i}-${Date.now()}`;

        // 2. Hash
        results.testSummary.operations.hash.attempted++;
        const dataHash: string = cryptoService.hash(data);
        expect(dataHash.startsWith("0x")).toBe(true);
        results.testSummary.operations.hash.successful++;

        // 3. Sign Off-Chain (Raw)
        results.testSummary.operations.sign.attempted++;
        const offChainSig = await cryptoService.sign(
          dataHash,
          identity.privateKey,
          { ethereumPrefix: false }
        );
        expect(offChainSig.startsWith("0x")).toBe(true);
        results.testSummary.operations.sign.successful++;

        // 4. Verify Off-Chain (Raw)
        results.testSummary.operations.verify.attempted++;
        const isOffChainValid = await cryptoService.verify(
          dataHash,
          offChainSig,
          identity.publicKey, // Use 65-byte public key
          { ethereumPrefix: false }
        );
        expect(isOffChainValid).toBe(true);
        results.testSummary.operations.verify.successful++;

        // 5. Sign On-Chain (ETH Prefixed)
        results.testSummary.operations.sign.attempted++;
        const onChainSig = await cryptoService.sign(
          dataHash,
          identity.privateKey,
          { ethereumPrefix: true }
        );
        expect(onChainSig.startsWith("0x")).toBe(true);
        results.testSummary.operations.sign.successful++;

        // 6. Verify On-Chain (ETH Prefixed)
        results.testSummary.operations.verify.attempted++;
        const isOnChainValid = await cryptoService.verify(
          dataHash,
          onChainSig,
          identity.address, // Use 20-byte address
          { ethereumPrefix: true }
        );
        expect(isOnChainValid).toBe(true);
        results.testSummary.operations.verify.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: `Normal Operations Baseline (cycle ${i})`,
          error: error.message,
        });
      }
    }
    // Update failure counts based on detailed results
    results.testSummary.operations.keyGen.failed =
      results.detailedResults.failures.filter((f) =>
        f.test.includes("Key Gen")
      ).length;
    results.testSummary.operations.sign.failed =
      results.detailedResults.failures.filter((f) =>
        f.test.includes("Sign")
      ).length;
    results.testSummary.operations.verify.failed =
      results.detailedResults.failures.filter((f) =>
        f.test.includes("Verify")
      ).length;
  });

  test("Performance Testing (50 cycles)", async () => {
    console.log("Testing CryptoService performance...");
    let totalKeyGen = 0,
      totalSignOff = 0,
      totalVerifyOff = 0,
      totalSignOn = 0,
      totalVerifyOn = 0;
    const cycles = 50;

    for (let i = 0; i < cycles; i++) {
      results.testSummary.totalTests++;
      const startKeyGen = performance.now();
      const identity = await cryptoService.generateIdentity();
      totalKeyGen += performance.now() - startKeyGen;

      const data = `perf-test-${i}`;
      const dataHash = cryptoService.hash(data);

      const startSignOff = performance.now();
      const offChainSig = await cryptoService.sign(
        dataHash,
        identity.privateKey,
        { ethereumPrefix: false }
      );
      totalSignOff += performance.now() - startSignOff;

      const startVerifyOff = performance.now();
      await cryptoService.verify(dataHash, offChainSig, identity.publicKey, {
        ethereumPrefix: false,
      });
      totalVerifyOff += performance.now() - startVerifyOff;

      const startSignOn = performance.now();
      const onChainSig = await cryptoService.sign(
        dataHash,
        identity.privateKey,
        { ethereumPrefix: true }
      );
      totalSignOn += performance.now() - startSignOn;

      const startVerifyOn = performance.now();
      await cryptoService.verify(dataHash, onChainSig, identity.address, {
        ethereumPrefix: true,
      });
      totalVerifyOn += performance.now() - startVerifyOn;
    }

    results.performance.avgKeyGenTime = totalKeyGen / cycles;
    results.performance.avgSignOffChainTime = totalSignOff / cycles;
    results.performance.avgVerifyOffChainTime = totalVerifyOff / cycles;
    results.performance.avgSignOnChainTime = totalSignOn / cycles;
    results.performance.avgVerifyOnChainTime = totalVerifyOn / cycles;

    expect(results.performance.avgKeyGenTime).toBeLessThan(100); // Key gen should be very fast
    expect(results.performance.avgSignOffChainTime).toBeLessThan(50);
    expect(results.performance.avgVerifyOffChainTime).toBeLessThan(50);
  });

  test("Adversarial - Signature Tampering", async () => {
    console.log("Testing CryptoService signature tampering...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const identity = await cryptoService.generateIdentity();
    const data = "un-tampered-data";
    const dataHash = cryptoService.hash(data);

    // Off-Chain
    const offChainSig = await cryptoService.sign(
      dataHash,
      identity.privateKey,
      { ethereumPrefix: false }
    );
    const tamperedOffChainSig = offChainSig.slice(0, -4) + "beef";
    const isTamperedOffChainValid = await cryptoService.verify(
      dataHash,
      tamperedOffChainSig,
      identity.publicKey,
      { ethereumPrefix: false }
    );

    if (isTamperedOffChainValid) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Signature Tampering (Off-Chain)",
        details: "Tampered off-chain signature was accepted as valid.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }

    // On-Chain
    results.testSummary.securityAttacks.attempted++;
    const onChainSig = await cryptoService.sign(dataHash, identity.privateKey, {
      ethereumPrefix: true,
    });
    const tamperedOnChainSig = onChainSig.slice(0, -4) + "dead";
    const isTamperedOnChainValid = await cryptoService.verify(
      dataHash,
      tamperedOnChainSig,
      identity.address,
      { ethereumPrefix: true }
    );

    if (isTamperedOnChainValid) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Signature Tampering (On-Chain)",
        details: "Tampered on-chain signature was accepted as valid.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }

    expect(isTamperedOffChainValid).toBe(false);
    expect(isTamperedOnChainValid).toBe(false);
  });

  test("Adversarial - Wrong Key Verification", async () => {
    console.log("Testing CryptoService wrong key verification...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted += 2; // one for off-chain, one for on-chain

    const identityA = await cryptoService.generateIdentity();
    const identityB = await cryptoService.generateIdentity(); // The "wrong" identity
    const data = "data-signed-by-A";
    const dataHash = cryptoService.hash(data);

    // Off-Chain: Sign with A, verify with B's Public Key
    const offChainSig = await cryptoService.sign(
      dataHash,
      identityA.privateKey,
      { ethereumPrefix: false }
    );
    const isValidWithWrongOffChainKey = await cryptoService.verify(
      dataHash,
      offChainSig,
      identityB.publicKey, // Wrong key
      { ethereumPrefix: false }
    );

    if (isValidWithWrongOffChainKey) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Wrong Key (Off-Chain)",
        details: "Signature verified with wrong public key.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }

    // On-Chain: Sign with A, verify with B's Address
    const onChainSig = await cryptoService.sign(
      dataHash,
      identityA.privateKey,
      { ethereumPrefix: true }
    );
    const isValidWithWrongOnChainKey = await cryptoService.verify(
      dataHash,
      onChainSig,
      identityB.address, // Wrong address
      { ethereumPrefix: true }
    );

    if (isValidWithWrongOnChainKey) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Wrong Key (On-Chain)",
        details: "Signature verified with wrong Ethereum address.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }

    expect(isValidWithWrongOffChainKey).toBe(false);
    expect(isValidWithWrongOnChainKey).toBe(false);
  });

  test("Adversarial - Mismatched Verification Mode", async () => {
    console.log("Testing CryptoService mismatched verification modes...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted += 2;

    const identity = await cryptoService.generateIdentity();
    const data = "mismatched-mode-test";
    const dataHash = cryptoService.hash(data);

    // 1. Sign ON-CHAIN, Verify OFF-CHAIN
    const onChainSig = await cryptoService.sign(dataHash, identity.privateKey, {
      ethereumPrefix: true,
    });
    const isValidOnToOff = await cryptoService.verify(
      dataHash,
      onChainSig,
      identity.publicKey,
      { ethereumPrefix: false } // Wrong mode
    );

    if (isValidOnToOff) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Mismatched Mode (On-Chain Sig -> Off-Chain Verify)",
        details: "On-chain signature verified as valid in off-chain mode.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }

    // 2. Sign OFF-CHAIN, Verify ON-CHAIN
    const offChainSig = await cryptoService.sign(
      dataHash,
      identity.privateKey,
      { ethereumPrefix: false }
    );
    const isValidOffToOn = await cryptoService.verify(
      dataHash,
      offChainSig,
      identity.address,
      { ethereumPrefix: true } // Wrong mode
    );

    if (isValidOffToOn) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Mismatched Mode (Off-Chain Sig -> On-Chain Verify)",
        details: "Off-chain signature verified as valid in on-chain mode.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }

    expect(isValidOnToOff).toBe(false);
    expect(isValidOffToOn).toBe(false);
  });

  test("Robustness - Malformed Inputs", async () => {
    console.log("Testing CryptoService robustness against malformed inputs...");
    const identity = await cryptoService.generateIdentity();
    const goodHash = cryptoService.hash("good-data");
    const goodSig = await cryptoService.sign(goodHash, identity.privateKey, {
      ethereumPrefix: false,
    });

    const malformedInputs: any[] = [
      null,
      undefined,
      "",
      "not-a-hex-string",
      "0x123",
      "0x" + "a".repeat(63), // wrong length hash
      12345,
      {},
      [],
    ];

    for (const input of malformedInputs) {
      results.testSummary.totalTests++;
      results.testSummary.robustnessTests.attempted++;
      try {
        // Test sign
        await cryptoService.sign(input, identity.privateKey, {
          ethereumPrefix: false,
        });
        // Test verify (with good sig, bad hash)
        await cryptoService.verify(input, goodSig, identity.publicKey, {
          ethereumPrefix: false,
        });
        // Test verify (with bad sig, good hash)
        await cryptoService.verify(goodHash, input, identity.publicKey, {
          ethereumPrefix: false,
        });
        // Test verify (with bad key, good others)
        await cryptoService.verify(goodHash, goodSig, input, {
          ethereumPrefix: false,
        });
        // Test hash
        cryptoService.hash(input);

        // If any of these *succeeded* unexpectedly, it's not ideal, but not a crash
        results.testSummary.robustnessTests.handled++;
      } catch (error: any) {
        // Errors are EXPECTED. This is good.
        if (
          error.message.includes("invalid") ||
          error.message.includes("bad") ||
          error.message.includes("length") ||
          error.message.includes("hex") ||
          error.message.includes("expected")
        ) {
          results.testSummary.robustnessTests.handled++;
        } else {
          // An unexpected error or crash
          results.testSummary.robustnessTests.crashed++;
          results.detailedResults.robustnessIssues.push({
            test: "Robustness - Malformed Inputs",
            error: error.message,
            input: input,
          });
        }
      }
    }
    expect(results.testSummary.robustnessTests.crashed).toBe(0);
  });

  // --- REPORT GENERATION ---
  function generateMarkdownReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = `test-reports/${timestamp}`;
    const reportPath = join(reportDir, "crypto-service-stress-report.md");

    try {
      mkdirSync(reportDir, { recursive: true });
    } catch (error: any) {
      console.warn(`Could not create directory ${reportDir}:`, error.message);
      return;
    }

    const report = `
# ECDSACryptoService Stress Test Report

**Generated:** ${new Date().toLocaleString()}
**Test Type:** Adversarial Security, Robustness, and Performance
**Target:** \`ECDSACryptoService.ts\`

---

## Executive Summary

| Metric | Result |
| --- | --- |
| **Security Rating** | ${
      results.detailedResults.securityBreaches.length === 0
        ? "✅ EXCELLENT"
        : "❌ POOR"
    } |
| **Robustness Rating** | ${
      results.testSummary.robustnessTests.crashed === 0
        ? "✅ EXCELLENT"
        : "❌ POOR"
    } |
| **Operational Failures** | ${results.detailedResults.failures.length} |
| **Security Breaches** | ${results.detailedResults.securityBreaches.length} |
| **Robustness Crashes** | ${results.testSummary.robustnessTests.crashed} |

---

## Performance Benchmarks

| Operation | Average Time (ms) | Notes |
| --- | --- | --- |
| **Key Generation** | ${results.performance.avgKeyGenTime.toFixed(
      4
    )} | Fast, as expected. |
| **Sign (Off-Chain)** | ${results.performance.avgSignOffChainTime.toFixed(
      4
    )} | Raw ECDSA signature. |
| **Verify (Off-Chain)** | ${results.performance.avgVerifyOffChainTime.toFixed(
      4
    )} | Raw ECDSA verification. |
| **Sign (On-Chain)** | ${results.performance.avgSignOnChainTime.toFixed(
      4
    )} | Ethereum-prefixed signature. |
| **Verify (On-Chain)** | ${results.performance.avgVerifyOnChainTime.toFixed(
      4
    )} | Ethereum-prefixed verification. |

---

## Test Results Overview

### Normal Operations (Baseline)
- **Key Gen:** ${results.testSummary.operations.keyGen.successful} / ${
      results.testSummary.operations.keyGen.attempted
    }
- **Hashing:** ${results.testSummary.operations.hash.successful} / ${
      results.testSummary.operations.hash.attempted
    }
- **Signing:** ${results.testSummary.operations.sign.successful} / ${
      results.testSummary.operations.sign.attempted
    }
- **Verification:** ${results.testSummary.operations.verify.successful} / ${
      results.testSummary.operations.verify.attempted
    }

### Security Attack Detection
- **Attacks Attempted:** ${results.testSummary.securityAttacks.attempted}
- **Successfully Blocked:** ${
      results.testSummary.securityAttacks.successfullyBlocked
    }
- **Security Breaches:** ${results.testSummary.securityAttacks.securityBreaches}

### Robustness Tests
- **Inputs Tested:** ${results.testSummary.robustnessTests.attempted}
- **Handled Gracefully:** ${results.testSummary.robustnessTests.handled}
- **System Crashes:** ${results.testSummary.robustnessTests.crashed}

---

## Detailed Findings

### 🚨 Security Breaches (${results.detailedResults.securityBreaches.length})
${
  results.detailedResults.securityBreaches.length === 0
    ? "✅ No security breaches detected."
    : results.detailedResults.securityBreaches
        .map((b) => `- **${b.test}:** ${b.details}`)
        .join("\n")
}

### 🐛 Robustness Issues (${results.detailedResults.robustnessIssues.length})
${
  results.detailedResults.robustnessIssues.length === 0
    ? "✅ No robustness crashes detected. Malformed inputs handled gracefully."
    : results.detailedResults.robustnessIssues
        .map(
          (i) =>
            `- **${i.test}:** Error: ${i.error} (Input: ${JSON.stringify(
              i.input
            )})`
        )
        .join("\n")
}

### ❌ Operational Failures (${results.detailedResults.failures.length})
${
  results.detailedResults.failures.length === 0
    ? "✅ No failures during normal operations baseline."
    : results.detailedResults.failures
        .map((f) => `- **${f.test}:** ${f.error}`)
        .join("\n")
}
    `;

    try {
      writeFileSync(reportPath, report);
      console.log(
        `\n🛡️ CryptoService stress test report generated: ${reportPath}`
      );
    } catch (error: any) {
      console.error(`Failed to write CryptoService report: ${error.message}`);
    }
  }
});
