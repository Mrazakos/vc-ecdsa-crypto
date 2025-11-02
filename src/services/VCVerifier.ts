import {
  VerifiableCredential,
  Credential,
  VerificationResult,
  ECDSAProof,
  ISO8601DateTime,
} from "../types/w3c-vc.types";
import { ECDSACryptoService } from "./CryptoService";
import { OffChainService } from "./OffChainService";
import { OnChainService } from "./OnChainService";

/**
 * VC Verifier Service
 *
 * Handles verification and validation of W3C Verifiable Credentials.
 *
 * VERIFICATION vs VALIDATION:
 * - VERIFICATION: Cryptographic check - is the signature valid?
 * - VALIDATION: Business logic check - is this credential acceptable?
 *   (e.g., not expired, correct issuer, meets requirements)
 *
 * This service handles both.
 */
export class VCVerifier {
  private cryptoService: ECDSACryptoService;
  private offChainService: OffChainService;

  constructor(
    cryptoService?: ECDSACryptoService,
    offChainService?: OffChainService
  ) {
    this.cryptoService = cryptoService || new ECDSACryptoService();
    this.offChainService =
      offChainService || new OffChainService(this.cryptoService);
  }

  /**
   * Verify an OFF-CHAIN Verifiable Credential
   * Uses raw ECDSA verification with full public key
   *
   * @param vc - The verifiable credential to verify
   * @param publicKey - Full 65-byte public key of the issuer
   * @param options - Validation options
   * @returns Verification result
   *
   * @example
   * ```typescript
   * const verifier = new VCVerifier();
   * const result = await verifier.verifyOffChainCredential(
   *   vc,
   *   issuerPublicKey,
   *   { checkExpiration: true }
   * );
   *
   * if (result.verified) {
   *   // Grant access
   *   console.log("Credential is valid!", result.details);
   * } else {
   *   console.error("Credential invalid:", result.error);
   * }
   * ```
   */
  async verifyOffChainCredential(
    vc: VerifiableCredential,
    publicKey: string,
    options: {
      checkExpiration?: boolean;
      checkNotBefore?: boolean;
      currentTime?: Date;
    } = {}
  ): Promise<VerificationResult> {
    try {
      // Extract proof
      const proof = this.extractProof(vc);
      if (!proof) {
        return {
          verified: false,
          error: "No proof found in credential",
        };
      }

      // Recreate the credential without proof for verification
      const { proof: _proof, ...credentialWithoutProof } = vc;
      const credential = credentialWithoutProof as Credential;

      // Create canonical hash (same as signing)
      const credentialHash = this.createCanonicalHash(credential);
      // Verify signature using off-chain service
      const signatureValid = await this.offChainService.verifySignature(
        credentialHash,
        proof.proofValue,
        publicKey
      );

      if (!signatureValid) {
        return {
          verified: false,
          error: "Invalid signature",
        };
      }

      // Perform validation checks
      const validationResult = this.validateCredential(vc, options);
      if (!validationResult.valid) {
        return {
          verified: false,
          error: validationResult.reason,
        };
      }

      // Success!
      return {
        verified: true,
        verifiableCredential: vc,
        details: this.extractCredentialDetails(vc),
      };
    } catch (error) {
      return {
        verified: false,
        error: `Verification failed: ${error}`,
      };
    }
  }

  /**
   * Validate credential against business rules
   * This is separate from cryptographic verification
   *
   * @private
   */
  private validateCredential(
    vc: VerifiableCredential,
    options: {
      checkExpiration?: boolean;
      checkNotBefore?: boolean;
      currentTime?: Date;
    }
  ): { valid: boolean; reason?: string } {
    const currentTime = options.currentTime || new Date();

    // Check if credential has not yet become valid
    if (options.checkNotBefore !== false && vc.validFrom) {
      const validFrom = new Date(vc.validFrom);
      if (currentTime < validFrom) {
        return {
          valid: false,
          reason: `Credential not yet valid. Valid from: ${vc.validFrom}`,
        };
      }
    }

    // Check if credential has expired
    if (options.checkExpiration !== false && vc.validUntil) {
      const validUntil = new Date(vc.validUntil);
      if (currentTime > validUntil) {
        return {
          valid: false,
          reason: `Credential expired. Valid until: ${vc.validUntil}`,
        };
      }
    }

    // Check required fields
    if (!vc["@context"] || !vc.type || !vc.issuer || !vc.credentialSubject) {
      return {
        valid: false,
        reason: "Credential missing required fields",
      };
    }

    // Check that type includes "VerifiableCredential"
    if (!vc.type.includes("VerifiableCredential")) {
      return {
        valid: false,
        reason: 'Credential type must include "VerifiableCredential"',
      };
    }

    return { valid: true };
  }

  /**
   * Extract proof from credential
   * Handles both single proof and array of proofs
   *
   * @private
   */
  private extractProof(vc: VerifiableCredential): ECDSAProof | null {
    if (!vc.proof) return null;

    const proof = Array.isArray(vc.proof) ? vc.proof[0] : vc.proof;

    return proof as ECDSAProof;
  }

  /**
   * Extract credential details for result
   *
   * @private
   */
  private extractCredentialDetails(vc: VerifiableCredential) {
    const issuer = typeof vc.issuer === "string" ? vc.issuer : vc.issuer.id;

    const subject = Array.isArray(vc.credentialSubject)
      ? vc.credentialSubject[0]?.id
      : vc.credentialSubject.id;

    const now = new Date();
    const isExpired = vc.validUntil ? new Date(vc.validUntil) < now : false;

    return {
      issuer,
      subject,
      validFrom: vc.validFrom,
      validUntil: vc.validUntil,
      isExpired,
      types: vc.type,
      id: vc.id,
    };
  }

  /**
   * Create canonical hash (must match issuer's implementation)
   * Delegates to ECDSACryptoService for consistent hashing
   *
   * @private
   */
  private createCanonicalHash(credential: Credential): string {
    return this.cryptoService.createCanonicalHash(credential);
  }

  /**
   * Check if credential is still valid (not expired, not before)
   * Quick check without full cryptographic verification
   *
   * @param vc - Credential to check
   * @param currentTime - Optional current time (for testing)
   * @returns True if credential is currently valid
   */
  isCredentialCurrentlyValid(
    vc: VerifiableCredential,
    currentTime?: Date
  ): boolean {
    const validation = this.validateCredential(vc, {
      checkExpiration: true,
      checkNotBefore: true,
      currentTime,
    });
    return validation.valid;
  }
}
