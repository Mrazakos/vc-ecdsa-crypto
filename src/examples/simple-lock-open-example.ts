import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  AccessControlCredentialSubject,
} from "../index";

async function main() {
  // 1. Generate keypair for the lock admin (issuer)
  const crypto = new ECDSACryptoService();
  const issuerIdentity = await crypto.generateIdentity();
  const userEmail = "example@user.com";

  // 2. Issue a VC for lock #1 (Test Lock) to example@user.com
  const issuer = new VCIssuer();
  const lockId = "lock-1";
  const lockName = "Test Lock";
  const credentialSubject: AccessControlCredentialSubject = {
    id: `did:key:${issuerIdentity.publicKey}`,
    userMetaDataHash: crypto.hash(userEmail),
    lock: {
      id: lockId,
      name: lockName,
    },
    accessLevel: "standard",
    permissions: ["unlock"],
  };
  const vc = await issuer.issueOffChainCredential(
    { id: "did:example:lock-admin", name: "Lock Admin" },
    credentialSubject,
    issuerIdentity.privateKey,
    {
      publicKey: issuerIdentity.publicKey,
      credentialTypes: ["LockAccessCredential"],
    }
  );
  console.log("Issued Verifiable Credential:\n", vc);

  // 3. Simulate the lock verifying the credential and opening
  const verifier = new VCVerifier();
  const result = await verifier.verifyOffChainCredential(
    vc,
    issuerIdentity.publicKey,
    { checkExpiration: true }
  );

  console.log("\nVerification Result:", result);
  if (
    result.verified &&
    (vc.credentialSubject as AccessControlCredentialSubject).lock?.id === lockId
  ) {
    console.log("\n✅ Access granted! Lock opened for:", userEmail);
    console.log("Lock:", lockName, "(ID:", lockId + ")");
  } else {
    console.log("\n❌ Access denied!");
  }
}

main().catch(console.error);
