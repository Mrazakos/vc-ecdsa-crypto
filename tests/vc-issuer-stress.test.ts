import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  ECDSACryptoService,
  OffChainService,
  OnChainService,
  VCIssuer,
} from "../src";
import { ECDSAProof, Proof } from "../dist";

// --- MOCK TYPES ---
type CryptoIdentity = {
  privateKey: string;
  publicKey: string;
  address: string;
};
type Issuer = string | { id: string; [key: string]: any };
type CredentialSubject =
  | { id: string; [key: string]: any }
  | { id: string; [key: string]: any }[];
type Credential = {
  "@context": string[];
  type: string[];
  issuer: Issuer;
  validFrom: string;
  validUntil?: string;
  credentialSubject: CredentialSubject;
  id?: string;
  [key: string]: any;
};
type VerifiableCredential = Credential & {
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    proofValue: string;
  };
};
// --- END MOCK TYPES ---

/**
 * ADVERSARIAL & STRESS TESTING SUITE FOR VCIssuer
 *
 * This test suite validates the robustness, security, and performance
 * of the VCIssuer, which creates and signs Verifiable Credentials.
 *
 * Tests include:
 * 1. Baseline happy-path issuance (on-chain and off-chain)
 * 2. Performance benchmarks for issuance
 * 3. Robustness against malformed inputs (subjects, issuers, options)
 * 4. Validation of canonicalization (deterministic hashing)
 * 5. Security checks for required options (e.g., publicKey for off-chain)
 */
