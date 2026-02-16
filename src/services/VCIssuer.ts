import {
  Credential,
  VerifiableCredential,
  CredentialSubject,
  Issuer,
  ECDSAProof,
  CreateCredentialOptions,
  W3C_VC_CONTEXT_V2,
  ISO8601DateTime,
} from "../types/w3c-vc.types";
import { CryptoService, ECDSACryptoService } from "./CryptoService";
import { OffChainService } from "./OffChainService";
import { OnChainService } from "./OnChainService";

/**
 * VC Issuer Service
 *
 * Handles the creation and signing of W3C Verifiable Credentials.
 *
 * KEY DESIGN DECISION: What to sign?
 * According to W3C VC spec, we sign the entire credential document EXCEPT the proof itself.
 * This includes:
 * - @context
 * - type
 * - issuer
 * - validFrom / validUntil
 * - credentialSubject (THE MAIN CLAIMS)
 * - credentialStatus (if present)
 * - any other credential metadata
 *
 * The signature mathematically binds all this data together, so any tampering
 * with ANY field will invalidate the signature.
 */
export class VCIssuer {
  private cryptoService: CryptoService;
  private offChainService?: OffChainService;
  private onChainService?: OnChainService;

  constructor(
    cryptoService?: CryptoService,
    offChainService?: OffChainService,
    onChainService?: OnChainService
  ) {
    this.cryptoService = cryptoService || new ECDSACryptoService();
    this.offChainService = offChainService;
    this.onChainService = onChainService;
  }

  /**
   * Issue a W3C-compliant Verifiable Credential using ANY crypto algorithm
   * This method is algorithm-agnostic and works with ECDSA, RSA, or Post-Quantum
   *
   * @param issuer - Issuer identifier (URL or DID)
   * @param credentialSubject - Claims about the subject
   * @param privateKey - Private key to sign with (format depends on algorithm)
   * @param publicKey - Public key for verification (format depends on algorithm)
   * @param options - Additional credential options
   * @returns Signed Verifiable Credential
   *
   * @example
   * ```typescript
   * const rsaCrypto = new RSACryptoService();
   * const issuer = new VCIssuer(rsaCrypto);
   * const identity = await rsaCrypto.generateIdentity();
   * const vc = await issuer.issueCredential(
   *   { id: "did:example:issuer123" },
   *   { id: "did:example:user456", accessLevel: "premium" },
   *   identity.privateKey,
   *   identity.publicKey,
   *   { credentialTypes: ["AccessControlCredential"], validityDays: 30 }
   * );
   * ```
   */
  async issueCredential(
    issuer: Issuer,
    credentialSubject: CredentialSubject | CredentialSubject[],
    privateKey: string,
    publicKey: string,
    options: CreateCredentialOptions & {
      validityDays?: number;
      proofType?: string; // Custom proof type for different algorithms
    } = {}
  ): Promise<VerifiableCredential> {
    // Create the unsigned credential
    const credential = this.createCredentialDocument(
      issuer,
      credentialSubject,
      options
    );

    // Create canonical representation for signing
    const credentialHash = this.createCanonicalHash(credential);

    // Sign using the configured crypto service
    const signature = await this.cryptoService.sign(credentialHash, privateKey);

    // Determine proof type based on crypto service
    const proofType =
      options.proofType ||
      (this.cryptoService.constructor.name === "ECDSACryptoService"
        ? "EcdsaSecp256k1Signature2020"
        : this.cryptoService.constructor.name === "RSACryptoService"
        ? "RsaSignature2018"
        : "DataIntegrityProof");

    // Create proof object
    const proof: ECDSAProof = {
      type: proofType,
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: `${
        typeof issuer === "string" ? issuer : issuer.id
      }#keys-1`,
      proofValue: signature,
    };

    // Return signed credential
    return {
      ...credential,
      proof,
    };
  }

  /**
   * Issue a W3C-compliant Verifiable Credential for OFF-CHAIN use
   * (e.g., physical locks, mobile verification)
   *
   * @param issuer - Issuer identifier (URL or DID)
   * @param credentialSubject - Claims about the subject
   * @param privateKey - Private key to sign with
   * @param options - Additional credential options
   * @returns Signed Verifiable Credential
   *
   * @example
   * ```typescript
   * const issuer = new VCIssuer();
   * const vc = await issuer.issueOffChainCredential(
   *   { id: "did:example:issuer123", name: "Example University" },
   *   {
   *     id: "did:example:user456",
   *     userMetaDataHash: "0x123...",
   *     accessLevel: "premium"
   *   },
   *   privateKey,
   *   {
   *     credentialTypes: ["AccessControlCredential"],
   *     validityDays: 30
   *   }
   * );
   * ```
   */
  async issueOffChainCredential(
    issuer: Issuer,
    credentialSubject: CredentialSubject | CredentialSubject[],
    privateKey: string,
    options: CreateCredentialOptions & {
      validityDays?: number;
      publicKey?: string; // REQUIRED for off-chain (used in proof)
    } = {}
  ): Promise<VerifiableCredential> {
    if (!options.publicKey) {
      throw new Error("publicKey is required for off-chain credentials");
    }

    if (!this.offChainService) {
      throw new Error(
        "OffChainService not initialized. Use issueCredential() for generic crypto services."
      );
    }

    // Create the unsigned credential
    const credential = this.createCredentialDocument(
      issuer,
      credentialSubject,
      options
    );

    // Create canonical representation for signing
    const credentialHash = this.createCanonicalHash(credential);

    // Sign using off-chain service (RAW ECDSA, no Ethereum prefix)
    const { signature } = await this.offChainService.signData(
      credentialHash,
      privateKey
    );

    // Create proof object
    const proof: ECDSAProof = {
      type: "EcdsaSecp256k1RecoverySignature2020",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: `${
        typeof issuer === "string" ? issuer : issuer.id
      }#keys-1`,
      proofValue: signature,
    };

    // Return signed credential
    return {
      ...credential,
      proof,
    };
  }

