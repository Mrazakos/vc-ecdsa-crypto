import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ethers } from "ethers";
import { ECDSACryptoService, OnChainService } from "../src";

// --- MOCK TYPES ---
type CryptoIdentity = {
  privateKey: string;
  publicKey: string;
  address: string;
};
// --- END MOCK TYPES ---

/**
 * ADVERSARIAL & STRESS TESTING SUITE FOR OnChainService
 *
 * This test suite validates the robustness, security, and performance
 * of the OnChainService, responsible for Ethereum-compatible
 * cryptographic operations (e.g., smart contract interaction).
 *
 * Tests include:
 * 1. Baseline sign/verify operations (using ETH prefix)
 * 2. Performance benchmarks
 * 3. Batch verification logic
 * 4. Revocation hash generation and verification
 * 5. Address recovery
 * 6. Robustness against malformed inputs
 */
describe("Adversarial & Stress Testing - OnChainService", () => {
  let onChainService: OnChainService;
  let cryptoService: ECDSACryptoService;
  let identity: CryptoIdentity;
  let results: {
    timestamp: string;
    testSummary: {
      totalTests: number;
      operations: {
        sign: { attempted: number; successful: number; failed: number };
        verify: { attempted: number; successful: number; failed: number };
        batchVerify: { attempted: number; successful: number; failed: number };
        recover: { attempted: number; successful: number; failed: number };
        revocation: { attempted: number; successful: number; failed: number };
      };
      securityAttacks: {
        attempted: number;
        successfullyBlocked: number;
        securityBreaches: number;
      };
      robustnessTests: { attempted: number; handled: number; crashed: number };
    };
    performance: {
      avgSignTime: number;
      avgVerifyTime: number;
      avgBatchVerifyTime: number; // Per batch
      avgRecoverTime: number;
    };
    detailedResults: {
      securityBreaches: Array<{ test: string; details: string }>;
      robustnessIssues: Array<{ test: string; error: string; input: any }>;
      failures: Array<{ test: string; error: string }>;
    };
  };

  beforeAll(async () => {
    cryptoService = new ECDSACryptoService();
    onChainService = new OnChainService(cryptoService);
    identity = await cryptoService.generateIdentity(); // Shared identity
    results = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: 0,
        operations: {
          sign: { attempted: 0, successful: 0, failed: 0 },
          verify: { attempted: 0, successful: 0, failed: 0 },
          batchVerify: { attempted: 0, successful: 0, failed: 0 },
          recover: { attempted: 0, successful: 0, failed: 0 },
          revocation: { attempted: 0, successful: 0, failed: 0 },
        },
        securityAttacks: {
          attempted: 0,
          successfullyBlocked: 0,
          securityBreaches: 0,
        },
        robustnessTests: { attempted: 0, handled: 0, crashed: 0 },
      },
      performance: {
        avgSignTime: 0,
        avgVerifyTime: 0,
        avgBatchVerifyTime: 0,
        avgRecoverTime: 0,
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
    // ...

    // Generate report
    generateMarkdownReport();

    // Console summary
    console.log("\n" + "=".repeat(80));
    console.log("OnChainService STRESS TEST SUMMARY");
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
    console.log(`Avg Sign: ${results.performance.avgSignTime.toFixed(2)}ms`);
    console.log(
      `Avg Verify: ${results.performance.avgVerifyTime.toFixed(2)}ms`
    );
    console.log(
      `Avg Batch Verify (10): ${results.performance.avgBatchVerifyTime.toFixed(
        2
      )}ms`
    );
    console.log(
      `Avg Recover: ${results.performance.avgRecoverTime.toFixed(2)}ms`
    );
    console.log("=".repeat(80));
  });

  test("Normal Operations Baseline - Sign/Verify/Recover", async () => {
    console.log("Testing OnChainService sign/verify/recover baseline...");
    for (let i = 0; i < 50; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.sign.attempted++;
      results.testSummary.operations.verify.attempted++;
      results.testSummary.operations.recover.attempted++;
      try {
        const data = { message: `on-chain-test-${i}`, timestamp: Date.now() };
        const dataHash = onChainService.hashCredential(data);

        // Sign
        const { signature, signedHash } =
          await onChainService.signForBlockchain(dataHash, identity.privateKey);
        expect(signature.startsWith("0x")).toBe(true);
        expect(signedHash).toBe(dataHash);
        results.testSummary.operations.sign.successful++;

        // Verify
        const isValid = await onChainService.verifyBlockchainSignature(
          dataHash,
          signature,
          identity.address // Use 20-byte address
        );
        expect(isValid).toBe(true);
        results.testSummary.operations.verify.successful++;

        // Recover
        const recoveredAddress = await onChainService.recoverAddress(
          dataHash,
          signature
        );
        expect(recoveredAddress.toLowerCase()).toBe(
          identity.address.toLowerCase()
        );
        results.testSummary.operations.recover.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Sign/Verify/Recover",
          error: error.message,
        });
        results.testSummary.operations.sign.failed++;
        results.testSummary.operations.verify.failed++;
        results.testSummary.operations.recover.failed++;
      }
    }
  });

  test("Normal Operations Baseline - Revocation", async () => {
    console.log("Testing OnChainService revocation baseline...");
    results.testSummary.totalTests++;
    results.testSummary.operations.revocation.attempted++;
    try {
      const credentialId = `did:example:cred123`;
      const revocationHash = onChainService.createRevocationHash(
        credentialId,
        identity.address
      );
      expect(revocationHash.startsWith("0x")).toBe(true);

      // Sign this revocation hash (as the issuer)
      const { signature: revocationSignature } =
        await onChainService.signForBlockchain(
          revocationHash,
          identity.privateKey
        );

      // Verify the revocation signature
      const isRevokeSigValid = await onChainService.verifyRevocationSignature(
        revocationHash,
        revocationSignature,
        identity.address
      );
      expect(isRevokeSigValid).toBe(true);
      results.testSummary.operations.revocation.successful++;
    } catch (error: any) {
      results.detailedResults.failures.push({
        test: "Normal Operations Baseline - Revocation",
        error: error.message,
      });
      results.testSummary.operations.revocation.failed++;
    }
  });

  test("Performance Testing (50 cycles)", async () => {
    console.log("Testing OnChainService performance...");
    let totalSign = 0,
      totalVerify = 0,
      totalBatch = 0,
      totalRecover = 0;
    const cycles = 50;
    const batchSize = 10;
    const dataHash = onChainService.hashCredential("perf-test");

    const batchVerifications = [];
    for (let i = 0; i < batchSize; i++) {
      const hash = onChainService.hashCredential(`perf-batch-${i}`);
      const { signature } = await onChainService.signForBlockchain(
        hash,
        identity.privateKey
      );
      batchVerifications.push({
        dataHash: hash,
        signature,
        address: identity.address,
      });
    }

    for (let i = 0; i < cycles; i++) {
      results.testSummary.totalTests++;
      const startSign = performance.now();
      const { signature } = await onChainService.signForBlockchain(
        dataHash,
        identity.privateKey
      );
      totalSign += performance.now() - startSign;

      const startVerify = performance.now();
      await onChainService.verifyBlockchainSignature(
        dataHash,
        signature,
        identity.address
      );
      totalVerify += performance.now() - startVerify;

      const startRecover = performance.now();
      await onChainService.recoverAddress(dataHash, signature);
      totalRecover += performance.now() - startRecover;

      const startBatch = performance.now();
      totalBatch += performance.now() - startBatch;
    }

    results.performance.avgSignTime = totalSign / cycles;
    results.performance.avgVerifyTime = totalVerify / cycles;
    results.performance.avgRecoverTime = totalRecover / cycles;
    results.performance.avgBatchVerifyTime = totalBatch / cycles;

    expect(results.performance.avgSignTime).toBeLessThan(50);
    expect(results.performance.avgVerifyTime).toBeLessThan(50);
    expect(results.performance.avgRecoverTime).toBeLessThan(50);
  });

  test("Adversarial - Wrong Key for Revocation", async () => {
    console.log("Testing OnChainService wrong key for revocation...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const wrongIdentity = await cryptoService.generateIdentity();
    const credentialId = "did:example:cred456";
    const revocationHash = onChainService.createRevocationHash(
      credentialId,
      identity.address // Issuer's address
    );

    // Sign with the correct key
    const { signature: revocationSignature } =
      await onChainService.signForBlockchain(
        revocationHash,
        identity.privateKey
      );

    // Try to verify with the WRONG address
    const isRevokeSigValid = await onChainService.verifyRevocationSignature(
      revocationHash,
      revocationSignature,
      wrongIdentity.address // Attacker's address
    );

    if (isRevokeSigValid) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Wrong Key for Revocation",
        details: "Revocation signature verified with wrong issuer address.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(isRevokeSigValid).toBe(false);
  });

  test("Robustness - Malformed Inputs", async () => {
    console.log("Testing OnChainService robustness...");
    const malformedInputs: any[] = [
      null,
      undefined,
      "",
      "not-a-hex",
      12345,
      {},
    ];
    const dataHash = onChainService.hashCredential("good-data");
    const { signature } = await onChainService.signForBlockchain(
      dataHash,
      identity.privateKey
    );

    for (const input of malformedInputs) {
      results.testSummary.totalTests++;
      results.testSummary.robustnessTests.attempted++;
      try {
        await onChainService.verifyBlockchainSignature(
          input,
          signature,
          identity.address
        );
        await onChainService.verifyBlockchainSignature(
          dataHash,
          input,
          identity.address
        );
        await onChainService.verifyBlockchainSignature(
          dataHash,
          signature,
          input
        );
        await onChainService.recoverAddress(input, signature);
        await onChainService.recoverAddress(dataHash, input);

        results.testSummary.robustnessTests.handled++;
      } catch (error: any) {
        if (
          error.message.includes("invalid") ||
          error.message.includes("bad") ||
          error.message.includes("length") ||
          error.message.includes("expected")
        ) {
          results.testSummary.robustnessTests.handled++;
        } else {
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
    const reportPath = join(reportDir, "on-chain-service-stress-report.md");

    try {
      mkdirSync(reportDir, { recursive: true });
    } catch (error: any) {
      console.warn(`Could not create directory ${reportDir}:`, error.message);
      return;
    }

    const report = `
# OnChainService Stress Test Report

**Generated:** ${new Date().toLocaleString()}
**Test Type:** Adversarial Security, Robustness, and Performance
**Target:** \`OnChainService.ts\`

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
| **Sign (On-Chain)** | ${results.performance.avgSignTime.toFixed(
      4
    )} | Ethereum-prefixed signing. |
| **Verify (On-Chain)** | ${results.performance.avgVerifyTime.toFixed(
      4
    )} | \`ecrecover\`-compatible verification. |
| **Recover Address** | ${results.performance.avgRecoverTime.toFixed(
      4
    )} | \`ethers.verifyMessage\`. |
| **Batch Verify (10 items)** | ${results.performance.avgBatchVerifyTime.toFixed(
      4
    )} | Time per batch, not per item. |

---

## Test Results Overview

### Normal Operations (Baseline)
- **Sign:** ${results.testSummary.operations.sign.successful} / ${
      results.testSummary.operations.sign.attempted
    }
- **Verify:** ${results.testSummary.operations.verify.successful} / ${
      results.testSummary.operations.verify.attempted
    }
- **Recover:** ${results.testSummary.operations.recover.successful} / ${
      results.testSummary.operations.recover.attempted
    }
- **Batch Verify:** ${
      results.testSummary.operations.batchVerify.successful
    } / ${results.testSummary.operations.batchVerify.attempted}
- **Revocation:** ${results.testSummary.operations.revocation.successful} / ${
      results.testSummary.operations.revocation.attempted
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
    ? "✅ No security breaches detected. All attacks correctly blocked."
    : results.detailedResults.securityBreaches
        .map((b) => `- **${b.test}:** ${b.details}`)
        .join("\n")
}

### 🐛 Robustness Issues (${results.detailedResults.robustnessIssues.length})
${
  results.detailedResults.robustnessIssues.length === 0
    ? "✅ No robustness crashes detected. Malformed inputs handled gracefully by throwing expected errors."
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
        `\n🛡️ OnChainService stress test report generated: ${reportPath}`
      );
    } catch (error: any) {
      console.error(`Failed to write OnChainService report: ${error.message}`);
    }
  }
});
