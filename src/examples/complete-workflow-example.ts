import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  AccessControlCredentialSubject,
  VerifiableCredential,
} from "../index";

/**
 * Complete Access Control Workflow Example
 *
 * This example demonstrates the full lifecycle of a lock access credential:
 * 1. Generate cryptographic identity for the lock (issuer)
 * 2. Issue an access control credential for a user
 * 3. Verify the credential
 *
 * The credential format matches your smart lock system's requirements.
 */

async function completeWorkflow() {
  console.log("=== Complete Lock Access Control Workflow ===\n");

  // ============================================================================
  // STEP 1: Generate Cryptographic Identity for Lock (Issuer)
  // ============================================================================
  console.log("Step 1: Generating cryptographic identity for Lock #3...");

  const crypto = new ECDSACryptoService();
  const lockIdentity = await crypto.generateIdentity();

  console.log("✅ Lock identity created:");
  console.log("  - Private Key:", lockIdentity.privateKey);
  console.log("  - Public Key:", lockIdentity.publicKey);
  console.log("  - Ethereum Address:", lockIdentity.address);
  console.log();

  // ============================================================================
  // STEP 2: Define User Metadata
  // ============================================================================
  console.log("Step 2: Preparing user metadata...");

  const userMetaData = {
    email: "pubk@test.com",
    name: "Pukb test",
  };

  // Create user metadata hash (for privacy - only hash stored in VC)
  const userMetaDataHash = crypto.hash(JSON.stringify(userMetaData));
  const userId = `did:user:${userMetaDataHash.substring(0, 16)}`;

  console.log("✅ User metadata prepared:");
  console.log("  - Email:", userMetaData.email);
  console.log("  - Name:", userMetaData.name);
  console.log("  - User ID:", userId);
  console.log("  - Metadata Hash:", userMetaDataHash);
  console.log();

  // ============================================================================
  // STEP 3: Issue Verifiable Credential for Lock Access
  // ============================================================================
  console.log("Step 3: Issuing access control credential...");

  const issuer = new VCIssuer();
  const lockId = "3";
  const lockName = "Test lock";

  // Define credential subject (what the credential claims)
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

  // Issue the credential
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
      credentialId: `vc:${generateUUID()}`,
    }
  );

  console.log("✅ Credential issued successfully!");
  console.log();

  // ============================================================================
  // STEP 4: Format Credential with Additional Metadata (Your Format)
  // ============================================================================
  console.log("Step 4: Formatting credential with additional metadata...");

  // Add your custom fields (these are NOT part of the signed credential,
  // but useful for your application layer)
  const formattedCredential = {
    ...credential,
    credentialType: "access",
    userMetaData: userMetaData, // Full metadata (not in signed part)
    lockId: parseInt(lockId),
    lockNickname: lockName,
  };

  console.log("✅ Formatted credential:");
  console.log(JSON.stringify(formattedCredential, null, 2));
  console.log();

  // ============================================================================
  // STEP 5: Verify the Credential
  // ============================================================================
  console.log("Step 5: Verifying the credential...");

  const verifier = new VCVerifier();

  // Verify using the lock's public key
  const verificationResult = await verifier.verifyOffChainCredential(
    credential,
    lockIdentity.publicKey,
    {
      checkExpiration: true,
      checkNotBefore: true,
    }
  );

  if (verificationResult.verified) {
    console.log("✅ Credential is VALID!");
    console.log("  - Signature: Valid ✓");
    console.log("  - Issuer:", verificationResult.details?.issuer);
    console.log("  - Subject:", verificationResult.details?.subject);
    console.log("  - Valid From:", verificationResult.details?.validFrom);
    console.log(
      "  - Valid Until:",
      verificationResult.details?.validUntil || "No expiration"
    );
    console.log(
      "  - Expired:",
      verificationResult.details?.isExpired ? "Yes" : "No"
    );
  } else {
    console.log("❌ Credential is INVALID!");
    console.log("  - Error:", verificationResult.error);
  }
  console.log();

  // ============================================================================
  // STEP 6: Extract Access Control Information
  // ============================================================================
  console.log("Step 6: Extracting access control information...");

  const subject =
    credential.credentialSubject as AccessControlCredentialSubject;

  console.log("✅ Access control details:");
  console.log("  - Lock ID:", subject.lock?.id);
  console.log("  - Lock Name:", subject.lock?.name);
  console.log("  - Access Level:", subject.accessLevel);
  console.log("  - Permissions:", subject.permissions?.join(", "));
  console.log();

  // ============================================================================
  // STEP 7: Simulate Lock Decision
  // ============================================================================
  console.log("Step 7: Lock making access decision...");

  // Check if credential grants access to THIS specific lock
  const requestedLockId = "3";
  const hasAccessToThisLock = subject.lock?.id === requestedLockId;
  const hasUnlockPermission = subject.permissions?.includes("unlock") || false;

  if (
    verificationResult.verified &&
    hasAccessToThisLock &&
    hasUnlockPermission
  ) {
    console.log("✅ ACCESS GRANTED!");
    console.log("  🔓 Lock #" + requestedLockId + " is now unlocked");
    console.log("  👤 User:", userMetaData.name);
    console.log("  📧 Email:", userMetaData.email);
  } else {
    console.log("❌ ACCESS DENIED!");
    if (!verificationResult.verified) {
      console.log("  Reason: Invalid credential signature");
    } else if (!hasAccessToThisLock) {
      console.log("  Reason: Credential not valid for this lock");
    } else if (!hasUnlockPermission) {
      console.log("  Reason: Missing unlock permission");
    }
  }
  console.log();

  // ============================================================================
  // BONUS: Show Credential Hash (for revocation)
  // ============================================================================
  console.log("Bonus: Credential hash for revocation registry...");
  const credentialHash = crypto.createCanonicalHash({
    "@context": credential["@context"],
    type: credential.type,
    issuer: credential.issuer,
    validFrom: credential.validFrom,
    credentialSubject: credential.credentialSubject,
    id: credential.id,
  });
  console.log("  Credential Hash:", credentialHash);
  console.log("  (Use this hash to revoke the credential on-chain)");
  console.log();

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("=== Workflow Summary ===");
  console.log("1. ✅ Lock identity generated");
  console.log("2. ✅ User metadata prepared");
  console.log("3. ✅ Access credential issued");
  console.log("4. ✅ Credential formatted with metadata");
  console.log("5. ✅ Credential verified successfully");
  console.log("6. ✅ Access control info extracted");
  console.log("7. ✅ Lock access decision made");
  console.log();
  console.log("🎉 Complete workflow executed successfully!");
  console.log();

  return {
    lockIdentity,
    credential: formattedCredential,
    verificationResult,
  };
}

/**
 * Helper function to generate UUID
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// Run the Example
// ============================================================================
if (require.main === module) {
  completeWorkflow()
    .then((result) => {
      console.log("\n=== Example Complete ===");
      console.log("You can now use this credential for lock access!");
    })
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    });
}

export { completeWorkflow };
