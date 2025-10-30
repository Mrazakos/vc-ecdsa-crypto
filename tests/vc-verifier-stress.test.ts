import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  ECDSACryptoService,
  OffChainService,
  OnChainService,
  Proof,
  VCIssuer,
  VCVerifier,
} from "../src";

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
type VerificationResult = {
  verified: boolean;
  error?: string;
  details?: any;
};
// --- END MOCK TYPES ---

/**
 * ADVERSARIAL & STRESS TESTING SUITE FOR VCVerifier
 *
 * This test suite validates the robustness, security, and performance
 * of the VCVerifier.
 *
 * Tests include:
 * 1. Baseline happy-path verification
 * 2. Performance benchmarks for verification
 * 3. Adversarial attacks (tampered VC, wrong key, expired VC)
 * 4. Robustness against malformed VCs
 * 5. Validation logic (expiration, not-before)
 */
describe("Adversarial & Stress Testing - VCVerifier", () => {
  let vcVerifier: VCVerifier;
  let vcIssuer: VCIssuer;
  let cryptoService: ECDSACryptoService;
  let identity: CryptoIdentity;
  let results: {
    timestamp: string;
    testSummary: {
      totalTests: number;
      operations: {
        verifyValid: { attempted: number; successful: number; failed: number };
        verifyInvalid: {
          attempted: number;
          successful: number;
          failed: number;
        };
      };
      securityAttacks: {
        attempted: number;
        successfullyBlocked: number;
        securityBreaches: number;
      };
      robustnessTests: { attempted: number; handled: number; crashed: number };
    };
    performance: {
      avgVerifyTime: number;
    };
    detailedResults: {
      securityBreaches: Array<{ test: string; details: string }>;
      robustnessIssues: Array<{ test: string; error: string; input: any }>;
      failures: Array<{ test: string; error: string }>;
    };
  };

  beforeAll(async () => {
    cryptoService = new ECDSACryptoService();
    const offChainService = new OffChainService(cryptoService);
    const onChainService = new OnChainService(cryptoService);
    vcIssuer = new VCIssuer(cryptoService, offChainService, onChainService);
    vcVerifier = new VCVerifier(cryptoService, offChainService);
    identity = await cryptoService.generateIdentity(); // Shared identity
    results = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: 0,
        operations: {
          verifyValid: { attempted: 0, successful: 0, failed: 0 },
          verifyInvalid: { attempted: 0, successful: 0, failed: 0 },
        },
        securityAttacks: {
          attempted: 0,
          successfullyBlocked: 0,
          securityBreaches: 0,
        },
        robustnessTests: { attempted: 0, handled: 0, crashed: 0 },
      },
      performance: {
        avgVerifyTime: 0,
      },
      detailedResults: {
        securityBreaches: [],
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
    console.log("VCVerifier STRESS TEST SUMMARY");
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
      `Avg Verify: ${results.performance.avgVerifyTime.toFixed(2)}ms`
    );
    console.log("=".repeat(80));
  });

  test("Normal Operations Baseline - Verify Valid VC", async () => {
    console.log("Testing VCVerifier verify valid VC baseline...");
    for (let i = 0; i < 50; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.verifyValid.attempted++;
      try {
        const vc = await vcIssuer.issueOffChainCredential(
          { id: "did:example:issuer" },
          { id: "did:example:subject", data: `valid-vc-${i}` },
          identity.privateKey,
          { publicKey: identity.publicKey, validityDays: 1 }
        );

        const result = await vcVerifier.verifyOffChainCredential(
          vc,
          identity.publicKey,
          { checkExpiration: true, checkNotBefore: true }
        );

        expect(result.verified).toBe(true);
        expect(result.error).toBeUndefined();
        results.testSummary.operations.verifyValid.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Verify Valid VC",
          error: error.message,
        });
        results.testSummary.operations.verifyValid.failed++;
      }
    }
  });

  test("Performance Testing (100 cycles)", async () => {
    console.log("Testing VCVerifier performance...");
    let totalVerify = 0;
    const cycles = 100;

    // Create one VC to verify repeatedly
    const vc = await vcIssuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:example:subject", data: "perf-vc" },
      identity.privateKey,
      { publicKey: identity.publicKey }
    );

    for (let i = 0; i < cycles; i++) {
      results.testSummary.totalTests++;
      const startVerify = performance.now();
      await vcVerifier.verifyOffChainCredential(vc, identity.publicKey);
      totalVerify += performance.now() - startVerify;
    }

    results.performance.avgVerifyTime = totalVerify / cycles;
    expect(results.performance.avgVerifyTime).toBeLessThan(50);
  });

  test("Adversarial - Tampered Credential Subject", async () => {
    console.log("Testing VCVerifier tampered credential subject...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const vc = await vcIssuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:example:subject", role: "user" },
      identity.privateKey,
      { publicKey: identity.publicKey }
    );

    // Attacker modifies the VC *after* issuance
    const tamperedVC = JSON.parse(JSON.stringify(vc));
    tamperedVC.credentialSubject.role = "admin"; // Maliciously escalate privilege

    const result = await vcVerifier.verifyOffChainCredential(
      tamperedVC,
      identity.publicKey
    );

    if (result.verified) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Tampered Credential Subject",
        details: "VC with tampered subject (role: admin) was verified.",
      });
    } else {
      expect(result.error).toBe("Invalid signature");
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(result.verified).toBe(false);
  });

  test("Adversarial - Tampered Issuer", async () => {
    console.log("Testing VCVerifier tampered issuer...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const vc = await vcIssuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:example:subject" },
      identity.privateKey,
      { publicKey: identity.publicKey }
    );

    const tamperedVC = JSON.parse(JSON.stringify(vc));
    tamperedVC.issuer = "did:example:attacker"; // Attacker changes issuer

    const result = await vcVerifier.verifyOffChainCredential(
      tamperedVC,
      identity.publicKey
    );

    if (result.verified) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Tampered Issuer",
        details: "VC with tampered issuer was verified.",
      });
    } else {
      expect(result.error).toBe("Invalid signature");
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(result.verified).toBe(false);
  });

  test("Adversarial - Wrong Public Key", async () => {
    console.log("Testing VCVerifier wrong public key...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const wrongIdentity = await cryptoService.generateIdentity();
    const vc = await vcIssuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:example:subject" },
      identity.privateKey,
      { publicKey: identity.publicKey }
    );

    // Verify with the WRONG key
    const result = await vcVerifier.verifyOffChainCredential(
      vc,
      wrongIdentity.publicKey
    );

    if (result.verified) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Wrong Public Key",
        details: "VC verified with a public key that did not issue it.",
      });
    } else {
      expect(result.error).toBe("Invalid signature");
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(result.verified).toBe(false);
  });

  test("Validation Logic - Expired VC", async () => {
    console.log("Testing VCVerifier expired VC...");
    results.testSummary.totalTests++;
    results.testSummary.operations.verifyInvalid.attempted++;

    const vc = await vcIssuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:example:subject" },
      identity.privateKey,
      { publicKey: identity.publicKey, validityDays: -1 } // Expired 1 day ago
    );

    const result = await vcVerifier.verifyOffChainCredential(
      vc,
      identity.publicKey,
      { checkExpiration: true } // Explicitly check
    );

    if (result.verified) {
      results.detailedResults.failures.push({
        test: "Validation Logic - Expired VC",
        error: "Expired VC was verified as valid.",
      });
    } else {
      expect(result.error).toContain("Credential expired");
      results.testSummary.operations.verifyInvalid.successful++;
    }
    expect(result.verified).toBe(false);
  });

  test("Validation Logic - Not Yet Valid VC", async () => {
    console.log("Testing VCVerifier not-yet-valid VC...");
    results.testSummary.totalTests++;
    results.testSummary.operations.verifyInvalid.attempted++;

    const validFrom = new Date(Date.now() + 86400000).toISOString(); // Valid tomorrow
    const vc = await vcIssuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:example:subject" },
      identity.privateKey,
      { publicKey: identity.publicKey }
    );
    (vc as any).validFrom = validFrom; // Manually set future validFrom

    // Re-sign with tampered data (for a fair test of validation logic)
    const { proof: _, ...credWithoutProof } = vc;
    const credHash = (vcIssuer as any).createCanonicalHash(credWithoutProof);
    const { signature } = await (vcIssuer as any).offChainService.signData(
      credHash,
      identity.privateKey
    );
    const proof = vc.proof as Proof;
    proof.proofValue = signature;
    proof.created = new Date().toISOString();

    const result = await vcVerifier.verifyOffChainCredential(
      vc,
      identity.publicKey,
      { checkNotBefore: true } // Explicitly check
    );

    if (result.verified) {
      results.detailedResults.failures.push({
        test: "Validation Logic - Not Yet Valid VC",
        error: "Not-yet-valid VC was verified as valid.",
      });
    } else {
      expect(result.error).toContain("Credential not yet valid");
      results.testSummary.operations.verifyInvalid.successful++;
    }
    expect(result.verified).toBe(false);
  });

  test("Robustness - Malformed VC", async () => {
    console.log("Testing VCVerifier robustness against malformed VCs...");
    const malformedVCs: any[] = [
      null,
      undefined,
      {},
      { foo: "bar" },
      { proof: null },
      { proof: {} },
      { credentialSubject: null },
      { issuer: null },
      { type: ["NotVerifiableCredential"] },
    ];

    for (const vc of malformedVCs) {
      results.testSummary.totalTests++;
      results.testSummary.robustnessTests.attempted++;
      try {
        const result = await vcVerifier.verifyOffChainCredential(
          vc,
          identity.publicKey
        );
        expect(result.verified).toBe(false);
        expect(result.error).toBeDefined();
        results.testSummary.robustnessTests.handled++;
      } catch (error: any) {
        // Should not crash, should return a result object
        results.testSummary.robustnessTests.crashed++;
        results.detailedResults.robustnessIssues.push({
          test: "Robustness - Malformed VC",
          error:
            "Verifier threw an unhandled exception instead of returning a result.",
          input: vc,
        });
      }
    }
    expect(results.testSummary.robustnessTests.crashed).toBe(0);
  });

  // --- REPORT GENERATION ---
  function generateMarkdownReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = `test-reports/${timestamp}`;
    const reportPath = join(reportDir, "vc-verifier-stress-report.md");

    try {
      mkdirSync(reportDir, { recursive: true });
    } catch (error: any) {
      console.warn(`Could not create directory ${reportDir}:`, error.message);
      return;
    }

    const report = `
# VCVerifier Stress Test Report

**Generated:** ${new Date().toLocaleString()}
**Test Type:** Adversarial Security, Robustness, and Performance
**Target:** \`VCVerifier.ts\`

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
| **Verify (Off-Chain)** | ${results.performance.avgVerifyTime.toFixed(
      4
    )} | Includes canonicalization, hash, and signature verification. |

---

## Test Results Overview

### Normal Operations (Baseline)
- **Verify Valid VC:** ${
      results.testSummary.operations.verifyValid.successful
    } / ${results.testSummary.operations.verifyValid.attempted}
- **Verify Invalid (Logic):** ${
      results.testSummary.operations.verifyInvalid.successful
    } / ${
      results.testSummary.operations.verifyInvalid.attempted
    } (Expired, Not-Yet-Valid)

### Security Attack Detection
- **Attacks Attempted:** ${results.testSummary.securityAttacks.attempted}
- **Successfully Blocked:** ${
      results.testSummary.securityAttacks.successfullyBlocked
    }
- **Security Breaches:** ${results.testSummary.securityAttacks.securityBreaches}

### Robustness Tests
- **Inputs Tested:** ${results.testSummary.robustnessTests.attempted}
- **Handled Gracefully (Returned \`verified: false\`):** ${
      results.testSummary.robustnessTests.handled
    }
- **System Crashes (Unhandled Exceptions):** ${
      results.testSummary.robustnessTests.crashed
    }

---

## Detailed Findings

### 🚨 Security Breaches (${results.detailedResults.securityBreaches.length})
${
  results.detailedResults.securityBreaches.length === 0
    ? "✅ No security breaches detected. Tampered VCs and VCs verified with wrong keys were all correctly rejected."
    : results.detailedResults.securityBreaches
        .map((b) => `- **${b.test}:** ${b.details}`)
        .join("\n")
}

### 🐛 Robustness Issues (${results.detailedResults.robustnessIssues.length})
${
  results.detailedResults.robustnessIssues.length === 0
    ? "✅ No robustness crashes detected. Malformed VCs were handled gracefully, returning `verified: false`."
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
    ? "✅ No failures during normal operations baseline (verifying valid VCs)."
    : results.detailedResults.failures
        .map((f) => `- **${f.test}:** ${f.error}`)
        .join("\n")
}
    `;

    try {
      writeFileSync(reportPath, report);
      console.log(
        `\n🛡️ VCVerifier stress test report generated: ${reportPath}`
      );
    } catch (error: any) {
      console.error(`Failed to write VCVerifier report: ${error.message}`);
    }
  }
});
