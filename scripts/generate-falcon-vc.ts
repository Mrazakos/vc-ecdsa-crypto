import { FalconCryptoService } from "../src/services/FalconCryptoService";
import { VCIssuer } from "../src/services/VCIssuer";
import { VCVerifier } from "../src/services/VCVerifier";

async function main() {
  // 1. Initialize Falcon-512 cryptographic service
  const falconService = new FalconCryptoService();

  // 2. Generate Falcon-512 Keypair
  const keypair = await falconService.generateIdentity();

  // 3. Initialize VC Issuer with Falcon service
  const issuer = new VCIssuer(falconService);

  // 4. Issue Verifiable Credential signed with Falcon-512
  const vc = await issuer.issueCredential(
    { id: "did:example:university-issuer" },
    {
      id: "did:example:student-12345",
      degree: "Master of Science in Cybersecurity",
      accessLevel: "Building-A-Lab-Access",
      issuedAt: new Date().toISOString(),
    },
    keypair.privateKey,
    keypair.publicKey,
    {
      credentialTypes: ["VerifiableCredential", "AccessControlCredential"],
      validityDays: 365,
      proofType: "Falcon512Signature2026",
    }
  );

  // 5. Verify the generated VC
  const verifier = new VCVerifier(falconService);
  const isValid = await verifier.verifyCredential(vc, keypair.publicKey);

  console.log("=== FALCON-512 VERIFIABLE CREDENTIAL (VC) ===");
  console.log(JSON.stringify(vc, null, 2));
  console.log("\n=== VERIFICATION RESULT ===");
  console.log(`Signature Valid: ${isValid}`);
}

main().catch((err) => {
  console.error("Error generating Falcon VC:", err);
  process.exit(1);
});
