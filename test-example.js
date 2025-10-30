/**
 * Quick Test Script
 * Run with: npm run build && node test-example.js
 */

const { ECDSACryptoService, VCIssuer, VCVerifier } = require("./dist/index");

async function quickTest() {
  console.log("🚀 Quick W3C VC Test\n");

  // Setup
  const crypto = new ECDSACryptoService();
  const issuer = new VCIssuer();
  const verifier = new VCVerifier();

  // Generate identity
  console.log("1️⃣ Generating identity...");
  const identity = await crypto.generateIdentity();
  console.log("  Address:", identity.address);

  // Issue credential
  console.log("\n2️⃣ Issuing W3C credential...");
  const vc = await issuer.issueOffChainCredential(
    { id: "did:example:issuer", name: "Test Issuer" },
    {
      id: "did:example:subject",
      userMetaDataHash: crypto.hash("test@example.com"),
      role: "admin",
    },
    identity.privateKey,
    {
      credentialTypes: ["TestCredential"],
      validityDays: 30,
      publicKey: identity.publicKey,
    }
  );

  console.log("  ✅ Credential issued!");
  console.log("  ID:", vc.id);
  console.log("  Types:", vc.type);
  console.log("  Valid from:", vc.validFrom);
  console.log("  Valid until:", vc.validUntil);

  // Verify
  console.log("\n3️⃣ Verifying credential...");
  const result = await verifier.verifyOffChainCredential(
    vc,
    identity.publicKey,
    { checkExpiration: true }
  );

  if (result.verified) {
    console.log("  ✅ Credential is VALID!");
    console.log("  Details:", result.details);
  } else {
    console.error("  ❌ Invalid:", result.error);
  }

  console.log("\n🎉 Test completed successfully!");
}

quickTest().catch(console.error);
