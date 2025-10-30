/**
 * Debug Test Script
 */

const { ECDSACryptoService, VCIssuer, VCVerifier } = require("./dist/index");

async function debugTest() {
  console.log("🔍 Debug W3C VC Test\n");

  const crypto = new ECDSACryptoService();
  const issuer = new VCIssuer();
  const verifier = new VCVerifier();

  // Generate identity
  console.log("1️⃣ Generating identity...");
  const identity = await crypto.generateIdentity();
  console.log("  Private Key:", identity.privateKey);
  console.log("  Public Key:", identity.publicKey);
  console.log("  Address:", identity.address);

  // Issue credential
  console.log("\n2️⃣ Issuing credential...");
  const vc = await issuer.issueOffChainCredential(
    { id: "did:example:issuer" },
    {
      id: "did:example:subject",
      test: "data",
    },
    identity.privateKey,
    {
      publicKey: identity.publicKey,
    }
  );

  console.log("\n📄 Issued VC:");
  console.log(JSON.stringify(vc, null, 2));

  // Manually verify
  console.log("\n3️⃣ Manual verification...");
  const { proof, ...credWithoutProof } = vc;
  console.log("\nCredential without proof:");
  console.log(JSON.stringify(credWithoutProof, null, 2));

  // Hash it
  const canonicalString = JSON.stringify(
    credWithoutProof,
    Object.keys(credWithoutProof).sort()
  );
  console.log("\nCanonical string (sorted keys):");
  console.log(canonicalString);

  const hash = crypto.hash(canonicalString);
  console.log("\nHash:", hash);

  // Try to verify the signature manually
  const ethers = require("ethers");
  const hashBytes = ethers.getBytes(hash);

  try {
    const recoveredPubKey = ethers.SigningKey.recoverPublicKey(
      hashBytes,
      proof.proofValue
    );
    console.log("\nRecovered public key:", recoveredPubKey);
    console.log("Expected public key:", identity.publicKey);
    console.log(
      "Match:",
      recoveredPubKey.toLowerCase() === identity.publicKey.toLowerCase()
    );
  } catch (error) {
    console.error("\n❌ Error recovering public key:", error.message);
  }

  // Use verifier
  console.log("\n4️⃣ Using verifier service...");
  const result = await verifier.verifyOffChainCredential(
    vc,
    identity.publicKey
  );

  console.log("\nVerification result:");
  console.log(JSON.stringify(result, null, 2));
}

debugTest().catch(console.error);
