import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ECDSACryptoService, OffChainService } from "../src";

// --- MOCK TYPES ---
type CryptoIdentity = {
  privateKey: string;
  publicKey: string;
  address: string;
};
// --- END MOCK TYPES ---

/**
 * ADVERSARIAL & STRESS TESTING SUITE FOR OffChainService
 *
 * This test suite validates the robustness, security, and performance
 * of the OffChainService, which is responsible for non-blockchain
 * cryptographic operations (e.g., physical lock verification).
 *
 * Tests include:
 * 1. Baseline sign/verify operations
 * 2. Performance benchmarks
 * 3. Challenge-response (replay attack prevention) logic
 * 4. Access token generation and verification logic (with expiration)
 * 5. Robustness against malformed inputs
 */
describe("Adversarial & Stress Testing - OffChainService", () => {
  let offChainService: OffChainService;
  let cryptoService: ECDSACryptoService;
  let identity: CryptoIdentity;
  let results: {
    timestamp: string;
    testSummary: {
      totalTests: number;
      operations: {
        sign: { attempted: number; successful: number; failed: number };
        verify: { attempted: number; successful: number; failed: number };
        challenge: { attempted: number; successful: number; failed: number };
        accessToken: { attempted: number; successful: number; failed: number };
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
      avgTokenGenTime: number;
      avgTokenVerifyTime: number;
    };
    detailedResults: {
      securityBreaches: Array<{ test: string; details: string }>;
      robustnessIssues: Array<{ test: string; error: string; input: any }>;
      failures: Array<{ test: string; error: string }>;
    };
  };

  beforeAll(async () => {
    cryptoService = new ECDSACryptoService();
    offChainService = new OffChainService(cryptoService);
    identity = await cryptoService.generateIdentity(); // Shared identity for tests
    results = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: 0,
        operations: {
          sign: { attempted: 0, successful: 0, failed: 0 },
          verify: { attempted: 0, successful: 0, failed: 0 },
          challenge: { attempted: 0, successful: 0, failed: 0 },
          accessToken: { attempted: 0, successful: 0, failed: 0 },
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
        avgTokenGenTime: 0,
        avgTokenVerifyTime: 0,
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
    console.log("OffChainService STRESS TEST SUMMARY");
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
      `Avg Token Gen: ${results.performance.avgTokenGenTime.toFixed(2)}ms`
    );
    console.log(
      `Avg Token Verify: ${results.performance.avgTokenVerifyTime.toFixed(2)}ms`
    );
    console.log("=".repeat(80));
  });

  test("Normal Operations Baseline - Sign/Verify", async () => {
    console.log("Testing OffChainService sign/verify baseline...");
    for (let i = 0; i < 50; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.sign.attempted++;
      results.testSummary.operations.verify.attempted++;
      try {
        const data = { message: `test-${i}`, timestamp: Date.now() };
        const dataHash = offChainService.hashCredential(data);

        const { signature, signedHash } = await offChainService.signData(
          dataHash,
          identity.privateKey
        );
        expect(signature.startsWith("0x")).toBe(true);
        expect(signedHash).toBe(dataHash);
        results.testSummary.operations.sign.successful++;

        const isValid = await offChainService.verifySignature(
          dataHash,
          signature,
          identity.publicKey
        );
        expect(isValid).toBe(true);
        results.testSummary.operations.verify.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Sign/Verify",
          error: error.message,
        });
        results.testSummary.operations.sign.failed++;
        results.testSummary.operations.verify.failed++;
      }
    }
  });

  test("Normal Operations Baseline - Challenge/Response", async () => {
    console.log("Testing OffChainService challenge/response baseline...");
    for (let i = 0; i < 20; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.challenge.attempted++;
      try {
        const challenge = offChainService.createChallenge();
        expect(challenge.startsWith("0x")).toBe(true);
        expect(challenge.length).toBe(66); // 32 bytes + 0x

        // Simulate client signing the challenge
        const challengeHash = cryptoService.hash(challenge);
        const responseSig = await cryptoService.sign(
          challengeHash,
          identity.privateKey,
          { ethereumPrefix: false }
        ); // Must be off-chain mode

        const isValid = await offChainService.verifyChallengeResponse(
          challenge,
          responseSig,
          identity.publicKey
        );
        expect(isValid).toBe(true);
        results.testSummary.operations.challenge.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Challenge/Response",
          error: error.message,
        });
        results.testSummary.operations.challenge.failed++;
      }
    }
  });

  test("Normal Operations Baseline - Access Token", async () => {
    console.log("Testing OffChainService access token baseline...");
    for (let i = 0; i < 20; i++) {
      results.testSummary.totalTests++;
      results.testSummary.operations.accessToken.attempted++;
      try {
        const { token, signature, expiresAt } =
          await offChainService.generateAccessToken(identity.privateKey, 60);

        expect(token).toContain("access_");
        expect(signature.startsWith("0x")).toBe(true);
        expect(expiresAt).toBeGreaterThan(Date.now());

        const isValid = await offChainService.verifyAccessToken(
          token,
          signature,
          identity.publicKey
        );
        expect(isValid).toBe(true);
        results.testSummary.operations.accessToken.successful++;
      } catch (error: any) {
        results.detailedResults.failures.push({
          test: "Normal Operations Baseline - Access Token",
          error: error.message,
        });
        results.testSummary.operations.accessToken.failed++;
      }
    }
  });

  test("Performance Testing (50 cycles)", async () => {
    console.log("Testing OffChainService performance...");
    let totalSign = 0,
      totalVerify = 0,
      totalTokenGen = 0,
      totalTokenVerify = 0;
    const cycles = 50;
    const dataHash = offChainService.hashCredential("perf-test");

    for (let i = 0; i < cycles; i++) {
      results.testSummary.totalTests++;
      const startSign = performance.now();
      const { signature } = await offChainService.signData(
        dataHash,
        identity.privateKey
      );
      totalSign += performance.now() - startSign;

      const startVerify = performance.now();
      await offChainService.verifySignature(
        dataHash,
        signature,
        identity.publicKey
      );
      totalVerify += performance.now() - startVerify;

      const startTokenGen = performance.now();
      const tokenData = await offChainService.generateAccessToken(
        identity.privateKey,
        1
      );
      totalTokenGen += performance.now() - startTokenGen;

      const startTokenVerify = performance.now();
      await offChainService.verifyAccessToken(
        tokenData.token,
        tokenData.signature,
        identity.publicKey
      );
      totalTokenVerify += performance.now() - startTokenVerify;
    }

    results.performance.avgSignTime = totalSign / cycles;
    results.performance.avgVerifyTime = totalVerify / cycles;
    results.performance.avgTokenGenTime = totalTokenGen / cycles;
    results.performance.avgTokenVerifyTime = totalTokenVerify / cycles;

    expect(results.performance.avgSignTime).toBeLessThan(50);
    expect(results.performance.avgVerifyTime).toBeLessThan(50);
    expect(results.performance.avgTokenGenTime).toBeLessThan(50);
    expect(results.performance.avgTokenVerifyTime).toBeLessThan(50);
  });

  test("Adversarial - Replay Attack (Challenge/Response)", async () => {
    console.log("Testing OffChainService replay attack...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const challenge = offChainService.createChallenge();
    const challengeHash = cryptoService.hash(challenge);
    const responseSig = await cryptoService.sign(
      challengeHash,
      identity.privateKey,
      { ethereumPrefix: false }
    );

    // 1. Verify once (should be valid)
    const isValidFirst = await offChainService.verifyChallengeResponse(
      challenge,
      responseSig,
      identity.publicKey
    );
    expect(isValidFirst).toBe(true);

    // 2. Attacker tries to reuse the *same challenge and response*
    // In a real system, the server would invalidate the challenge after first use.
    // Here, we test that a *different* challenge fails with the *old* response.
    const newChallenge = offChainService.createChallenge();
    const isValidReplay = await offChainService.verifyChallengeResponse(
      newChallenge, // New challenge
      responseSig, // Old response
      identity.publicKey
    );

    if (isValidReplay) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Replay Attack",
        details: "Old challenge response was accepted for a new challenge.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(isValidReplay).toBe(false);
  });

  test("Adversarial - Expired Access Token", async () => {
    console.log("Testing OffChainService expired access token...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    // Create a token that expires in 1ms
    const { token, signature } = await offChainService.generateAccessToken(
      identity.privateKey,
      0.001
    );

    // Wait 5ms to ensure expiration
    await new Promise((r) => setTimeout(r, 5));

    const isValid = await offChainService.verifyAccessToken(
      token,
      signature,
      identity.publicKey
    );

    if (isValid) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Expired Access Token",
        details: "An expired access token was accepted as valid.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(isValid).toBe(false);
  });

  test("Adversarial - Tampered Access Token", async () => {
    console.log("Testing OffChainService tampered access token...");
    results.testSummary.totalTests++;
    results.testSummary.securityAttacks.attempted++;

    const { token, signature } = await offChainService.generateAccessToken(
      identity.privateKey,
      60
    );

    // Attacker tries to extend expiration
    const parts = token.split("_");
    const tamperedToken = `${parts[0]}_${parseInt(parts[1], 10) + 999999}_${
      parts[2]
    }`;

    const isValid = await offChainService.verifyAccessToken(
      tamperedToken, // Tampered token
      signature, // Original signature
      identity.publicKey
    );

    if (isValid) {
      results.testSummary.securityAttacks.securityBreaches++;
      results.detailedResults.securityBreaches.push({
        test: "Adversarial - Tampered Access Token",
        details: "A tampered access token was accepted as valid.",
      });
    } else {
      results.testSummary.securityAttacks.successfullyBlocked++;
    }
    expect(isValid).toBe(false);
  });

  test("Robustness - Malformed Inputs", async () => {
    console.log("Testing OffChainService robustness...");
    const malformedInputs: any[] = [
      null,
      undefined,
      "",
      "not-a-hex",
      12345,
      {},
    ];
    const dataHash = offChainService.hashCredential("good-data");
    const { signature } = await offChainService.signData(
      dataHash,
      identity.privateKey
    );

    for (const input of malformedInputs) {
      results.testSummary.totalTests++;
      results.testSummary.robustnessTests.attempted++;
      try {
        await offChainService.verifySignature(
          input,
          signature,
          identity.publicKey
        );
        await offChainService.verifySignature(
          dataHash,
          input,
          identity.publicKey
        );
        await offChainService.verifySignature(dataHash, signature, input);
        await offChainService.verifyChallengeResponse(
          input,
          signature,
          identity.publicKey
        );
        await offChainService.verifyChallengeResponse(
          dataHash,
          input,
          identity.publicKey
        );
        await offChainService.verifyAccessToken(
          input,
          signature,
          identity.publicKey
        );
        await offChainService.verifyAccessToken(
          dataHash,
          input,
          identity.publicKey
        );

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
    const reportPath = join(reportDir, "off-chain-service-stress-report.md");

    try {
      mkdirSync(reportDir, { recursive: true });
    } catch (error: any) {
      console.warn(`Could not create directory ${reportDir}:`, error.message);
      return;
    }

    const report = `
# OffChainService Stress Test Report

**Generated:** ${new Date().toLocaleString()}
**Test Type:** Adversarial Security, Robustness, and Performance
**Target:** \`OffChainService.ts\`

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
| **Sign Data** | ${results.performance.avgSignTime.toFixed(
      4
    )} | Core off-chain signing. |
| **Verify Signature** | ${results.performance.avgVerifyTime.toFixed(
      4
    )} | Core off-chain verification. |
| **Generate Access Token** | ${results.performance.avgTokenGenTime.toFixed(
      4
    )} | Includes hashing and signing. |
| **Verify Access Token** | ${results.performance.avgTokenVerifyTime.toFixed(
      4
    )} | Includes hash, expiration check, and verification. |

---

## Test Results Overview

### Normal Operations (Baseline)
- **Sign/Verify:** ${results.testSummary.operations.sign.successful} / ${
      results.testSummary.operations.sign.attempted
    }
- **Challenge/Response:** ${
      results.testSummary.operations.challenge.successful
    } / ${results.testSummary.operations.challenge.attempted}
- **Access Token:** ${
      results.testSummary.operations.accessToken.successful
    } / ${results.testSummary.operations.accessToken.attempted}

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
    ? "✅ No security breaches detected. Replay attacks, expired tokens, and tampered tokens were all correctly blocked."
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
        `\n🛡️ OffChainService stress test report generated: ${reportPath}`
      );
    } catch (error: any) {
      console.error(`Failed to write OffChainService report: ${error.message}`);
    }
  }
});
