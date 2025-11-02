import {
  ECDSACryptoService,
  VCIssuer,
  VCRevoke,
  AccessControlCredentialSubject,
} from "../src/index";

describe("VCRevoke - Convert Off-Chain VC to On-Chain Format", () => {
  let crypto: ECDSACryptoService;
  let issuer: VCIssuer;
  let revoker: VCRevoke;
  let issuerIdentity: any;

  beforeAll(async () => {
    crypto = new ECDSACryptoService();
    issuer = new VCIssuer();
    revoker = new VCRevoke();
    issuerIdentity = await crypto.generateIdentity();
  });

  it("should convert off-chain VC to on-chain format with same hash", async () => {
    // 1. Issue an off-chain VC (normal flow)
    const userEmail = "user@example.com";
    const credentialSubject: AccessControlCredentialSubject = {
      id: `did:user:${userEmail}`,
      userMetaDataHash: crypto.hash(userEmail),
      lock: {
        id: "lock-123",
        name: "Main Office Door",
      },
      accessLevel: "standard",
      permissions: ["unlock"],
    };

    const offChainVC = await issuer.issueOffChainCredential(
      { id: "did:example:issuer", name: "Building Admin" },
      credentialSubject,
      issuerIdentity.privateKey,
      {
        publicKey: issuerIdentity.publicKey,
        credentialTypes: ["LockAccessCredential"],
      }
    );

    // 2. Convert to on-chain format for smart contract revocation
    const onChainVC = await revoker.convertToOnChain(
      offChainVC,
      issuerIdentity.privateKey,
      issuerIdentity.address
    );

    // 3. Verify the hash is identical
    const offChainHash = revoker.getCredentialHash(offChainVC);
    const onChainHash = revoker.getCredentialHash(onChainVC);

    console.log("Off-chain hash:", offChainHash);
    console.log("On-chain hash:", onChainHash);
    console.log("Hashes match:", offChainHash === onChainHash);

    expect(offChainHash).toBe(onChainHash);
    expect(revoker.verifyHashConsistency(offChainVC, onChainVC)).toBe(true);

    // 4. Verify the proof types are different
    const offChainProof = Array.isArray(offChainVC.proof)
      ? offChainVC.proof[0]
      : offChainVC.proof;
    const onChainProof = Array.isArray(onChainVC.proof)
      ? onChainVC.proof[0]
      : onChainVC.proof;

    expect(offChainProof.type).toBe("EcdsaSecp256k1RecoverySignature2020");
    expect(onChainProof.type).toBe("EcdsaSecp256k1Signature2019");

    // 5. Verify signatures are different (different signing methods)
    expect(offChainProof.proofValue).not.toBe(onChainProof.proofValue);

    // 6. Verify on-chain signature is valid
    const isValid = await revoker.verifyOnChainSignature(
      onChainVC,
      issuerIdentity.address
    );
    expect(isValid).toBe(true);
  });

  it("should create on-chain signature verifiable by smart contracts", async () => {
    // Issue off-chain VC
    const offChainVC = await issuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      {
        id: "did:user:test",
        userMetaDataHash: crypto.hash("test@example.com"),
      },
      issuerIdentity.privateKey,
      { publicKey: issuerIdentity.publicKey }
    );

    // Convert to on-chain
    const onChainVC = await revoker.convertToOnChain(
      offChainVC,
      issuerIdentity.privateKey,
      issuerIdentity.address
    );

    // Get the hash and signature for smart contract
    const credentialHash = revoker.getCredentialHash(onChainVC);
    const proof = Array.isArray(onChainVC.proof)
      ? onChainVC.proof[0]
      : onChainVC.proof;
    const signature = proof.proofValue;

    console.log("\n=== Smart Contract Parameters ===");
    console.log("Credential Hash:", credentialHash);
    console.log("Signature:", signature);
    console.log("Issuer Address:", issuerIdentity.address);

    // Verify this would work in smart contract
    const isValid = await revoker.verifyOnChainSignature(
      onChainVC,
      issuerIdentity.address
    );
    expect(isValid).toBe(true);
  });

  it("should fail verification with wrong address", async () => {
    const offChainVC = await issuer.issueOffChainCredential(
      { id: "did:example:issuer" },
      { id: "did:user:test", userMetaDataHash: crypto.hash("test") },
      issuerIdentity.privateKey,
      { publicKey: issuerIdentity.publicKey }
    );

    const onChainVC = await revoker.convertToOnChain(
      offChainVC,
      issuerIdentity.privateKey,
      issuerIdentity.address
    );

    // Create wrong identity
    const wrongIdentity = await crypto.generateIdentity();

    // Should fail with wrong address
    const isValid = await revoker.verifyOnChainSignature(
      onChainVC,
      wrongIdentity.address
    );
    expect(isValid).toBe(false);
  });

  it("should maintain credential integrity across conversion", async () => {
    const credentialSubject: AccessControlCredentialSubject = {
      id: "did:user:alice",
      userMetaDataHash: crypto.hash("alice@example.com"),
      lock: {
        id: "lock-456",
        name: "Server Room",
      },
      accessLevel: "admin",
      permissions: ["unlock", "configure", "monitor"],
    };

    const offChainVC = await issuer.issueOffChainCredential(
      { id: "did:example:issuer", name: "IT Department" },
      credentialSubject,
      issuerIdentity.privateKey,
      {
        publicKey: issuerIdentity.publicKey,
        credentialTypes: ["AccessControlCredential", "AdminCredential"],
        validityDays: 90,
      }
    );

    const onChainVC = await revoker.convertToOnChain(
      offChainVC,
      issuerIdentity.privateKey,
      issuerIdentity.address
    );

    // Verify all credential data is preserved
    expect(onChainVC["@context"]).toEqual(offChainVC["@context"]);
    expect(onChainVC.type).toEqual(offChainVC.type);
    expect(onChainVC.issuer).toEqual(offChainVC.issuer);
    expect(onChainVC.validFrom).toBe(offChainVC.validFrom);
    expect(onChainVC.validUntil).toBe(offChainVC.validUntil);
    expect(onChainVC.credentialSubject).toEqual(offChainVC.credentialSubject);

    // Only proof should be different
    const offChainProof = Array.isArray(offChainVC.proof)
      ? offChainVC.proof[0]
      : offChainVC.proof;
    const onChainProof = Array.isArray(onChainVC.proof)
      ? onChainVC.proof[0]
      : onChainVC.proof;

    expect(onChainProof.type).not.toBe(offChainProof.type);
    expect(onChainProof.proofValue).not.toBe(offChainProof.proofValue);
    expect(onChainProof.verificationMethod).toBe(issuerIdentity.address);
  });

  it("should work with example from documentation", async () => {
    // Step 1: Issue off-chain VC
    const offChainVC = await issuer.issueOffChainCredential(
      { id: "did:example:issuer", name: "Admin" },
      {
        id: "did:user:bob",
        userMetaDataHash: crypto.hash("bob@example.com"),
        lock: { id: "lock-789", name: "Lab Door" },
      },
      issuerIdentity.privateKey,
      { publicKey: issuerIdentity.publicKey }
    );

    // Step 2: Convert to on-chain format for revocation
    const onChainVC = await revoker.convertToOnChain(
      offChainVC,
      issuerIdentity.privateKey,
      issuerIdentity.address
    );

    // Step 3: Get parameters for smart contract
    const credentialHash = revoker.getCredentialHash(onChainVC);
    const proof = Array.isArray(onChainVC.proof)
      ? onChainVC.proof[0]
      : onChainVC.proof;

    console.log("\n=== Revocation Flow ===");
    console.log("1. Off-chain VC issued");
    console.log("2. Converted to on-chain format");
    console.log("3. Ready for smart contract submission:");
    console.log("   - credentialHash:", credentialHash);
    console.log("   - signature:", proof.proofValue);
    console.log("   - issuerAddress:", issuerIdentity.address);

    // This would be submitted to smart contract:
    // await contract.revokeCredential(
    //   credentialHash,
    //   proof.proofValue,
    //   issuerIdentity.address
    // );

    expect(credentialHash).toBeTruthy();
    expect(proof.proofValue).toBeTruthy();
    expect(issuerIdentity.address).toBeTruthy();
  });
});