  /**
   * Issue a W3C-compliant Verifiable Credential for ON-CHAIN use
   * (e.g., blockchain storage, smart contract verification)
   *
   * @param issuer - Issuer identifier (should include Ethereum address)
   * @param credentialSubject - Claims about the subject
   * @param privateKey - Private key to sign with
   * @param options - Additional credential options
   * @returns Signed Verifiable Credential
   *
   * @example
   * ```typescript
   * const issuer = new VCIssuer();
   * const vc = await issuer.issueOnChainCredential(
   *   { id: "did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", name: "Example Org" },
   *   {
   *     id: "did:ethr:0xabc...",
   *     userMetaDataHash: "0x123...",
   *   },
   *   privateKey
   * );
   * // Can now be verified on-chain using ecrecover
   * ```
   */
  async issueOnChainCredential(
    issuer: Issuer,
    credentialSubject: CredentialSubject | CredentialSubject[],
    privateKey: string,
    options: CreateCredentialOptions & {
      validityDays?: number;
      ethereumAddress?: string; // REQUIRED for on-chain (used in proof)
    } = {}
  ): Promise<VerifiableCredential> {
    if (!options.ethereumAddress) {
      throw new Error("ethereumAddress is required for on-chain credentials");
    }

    if (!this.onChainService) {
      throw new Error(
        "OnChainService not initialized. Use issueCredential() for generic crypto services."
      );
    }

    // Create the unsigned credential
    const credential = this.createCredentialDocument(
      issuer,
      credentialSubject,
      options
    );

    // Create canonical representation for signing
    const credentialHash = this.createCanonicalHash(credential);

    // Sign using on-chain service (Ethereum-prefixed signature)
    const { signature } = await this.onChainService.signForBlockchain(
      credentialHash,
      privateKey
    );

    // Create proof object
    const proof: ECDSAProof = {
      type: "EcdsaSecp256k1Signature2019",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: options.ethereumAddress,
      proofValue: signature,
    };

    // Return signed credential
    return {
      ...credential,
      proof,
    };
  }

  /**
   * Create an unsigned credential document
   * This is what gets signed to create the verifiable credential
   *
   * @private
   */
  private createCredentialDocument(
    issuer: Issuer,
    credentialSubject: CredentialSubject | CredentialSubject[],
    options: CreateCredentialOptions & { validityDays?: number } = {}
  ): Credential {
    const now = new Date();
    const validFrom: ISO8601DateTime = now.toISOString();

    let validUntil: ISO8601DateTime | undefined;
    if (options.validityDays) {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + options.validityDays);
      validUntil = expiryDate.toISOString();
    }

    // Build context array
    const context: string[] = [W3C_VC_CONTEXT_V2];
    if (options.additionalContexts) {
      context.push(...options.additionalContexts);
    }

    // Build type array
    const type: string[] = ["VerifiableCredential"];
    if (options.credentialTypes) {
      type.push(...options.credentialTypes);
    }

    const credential: Credential = {
      "@context": context,
      type,
      issuer,
      validFrom,
      credentialSubject,
    };

    // Add optional fields
    if (options.credentialId) {
      credential.id = options.credentialId;
    }

    if (validUntil) {
      credential.validUntil = validUntil;
    }

    if (options.credentialStatus) {
      credential.credentialStatus = options.credentialStatus;
    }

    if (options.credentialSchema) {
      credential.credentialSchema = options.credentialSchema;
    }

    if (options.evidence) {
      credential.evidence = options.evidence;
    }

    if (options.termsOfUse) {
      credential.termsOfUse = options.termsOfUse;
    }

    return credential;
  }

  /**
   * Create a canonical hash of the credential for signing
   * Delegates to ECDSACryptoService for consistent hashing
   *
   * @private
   */
  private createCanonicalHash(credential: Credential): string {
    return this.cryptoService.createCanonicalHash(credential);
  }

  /**
   * Helper method to create a credential ID
   * Generates a unique identifier for the credential
   */
  generateCredentialId(prefix: string = "urn:uuid"): string {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    return `${prefix}:${uuid}`;
  }
}
