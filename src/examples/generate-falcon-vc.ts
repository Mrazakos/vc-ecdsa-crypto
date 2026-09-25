import { FalconCryptoService } from "../services/FalconCryptoService";
import { VCIssuer } from "../services/VCIssuer";
import { VCVerifier } from "../services/VCVerifier";

async function run() {
  // 1. Instantiate Falcon-512 cryptographic service
  const falconService = new FalconCryptoService();

  // 2. Generate Falcon-512 Keypair
  const identity = await falconService.generateIdentity();

  // 3. Instantiate Verifiable Credential Issuer
  const issuer = new VCIssuer(falconService);

  // 4. Issue Falcon-512 signed Verifiable Credential
  const vc = await issuer.issueCredential(
    { id: "did:example:university-issuer" },
    {
      id: "did:example:student-12345",
      degree: "Master of Science in Cybersecurity",
      accessLevel: "Building-A-Lab-Access",
      issuedAt: "2026-08-25T14:00:00Z",
    },
    identity.privateKey,
    identity.publicKey,
    {
      credentialTypes: ["VerifiableCredential", "AccessControlCredential"],
      validityDays: 365,
      proofType: "Falcon512Signature2026",
    }
  );

  // 5. Verify the generated VC signature
  const verifier = new VCVerifier(falconService);
  const result = await verifier.verifyCredential(vc, identity.publicKey);

  console.log("=== FALCON-512 VERIFIABLE CREDENTIAL (VC) ===");
  console.log(JSON.stringify(vc, null, 2));
  console.log("\n=== VERIFICATION RESULT ===");
  console.log(`Verified: ${result.verified}`);
}

run().catch((err) => {
  console.error("Error generating Falcon VC:", err);
  process.exit(1);
});
