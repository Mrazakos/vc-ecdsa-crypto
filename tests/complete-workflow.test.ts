import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  AccessControlCredentialSubject,
} from "../src/index";

describe("Complete Lock Access Control Workflow", () => {
  let crypto: ECDSACryptoService;
  let issuer: VCIssuer;
  let verifier: VCVerifier;

  beforeAll(() => {
    crypto = new ECDSACryptoService();
    issuer = new VCIssuer();
    verifier = new VCVerifier();
  });

  it("should execute complete workflow: generate identity -> issue VC -> verify VC", async () => {
    // ========================================================================
    // STEP 1: Generate Lock Identity (Issuer)
    // ========================================================================
    const lockIdentity = await crypto.generateIdentity();

    expect(lockIdentity.privateKey).toBeTruthy();
    expect(lockIdentity.publicKey).toBeTruthy();
    expect(lockIdentity.address).toBeTruthy();
    expect(lockIdentity.privateKey).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(lockIdentity.publicKey).toMatch(/^0x04[0-9a-f]{128}$/i);
    expect(lockIdentity.address).toMatch(/^0x[0-9a-f]{40}$/i);

    console.log("\n✅ Step 1: Lock identity generated");
    console.log("  Address:", lockIdentity.address);

    // ========================================================================
    // STEP 2: Prepare User Metadata
    // ========================================================================
    const userMetaData = {
      email: "pubk@test.com",
      name: "Pukb test",
    };

    const userMetaDataHash = crypto.hash(JSON.stringify(userMetaData));
    const userId = `did:user:${userMetaDataHash.substring(0, 16)}`;

    expect(userMetaDataHash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(userId).toContain("did:user:");

    console.log("\n✅ Step 2: User metadata prepared");
    console.log("  User ID:", userId);
    console.log("  Hash:", userMetaDataHash);

    // ========================================================================
    // STEP 3: Issue Access Control Credential
    // ========================================================================
    const lockId = "3";
    const lockName = "Test lock";

    const credentialSubject: AccessControlCredentialSubject = {
      id: userId,
      userMetaDataHash: userMetaDataHash,
      lock: {
        id: lockId,
        name: lockName,
      },
      accessLevel: "standard",
      permissions: ["unlock"],
    };

    const credential = await issuer.issueOffChainCredential(
      {
        id: `did:lock:${lockId}`,
        name: lockName,
      },
      credentialSubject,
      lockIdentity.privateKey,
      {
        publicKey: lockIdentity.publicKey,
        credentialTypes: ["LockAccessCredential"],
        credentialId: `vc:${generateTestUUID()}`,
      }
    );

    // Verify credential structure
    expect(credential["@context"]).toContain(
      "https://www.w3.org/ns/credentials/v2"
    );
    expect(credential.type).toContain("VerifiableCredential");
    expect(credential.type).toContain("LockAccessCredential");
    expect(credential.issuer).toEqual({
      id: `did:lock:${lockId}`,
      name: lockName,
    });
    expect(credential.credentialSubject).toEqual(credentialSubject);
    expect(credential.proof).toBeDefined();

    const proof = Array.isArray(credential.proof)
      ? credential.proof[0]
      : credential.proof;
    expect(proof.type).toBe("EcdsaSecp256k1RecoverySignature2020");
    expect(proof.proofValue).toMatch(/^0x[0-9a-f]+$/i);

    console.log("\n✅ Step 3: Credential issued");
    console.log("  Credential ID:", credential.id);
    console.log("  Proof Type:", proof.type);

    // ========================================================================
    // STEP 4: Format with Additional Metadata (Your App Format)
    // ========================================================================
    const formattedCredential = {
      ...credential,
      credentialType: "access",
      userMetaData: userMetaData,
      lockId: parseInt(lockId),
      lockNickname: lockName,
    };

    expect(formattedCredential.credentialType).toBe("access");
    expect(formattedCredential.userMetaData).toEqual(userMetaData);
    expect(formattedCredential.lockId).toBe(3);
    expect(formattedCredential.lockNickname).toBe(lockName);

    console.log("\n✅ Step 4: Credential formatted with metadata");
    console.log("  Credential Type:", formattedCredential.credentialType);
    console.log("  Lock ID:", formattedCredential.lockId);

    // ========================================================================
    // STEP 5: Verify the Credential
    // ========================================================================
    const verificationResult = await verifier.verifyOffChainCredential(
      credential,
      lockIdentity.publicKey,
      {
        checkExpiration: true,
        checkNotBefore: true,
      }
    );

    expect(verificationResult.verified).toBe(true);
    expect(verificationResult.error).toBeUndefined();
    expect(verificationResult.details).toBeDefined();
    expect(verificationResult.details?.issuer).toBe(`did:lock:${lockId}`);
    expect(verificationResult.details?.subject).toBe(userId);
    expect(verificationResult.details?.isExpired).toBe(false);

    console.log("\n✅ Step 5: Credential verified");
    console.log("  Verified:", verificationResult.verified);
    console.log("  Issuer:", verificationResult.details?.issuer);
    console.log("  Subject:", verificationResult.details?.subject);

    // ========================================================================
    // STEP 6: Extract Access Control Information
    // ========================================================================
    const subject =
      credential.credentialSubject as AccessControlCredentialSubject;

    expect(subject.lock?.id).toBe(lockId);
    expect(subject.lock?.name).toBe(lockName);
    expect(subject.accessLevel).toBe("standard");
    expect(subject.permissions).toContain("unlock");

    console.log("\n✅ Step 6: Access control info extracted");
    console.log("  Lock ID:", subject.lock?.id);
    console.log("  Permissions:", subject.permissions?.join(", "));

    // ========================================================================
    // STEP 7: Simulate Lock Access Decision
    // ========================================================================
    const requestedLockId = "3";
    const hasAccessToThisLock = subject.lock?.id === requestedLockId;
    const hasUnlockPermission =
      subject.permissions?.includes("unlock") || false;

    const accessGranted =
      verificationResult.verified && hasAccessToThisLock && hasUnlockPermission;

    expect(accessGranted).toBe(true);

    console.log("\n✅ Step 7: Access decision made");
    console.log("  Access Granted:", accessGranted);
    console.log("  🔓 Lock unlocked!");

    // ========================================================================
    // BONUS: Get Credential Hash for Revocation
    // ========================================================================
    const credentialHash = crypto.createCanonicalHash({
      "@context": credential["@context"],
      type: credential.type,
      issuer: credential.issuer,
      validFrom: credential.validFrom,
      credentialSubject: credential.credentialSubject,
      id: credential.id,
    });

    expect(credentialHash).toMatch(/^0x[0-9a-f]{64}$/i);

    console.log("\n✅ Bonus: Credential hash obtained");
    console.log("  Hash:", credentialHash);
    console.log("\n🎉 Complete workflow test passed!");
  });

  it("should deny access if credential is for different lock", async () => {
    const lockIdentity = await crypto.generateIdentity();
    const userMetaDataHash = crypto.hash(
      JSON.stringify({ email: "user@test.com" })
    );

    // Issue credential for Lock #3
    const credentialSubject: AccessControlCredentialSubject = {
      id: "did:user:test",
      userMetaDataHash,
      lock: {
        id: "3",
        name: "Lock 3",
      },
      accessLevel: "standard",
      permissions: ["unlock"],
    };

    const credential = await issuer.issueOffChainCredential(
      { id: "did:lock:3", name: "Lock 3" },
      credentialSubject,
      lockIdentity.privateKey,
      {
        publicKey: lockIdentity.publicKey,
        credentialTypes: ["LockAccessCredential"],
      }
    );

    // Verify credential is valid
    const verificationResult = await verifier.verifyOffChainCredential(
      credential,
      lockIdentity.publicKey
    );
    expect(verificationResult.verified).toBe(true);

    // Try to use it on Lock #5
    const subject =
      credential.credentialSubject as AccessControlCredentialSubject;
    const requestedLockId = "5";
    const hasAccessToThisLock = subject.lock?.id === requestedLockId;

    expect(hasAccessToThisLock).toBe(false);
    console.log("\n✅ Access correctly denied for wrong lock");
  });

  it("should deny access if credential lacks unlock permission", async () => {
    const lockIdentity = await crypto.generateIdentity();
    const userMetaDataHash = crypto.hash(
      JSON.stringify({ email: "user@test.com" })
    );

    // Issue credential with only 'view' permission, no 'unlock'
    const credentialSubject: AccessControlCredentialSubject = {
      id: "did:user:test",
      userMetaDataHash,
      lock: {
        id: "3",
        name: "Lock 3",
      },
      accessLevel: "view-only",
      permissions: ["view"], // No unlock permission!
    };

    const credential = await issuer.issueOffChainCredential(
      { id: "did:lock:3", name: "Lock 3" },
      credentialSubject,
      lockIdentity.privateKey,
      {
        publicKey: lockIdentity.publicKey,
        credentialTypes: ["LockAccessCredential"],
      }
    );

    // Verify credential is valid
    const verificationResult = await verifier.verifyOffChainCredential(
      credential,
      lockIdentity.publicKey
    );
    expect(verificationResult.verified).toBe(true);

    // Check permissions
    const subject =
      credential.credentialSubject as AccessControlCredentialSubject;
    const hasUnlockPermission =
      subject.permissions?.includes("unlock") || false;

    expect(hasUnlockPermission).toBe(false);
    console.log("\n✅ Access correctly denied - missing unlock permission");
  });

  it("should match the exact format from your example", async () => {
    const lockIdentity = await crypto.generateIdentity();
    const userMetaData = {
      email: "pubk@test.com",
      name: "Pukb test",
    };
    const userMetaDataHash = crypto.hash(JSON.stringify(userMetaData));

    const credential = await issuer.issueOffChainCredential(
      { id: "did:lock:3", name: "Test lock" },
      {
        id: "did:user:0x129e9b70a33dbd",
        userMetaDataHash,
        lock: { id: "3", name: "Test lock" },
        accessLevel: "standard",
        permissions: ["unlock"],
      },
      lockIdentity.privateKey,
      {
        publicKey: lockIdentity.publicKey,
        credentialTypes: ["LockAccessCredential"],
        credentialId: "vc:11c27136-2a67-4203-a105-c36a290d4cd9",
      }
    );

    // Format matches your example
    const formattedCredential = {
      ...credential,
      credentialType: "access",
      userMetaData,
      lockId: 3,
      lockNickname: "Test lock",
    };

    // Verify structure matches
    expect(formattedCredential["@context"]).toEqual([
      "https://www.w3.org/ns/credentials/v2",
    ]);
    expect(formattedCredential.type).toEqual([
      "VerifiableCredential",
      "LockAccessCredential",
    ]);
    expect(formattedCredential.issuer).toEqual({
      id: "did:lock:3",
      name: "Test lock",
    });
    expect(formattedCredential.credentialSubject).toMatchObject({
      id: "did:user:0x129e9b70a33dbd",
      userMetaDataHash,
      lock: { id: "3", name: "Test lock" },
      accessLevel: "standard",
      permissions: ["unlock"],
    });
    expect(formattedCredential.id).toBe(
      "vc:11c27136-2a67-4203-a105-c36a290d4cd9"
    );

    const proof = Array.isArray(formattedCredential.proof)
      ? formattedCredential.proof[0]
      : formattedCredential.proof;
    expect(proof.type).toBe("EcdsaSecp256k1RecoverySignature2020");
    expect(formattedCredential.credentialType).toBe("access");
    expect(formattedCredential.userMetaData).toEqual(userMetaData);
    expect(formattedCredential.lockId).toBe(3);
    expect(formattedCredential.lockNickname).toBe("Test lock");

    console.log("\n✅ Credential format matches your example exactly!");
    console.log(JSON.stringify(formattedCredential, null, 2));
  });
});

function generateTestUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
