import {
  VerifiableCredential,
  Credential,
  ECDSAProof,
} from "../types/w3c-vc.types";
import { ECDSACryptoService } from "./CryptoService";
import { OnChainService } from "./OnChainService";

/**
 * VC Revoke Service
 *
 * Converts OFF-CHAIN VCs to ON-CHAIN format for smart contract revocation.
 *
 * KEY CONCEPT:
 * - Off-chain VCs use raw ECDSA signatures (verified with public key)
 * - On-chain VCs use Ethereum-prefixed signatures (verified with address via ecrecover)
 * - The VC HASH must remain IDENTICAL between off-chain and on-chain versions
 * - Only the signature changes (re-signed with Ethereum prefix)
 *
 * WHY THIS IS NEEDED:
 * Smart contracts need to verify credentials using ecrecover, which requires
 * Ethereum-prefixed signatures. But the credential hash must match the
 * off-chain version to ensure we're revoking the SAME credential.
 *
 * WORKFLOW:
 * 1. User has an off-chain VC issued by VCIssuer.issueOffChainCredential()
 * 2. Admin wants to revoke it on-chain (blockchain revocation registry)
 * 3. VCRevoke converts it to on-chain format (same hash, different signature)
 * 4. Smart contract verifies using ecrecover and records revocation
 */
export class VCRevoke {
  private cryptoService: ECDSACryptoService;
  private onChainService: OnChainService;

  constructor(
    cryptoService?: ECDSACryptoService,
    onChainService?: OnChainService
  ) {
    this.cryptoService = cryptoService || new ECDSACryptoService();
    this.onChainService =
      onChainService || new OnChainService(this.cryptoService);
  }

  /**
   * Convert an off-chain VC to on-chain format for smart contract revocation
   *
   * IMPORTANT: The credential hash remains IDENTICAL to the off-chain version.
   * Only the signature is re-created using Ethereum-prefixed signing.
   *
   * @param offChainVC - The original off-chain verifiable credential
   * @param privateKey - Private key of the issuer (must match original issuer)
   * @param ethereumAddress - Ethereum address of the issuer (for verification method)
   * @returns On-chain VC with Ethereum-compatible signature
   *
   * @example
   * ```typescript
   * // Step 1: Issue off-chain VC
   * const issuer = new VCIssuer();
   * const offChainVC = await issuer.issueOffChainCredential(
   *   { id: "did:example:issuer", name: "Admin" },
   *   credentialSubject,
   *   privateKey,
   *   { publicKey: issuerIdentity.publicKey }
   * );
   *
   * // Step 2: Convert to on-chain format for revocation
   * const revoker = new VCRevoke();
   * const onChainVC = await revoker.convertToOnChain(
   *   offChainVC,
   *   privateKey,
   *   issuerIdentity.address
   * );
   *
   * // Step 3: Submit to smart contract
   * const credentialHash = revoker.getCredentialHash(onChainVC);
   * await contract.revokeCredential(
   *   credentialHash,
   *   onChainVC.proof.proofValue,
   *   issuerIdentity.address
   * );
   * ```
   */
  async convertToOnChain(
    offChainVC: VerifiableCredential,
    privateKey: string,
    ethereumAddress: string
  ): Promise<VerifiableCredential> {
    // Extract the credential document (everything except the proof)
    const { proof, ...credential } = offChainVC;

    // Create the SAME canonical hash as the off-chain version
    // This is critical - the hash must be identical!
    const credentialHash = this.createCanonicalHash(credential);

    // Re-sign with Ethereum prefix for smart contract verification
    const { signature } = await this.onChainService.signForBlockchain(
      credentialHash,
      privateKey
    );

    // Create on-chain proof
    const onChainProof: ECDSAProof = {
      type: "EcdsaSecp256k1Signature2019", // On-chain type
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: ethereumAddress, // Smart contract uses address
      proofValue: signature,
    };

    // Return VC with on-chain signature
    return {
      ...credential,
      proof: onChainProof,
    };
  }

  /**
   * Get the canonical hash of a credential
   * This is the hash that gets signed and used for revocation
   *
   * @param vc - Verifiable credential (with or without proof)
   * @returns Canonical hash of the credential
   *
   * @example
   * ```typescript
   * const revoker = new VCRevoke();
   * const hash = revoker.getCredentialHash(vc);
   * console.log("Credential hash:", hash);
   * // Submit this hash to smart contract for revocation
   * ```
   */
  getCredentialHash(vc: VerifiableCredential): string {
    // Remove proof if present
    const { proof, ...credential } = vc;
    return this.createCanonicalHash(credential);
  }

  /**
   * Verify that off-chain and on-chain VCs have the same hash
   * Useful for testing and validation
   *
   * @param offChainVC - Original off-chain VC
   * @param onChainVC - Converted on-chain VC
   * @returns True if both VCs hash to the same value
   *
   * @example
   * ```typescript
   * const revoker = new VCRevoke();
   * const onChainVC = await revoker.convertToOnChain(offChainVC, privateKey, address);
   * const isConsistent = revoker.verifyHashConsistency(offChainVC, onChainVC);
   * console.log("Hash matches:", isConsistent); // Should be true
   * ```
   */
  verifyHashConsistency(
    offChainVC: VerifiableCredential,
    onChainVC: VerifiableCredential
  ): boolean {
    const offChainHash = this.getCredentialHash(offChainVC);
    const onChainHash = this.getCredentialHash(onChainVC);
    return offChainHash === onChainHash;
  }

  /**
   * Verify the on-chain signature
   * Confirms the signature can be verified by smart contracts
   *
   * @param onChainVC - On-chain VC to verify
   * @param expectedAddress - Expected signer address
   * @returns True if signature is valid for the given address
   *
   * @example
   * ```typescript
   * const revoker = new VCRevoke();
   * const isValid = await revoker.verifyOnChainSignature(
   *   onChainVC,
   *   issuerIdentity.address
   * );
   * console.log("Signature valid:", isValid);
   * ```
   */
  async verifyOnChainSignature(
    onChainVC: VerifiableCredential,
    expectedAddress: string
  ): Promise<boolean> {
    const credentialHash = this.getCredentialHash(onChainVC);

    // Handle proof as single or array
    const proof = Array.isArray(onChainVC.proof)
      ? onChainVC.proof[0]
      : onChainVC.proof;

    if (!proof || !proof.proofValue) {
      throw new Error("VC does not have a valid proof");
    }

    return this.onChainService.verifyBlockchainSignature(
      credentialHash,
      proof.proofValue,
      expectedAddress
    );
  }

  /**
   * Create a canonical hash of the credential
   * Delegates to ECDSACryptoService for consistent hashing
   *
   * @private
   */
  private createCanonicalHash(credential: Credential): string {
    return this.cryptoService.createCanonicalHash(credential);
  }
}
