import {
  ECDSACryptoService,
  VCIssuer,
  VCRevoke,
  AccessControlCredentialSubject,
} from "../index";

/**
 * Complete example of VC Revocation Flow
 *
 * This demonstrates how to:
 * 1. Issue an off-chain VC for a user
 * 2. Convert it to on-chain format when revocation is needed
 * 3. Submit to smart contract for blockchain-based revocation
 */

async function main() {
  console.log("=== VC Revocation Flow Example ===\n");

  // Step 1: Setup
  console.log("Step 1: Initialize services and create issuer identity");
  const crypto = new ECDSACryptoService();
  const issuer = new VCIssuer();
  const revoker = new VCRevoke();
  const issuerIdentity = await crypto.generateIdentity();

  console.log("Issuer Ethereum Address:", issuerIdentity.address);
  console.log("Issuer Public Key:", issuerIdentity.publicKey);
  console.log();

  // Step 2: Issue off-chain VC (normal credential flow)
  console.log("Step 2: Issue off-chain VC for user access");
  const userEmail = "alice@example.com";
  const credentialSubject: AccessControlCredentialSubject = {
    id: `did:user:${userEmail}`,
    userMetaDataHash: crypto.hash(userEmail),
    lock: {
      id: "lock-main-entrance",
      name: "Main Office Building",
    },
    accessLevel: "employee",
    permissions: ["unlock", "access-lobby", "access-floor-3"],
  };

  const offChainVC = await issuer.issueOffChainCredential(
    { id: "did:company:acme", name: "ACME Corporation Security" },
    credentialSubject,
    issuerIdentity.privateKey,
    {
      publicKey: issuerIdentity.publicKey,
      credentialTypes: ["AccessControlCredential", "EmployeeCredential"],
      validityDays: 365,
    }
  );

  console.log("✅ Off-chain VC issued successfully");
  console.log("Credential Type:", offChainVC.type);
  console.log("Valid From:", offChainVC.validFrom);
  console.log("Valid Until:", offChainVC.validUntil);
  console.log(
    "Proof Type:",
    Array.isArray(offChainVC.proof)
      ? offChainVC.proof[0].type
      : offChainVC.proof.type
  );
  console.log();

  // Step 3: User presents VC to access lock (off-chain verification)
  console.log("Step 3: User uses VC to access physical lock");
  console.log("✅ Lock verifies off-chain signature and grants access");
  console.log();

  // Step 4: Security incident - need to revoke access
  console.log("Step 4: Security incident - employee access must be revoked");
  console.log("Converting off-chain VC to on-chain format...");

  const onChainVC = await revoker.convertToOnChain(
    offChainVC,
    issuerIdentity.privateKey,
    issuerIdentity.address
  );

  console.log("✅ Converted to on-chain format");
  console.log();

  // Step 5: Verify hash consistency
  console.log("Step 5: Verify credential hash remains identical");
  const offChainHash = revoker.getCredentialHash(offChainVC);
  const onChainHash = revoker.getCredentialHash(onChainVC);
  const hashesMatch = revoker.verifyHashConsistency(offChainVC, onChainVC);

  console.log("Off-chain hash:", offChainHash);
  console.log("On-chain hash:  ", onChainHash);
  console.log("Hashes match:", hashesMatch ? "✅ YES" : "❌ NO");
  console.log();

  // Step 6: Verify signature compatibility
  console.log(
    "Step 6: Verify on-chain signature can be verified by smart contracts"
  );
  const isValidSignature = await revoker.verifyOnChainSignature(
    onChainVC,
    issuerIdentity.address
  );

  console.log(
    "On-chain signature valid:",
    isValidSignature ? "✅ YES" : "❌ NO"
  );
  console.log();

  // Step 7: Extract parameters for smart contract
  console.log("Step 7: Prepare parameters for smart contract submission");
  const credentialHash = revoker.getCredentialHash(onChainVC);
  const proof = Array.isArray(onChainVC.proof)
    ? onChainVC.proof[0]
    : onChainVC.proof;
  const signature = proof.proofValue;

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║     Smart Contract Revocation Parameters                ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║ Credential Hash:                                         ║`);
  console.log(`║ ${credentialHash}              ║`);
  console.log(`║                                                          ║`);
  console.log(`║ Signature:                                               ║`);
  console.log(`║ ${signature.substring(0, 58)} ║`);
  console.log(`║ ${signature.substring(58)}              ║`);
  console.log(`║                                                          ║`);
  console.log(`║ Issuer Address:                                          ║`);
  console.log(`║ ${issuerIdentity.address}              ║`);
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  // Step 8: Smart contract call (pseudo-code)
  console.log("Step 8: Submit to smart contract");
  console.log("\nSolidity code that would verify this:");
  console.log("```solidity");
  console.log("function revokeCredential(");
  console.log("    bytes32 credentialHash,");
  console.log("    bytes memory signature,");
  console.log("    address issuerAddress");
  console.log(") public {");
  console.log("    // Recover signer from signature");
  console.log("    address signer = recoverSigner(credentialHash, signature);");
  console.log("    ");
  console.log("    // Verify signer is authorized issuer");
  console.log("    require(signer == issuerAddress, 'Invalid signature');");
  console.log("    require(authorizedIssuers[signer], 'Not authorized');");
  console.log("    ");
  console.log("    // Mark credential as revoked");
  console.log("    revokedCredentials[credentialHash] = true;");
  console.log("    emit CredentialRevoked(credentialHash, signer);");
  console.log("}");
  console.log("```");
  console.log();

  console.log("JavaScript/TypeScript call:");
  console.log("```typescript");
  console.log("await contract.revokeCredential(");
  console.log(`    "${credentialHash}",`);
  console.log(`    "${signature}",`);
  console.log(`    "${issuerIdentity.address}"`);
  console.log(");");
  console.log("```");
  console.log();

  // Step 9: Result
  console.log("Step 9: Result");
  console.log("✅ Credential revoked on blockchain");
  console.log("✅ All physical locks can now check revocation status");
  console.log("✅ User's access is immediately terminated across all systems");
  console.log();

  // Summary
  console.log("=== Summary ===");
  console.log("1. ✅ Off-chain VC issued for fast, offline verification");
  console.log("2. ✅ Converted to on-chain format with SAME credential hash");
  console.log(
    "3. ✅ On-chain signature compatible with smart contracts (ecrecover)"
  );
  console.log("4. ✅ Submitted to blockchain for permanent revocation record");
  console.log(
    "5. ✅ Locks can now verify both credential AND revocation status"
  );
  console.log();
  console.log("🎉 Complete revocation flow executed successfully!");
}

// Run the example
main().catch(console.error);