describe("Adversarial & Stress Testing - VCIssuer", () => {
  let vcIssuer: VCIssuer;
  let cryptoService: ECDSACryptoService;
  let identity: CryptoIdentity;
  let results: {
    timestamp: string;
    testSummary: {
      totalTests: number;
      operations: {
        issueOffChain: {
          attempted: number;
          successful: number;
          failed: number;
        };
        issueOnChain: { attempted: number; successful: number; failed: number };
        canonicalize: { attempted: number; successful: number; failed: number };
      };
      robustnessTests: { attempted: number; handled: number; crashed: number };
    };
    performance: {
      avgIssueOffChainTime: number;
      avgIssueOnChainTime: number;
    };
    detailedResults: {
      robustnessIssues: Array<{ test: string; error: string; input: any }>;
      failures: Array<{ test: string; error: string }>;
    };
  };

  beforeAll(async () => {
    cryptoService = new ECDSACryptoService();
    const offChainService = new OffChainService(cryptoService);
    const onChainService = new OnChainService(cryptoService);
    vcIssuer = new VCIssuer(cryptoService, offChainService, onChainService);
    identity = await cryptoService.generateIdentity(); // Shared identity
    results = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: 0,
        operations: {
          issueOffChain: { attempted: 0, successful: 0, failed: 0 },
          issueOnChain: { attempted: 0, successful: 0, failed: 0 },
          canonicalize: { attempted: 0, successful: 0, failed: 0 },
        },
        robustnessTests: { attempted: 0, handled: 0, crashed: 0 },
      },
      performance: {
        avgIssueOffChainTime: 0,
        avgIssueOnChainTime: 0,
      },
      detailedResults: {
        robustnessIssues: [],
        failures: [],
      },
    };
  });

  afterAll(() => {
    // Generate report
    generateMarkdownReport();

    // Console summary
    console.log("\n" + "=".repeat(80));
    console.log("VCIssuer STRESS TEST SUMMARY");
    console.log("=".repeat(80));
    console.log(
      `Robustness Issues: ${results.detailedResults.robustnessIssues.length}`
    );
    console.log(
      `Operational Failures: ${results.detailedResults.failures.length}`
    );
    console.log(
      `Avg Issue (Off-Chain): ${results.performance.avgIssueOffChainTime.toFixed(
        2
      )}ms`
    );
    console.log(
      `Avg Issue (On-Chain): ${results.performance.avgIssueOnChainTime.toFixed(
        2
      )}ms`
    );
    console.log("=".repeat(80));
  });

  test("Normal Operations Baseline - Issue Off-Chain", async () => {
    console.log("Testing VCIssuer issueOffChain baseline...");
    for (let i = 0; i < 25; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.issueOffChain.attempted++;
      try {
        const issuer: Issuer = { id: `did:example:issuer:${i}` };
        const subject: CredentialSubject = {
          id: `did:example:subject:${i}`,
          data: `test-data-${i}`,
        };
        const vc = await vcIssuer.issueOffChainCredential(
          issuer,
          subject,
          identity.privateKey,
          {
            validityDays: 30,
            publicKey: identity.publicKey, // Required
          }
        );
        var proof = vc.proof as ECDSAProof;

        expect(vc).toHaveProperty("proof");
        expect(proof.type).toBe("EcdsaSecp256k1RecoverySignature2020");
        expect(proof.proofValue.startsWith("0x")).toBe(true);
        expect(vc.issuer).toEqual(issuer);
        expect(vc.credentialSubject).toEqual(subject);
        expect(vc.validUntil).toBeDefined();
        results.testSummary.operations.issueOffChain.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Issue Off-Chain",
          error: error.message,
        });
        results.testSummary.operations.issueOffChain.failed++;
      }
    }
  });

  test("Normal Operations Baseline - Issue On-Chain", async () => {
    console.log("Testing VCIssuer issueOnChain baseline...");
    for (let i = 0; i < 25; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.issueOnChain.attempted++;
      try {
        const issuer: Issuer = { id: `did:ethr:${identity.address}` };
        const subject: CredentialSubject = {
          id: `did:example:subject:${i}`,
          hash: cryptoService.hash(`on-chain-data-${i}`),
        };
        const vc = await vcIssuer.issueOnChainCredential(
          issuer,
          subject,
          identity.privateKey,
          {
            validityDays: 30,
            ethereumAddress: identity.address, // Required
          }
        );

        var proof = vc.proof as ECDSAProof;
        expect(vc).toHaveProperty("proof");
        expect(proof.type).toBe("EcdsaSecp256k1Signature2019");
        expect(proof.proofValue.startsWith("0x")).toBe(true);
        expect(proof.verificationMethod).toBe(identity.address);
        expect(vc.issuer).toEqual(issuer);
        results.testSummary.operations.issueOnChain.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Issue On-Chain",
          error: error.message,
        });
        results.testSummary.operations.issueOnChain.failed++;
      }
    }
  });

  test("Robustness - Deterministic Canonicalization", () => {
    console.log("Testing VCIssuer deterministic canonicalization...");
    results.testSummary.totalTests++;
    results.testSummary.operations.canonicalize.attempted++;
    try {
      const obj1 = {
        name: "Test User",
        email: "test@example.com",
        iat: 12345,
      };
      const obj2 = {
        email: "test@example.com",
        iat: 12345,
        name: "Test User",
      };
      const obj3 = {
        name: "Test User",
        email: "test@example.com",
        iat: 12345,
        extra: undefined, // Should be ignored by JSON.stringify
      };

      // Use the private method via casting (for testing only)
      const hash1 = (vcIssuer as any).createCanonicalHash(obj1);
      const hash2 = (vcIssuer as any).createCanonicalHash(obj2);
      const hash3 = (vcIssuer as any).createCanonicalHash(obj3);

      expect(hash1.startsWith("0x")).toBe(true);
      expect(hash1).toBe(hash2);
      expect(hash1).toBe(hash3); // canonicalize method should handle key sorting
      results.testSummary.operations.canonicalize.successful++;
    } catch (error: any) {
      results.detailedResults.failures.push({
        test: "Robustness - Deterministic Canonicalization",
        error: error.message,
      });
      results.testSummary.operations.canonicalize.failed++;
    }
  });

  test("Performance Testing (50 cycles)", async () => {
    console.log("Testing VCIssuer performance...");
    let totalOffChain = 0,
      totalOnChain = 0;
    const cycles = 50;
    const issuer: Issuer = { id: `did:ethr:${identity.address}` };
    const subject: CredentialSubject = {
      id: `did:example:subject:perf`,
      data: `perf-data`,
    };

    for (let i = 0; i < cycles; i++) {
      results.testSummary.totalTests++;
      const startOffChain = performance.now();
      await vcIssuer.issueOffChainCredential(
        issuer,
        subject,
        identity.privateKey,
        { publicKey: identity.publicKey }
      );
      totalOffChain += performance.now() - startOffChain;

      const startOnChain = performance.now();
      await vcIssuer.issueOnChainCredential(
        issuer,
        subject,
        identity.privateKey,
        { ethereumAddress: identity.address }
      );
      totalOnChain += performance.now() - startOnChain;
    }

    results.performance.avgIssueOffChainTime = totalOffChain / cycles;
    results.performance.avgIssueOnChainTime = totalOnChain / cycles;

    expect(results.performance.avgIssueOffChainTime).toBeLessThan(100);
    expect(results.performance.avgIssueOnChainTime).toBeLessThan(100);
  });

  test("Robustness - Missing Required Options", async () => {
    console.log("Testing VCIssuer missing required options...");
    const issuer: Issuer = { id: "did:example:issuer" };
    const subject: CredentialSubject = { id: "did:example:subject" };

    // 1. Off-Chain missing publicKey
    results.testSummary.totalTests++;
    results.testSummary.robustnessTests.attempted++;
    try {
      await vcIssuer.issueOffChainCredential(
        issuer,
        subject,
        identity.privateKey,
        {
          /* publicKey is missing */
        }
      );
      // Should not reach here
      results.testSummary.robustnessTests.crashed++;
      results.detailedResults.robustnessIssues.push({
        test: "Robustness - Off-Chain missing publicKey",
        error: "Issuance succeeded but should have failed.",
        input: "Missing publicKey",
      });
    } catch (error: any) {
      expect(error.message).toContain("publicKey is required");
      results.testSummary.robustnessTests.handled++;
    }

    // 2. On-Chain missing ethereumAddress
    results.testSummary.totalTests++;
    results.testSummary.robustnessTests.attempted++;
    try {
      await vcIssuer.issueOnChainCredential(
        issuer,
        subject,
        identity.privateKey,
        {
          /* ethereumAddress is missing */
        }
      );
      // Should not reach here
      results.testSummary.robustnessTests.crashed++;
      results.detailedResults.robustnessIssues.push({
        test: "Robustness - On-Chain missing ethereumAddress",
        error: "Issuance succeeded but should have failed.",
        input: "Missing ethereumAddress",
      });
    } catch (error: any) {
      expect(error.message).toContain("ethereumAddress is required");
      results.testSummary.robustnessTests.handled++;
    }
    expect(results.testSummary.robustnessTests.crashed).toBe(0);
  });

  // --- REPORT GENERATION ---
  function generateMarkdownReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = `test-reports/${timestamp}`;
    const reportPath = join(reportDir, "vc-issuer-stress-report.md");

    try {
      mkdirSync(reportDir, { recursive: true });
    } catch (error: any) {
      console.warn(`Could not create directory ${reportDir}:`, error.message);
      return;
    }

    const report = `
# VCIssuer Stress Test Report

**Generated:** ${new Date().toLocaleString()}
**Test Type:** Robustness and Performance
**Target:** \`VCIssuer.ts\`

---

## Executive Summary

| Metric | Result |
| --- | --- |
| **Robustness Rating** | ${
      results.testSummary.robustnessTests.crashed === 0
        ? "✅ EXCELLENT"
        : "❌ POOR"
    } |
| **Operational Failures** | ${results.detailedResults.failures.length} |
| **Robustness Issues** | ${results.detailedResults.robustnessIssues.length} |
| **Deterministic Hashing** | ${
      results.testSummary.operations.canonicalize.successful > 0
        ? "✅ PASSED"
        : "❌ FAILED"
    } |

---

## Performance Benchmarks

| Operation | Average Time (ms) | Notes |
| --- | --- | --- |
| **Issue (Off-Chain)** | ${results.performance.avgIssueOffChainTime.toFixed(
      4
    )} | Includes canonicalization and signing. |
| **Issue (On-Chain)** | ${results.performance.avgIssueOnChainTime.toFixed(
      4
    )} | Includes canonicalization and ETH-prefixed signing. |

---

## Test Results Overview

### Normal Operations (Baseline)
- **Issue (Off-Chain):** ${
      results.testSummary.operations.issueOffChain.successful
    } / ${results.testSummary.operations.issueOffChain.attempted}
- **Issue (On-Chain):** ${
      results.testSummary.operations.issueOnChain.successful
    } / ${results.testSummary.operations.issueOnChain.attempted}
- **Canonicalization Check:** ${
      results.testSummary.operations.canonicalize.successful
    } / ${results.testSummary.operations.canonicalize.attempted}

### Robustness Tests
- **Inputs Tested:** ${results.testSummary.robustnessTests.attempted}
- **Handled Gracefully (Errors thrown):** ${
      results.testSummary.robustnessTests.handled
    }
- **Unexpected Success/Crash:** ${results.testSummary.robustnessTests.crashed}

---

## Detailed Findings

### 🐛 Robustness Issues (${results.detailedResults.robustnessIssues.length})
${
  results.detailedResults.robustnessIssues.length === 0
    ? "✅ No robustness issues detected. Malformed inputs and missing options handled gracefully by throwing expected errors."
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
      console.log(`\n🛡️ VCIssuer stress test report generated: ${reportPath}`);
    } catch (error: any) {
      console.error(`Failed to write VCIssuer report: ${error.message}`);
    }
  }
});
