/**
 * Quick comparison script for thesis data generation
 *
 * This script demonstrates all three algorithms side-by-side
 * and provides sample output for your thesis.
 *
 * Run: npx ts-node scripts/quick-comparison.ts
 */

import {
  ECDSACryptoService,
  RSACryptoService,
  PQCryptoService,
  VCIssuer,
  VCVerifier,
} from "../src";

async function runQuickComparison() {
  console.log("=".repeat(80));
  console.log("QUICK ALGORITHM COMPARISON");
  console.log("=".repeat(80));
  console.log();

  // Test data
  const issuerDID = { id: "did:example:university" };
  const subjectData = {
    id: "did:example:student123",
    name: "Alice Johnson",
    degree: "Computer Science",
    accessLevel: "campus",
  };

  // ECDSA Test
  console.log("1️⃣  ECDSA secp256k1 (Current Implementation)");
  console.log("-".repeat(80));
  await testAlgorithm(new ECDSACryptoService(), "ECDSA");

  // RSA-2048 Test
  console.log("\n2️⃣  RSA-PSS 2048-bit (Classical Standard)");
  console.log("-".repeat(80));
  await testAlgorithm(new RSACryptoService(2048), "RSA-2048");

  // RSA-4096 Test
  console.log("\n3️⃣  RSA-PSS 4096-bit (High Security)");
  console.log("-".repeat(80));
  await testAlgorithm(new RSACryptoService(4096), "RSA-4096");

  // Post-Quantum Test
  console.log("\n4️⃣  ML-DSA-65 (Post-Quantum / Dilithium3)");
  console.log("-".repeat(80));
  await testAlgorithm(new PQCryptoService(), "ML-DSA-65");

  console.log("\n" + "=".repeat(80));
  console.log("COMPARISON COMPLETE");
  console.log("=".repeat(80));
  console.log("\nFor detailed analysis, run:");
  console.log("  npm test -- vc-comparison-performance");
  console.log("  npm test -- vc-comparison-security");
  console.log();
}

async function testAlgorithm(crypto: any, name: string) {
  const issuer = new VCIssuer(crypto);
  const verifier = new VCVerifier(crypto);

  // 1. Key Generation
  const keyGenStart = performance.now();
  const identity = await crypto.generateIdentity();
  const keyGenTime = performance.now() - keyGenStart;

  console.log(`✅ Key Generation: ${keyGenTime.toFixed(2)}ms`);
  console.log(`   Private Key: ${identity.privateKey.substring(0, 50)}...`);
  console.log(`   Public Key:  ${identity.publicKey.substring(0, 50)}...`);
  console.log(`   Address:     ${identity.address}`);

  // 2. Issue Credential
  const issueStart = performance.now();
  const vc = await issuer.issueCredential(
    { id: "did:example:issuer" },
    { id: "did:example:user", accessLevel: "admin" },
    identity.privateKey,
    identity.publicKey,
    { validityDays: 30 },
  );
  const issueTime = performance.now() - issueStart;

  const proof = Array.isArray(vc.proof) ? vc.proof[0] : vc.proof;

  console.log(`\n✅ VC Issuance: ${issueTime.toFixed(2)}ms`);
  console.log(`   Proof Type:      ${proof.type}`);
  console.log(`   Signature Size:  ${proof.proofValue.length} bytes`);
  console.log(`   Credential Size: ${JSON.stringify(vc).length} bytes`);

  // 3. Verify Credential
  const verifyStart = performance.now();
  const result = await verifier.verifyCredential(vc, identity.publicKey, {
    checkExpiration: true,
  });
  const verifyTime = performance.now() - verifyStart;

  console.log(`\n✅ VC Verification: ${verifyTime.toFixed(2)}ms`);
  console.log(`   Valid: ${result.verified ? "✓ YES" : "✗ NO"}`);

  // 4. Tampering Test
  const tamperedVC = { ...vc };
  tamperedVC.credentialSubject = {
    ...(vc.credentialSubject as any),
    accessLevel: "superadmin", // Privilege escalation attempt!
  };

  const tamperResult = await verifier.verifyCredential(
    tamperedVC,
    identity.publicKey,
  );

  console.log(
    `\n✅ Tampering Detection: ${
      !tamperResult.verified ? "✓ BLOCKED" : "✗ FAILED"
    }`,
  );

  console.log();
}

// Run the comparison
runQuickComparison().catch(console.error);
