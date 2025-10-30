/**
 * W3C Verifiable Credentials Data Model 2.0 Types
 * Specification: https://www.w3.org/TR/vc-data-model/
 *
 * These types ensure compliance with the W3C VC standard
 */

/**
 * W3C VC 2.0 Context - REQUIRED property that defines the semantic meaning
 * Must include base context and can include additional contexts
 */
export type VCContext =
  | string
  | string[]
  | { [key: string]: string | { [key: string]: unknown } };

/**
 * W3C VC 2.0 Base Context URL
 */
export const W3C_VC_CONTEXT_V2 = "https://www.w3.org/ns/credentials/v2";

/**
 * ISO 8601 DateTime string
 */
export type ISO8601DateTime = string;

/**
 * URL identifier as defined by W3C VC spec
 */
export type VCURL = string;

// ============================================================================
// CREDENTIAL SUBJECT TYPES
// ============================================================================

/**
 * Base Credential Subject
 * The entity about which claims are made
 */
export interface CredentialSubject {
  /**
   * OPTIONAL identifier for the subject
   * Can be a DID, URL, or other globally unique identifier
   */
  id?: VCURL;

  /**
   * Additional claims about the subject
   * These are domain-specific properties
   */
  [key: string]: unknown;
}

/**
 * Access Control Credential Subject
 * Specific to access control use cases with physical locks
 */
export interface AccessControlCredentialSubject extends CredentialSubject {
  /**
   * Hash of user metadata for privacy protection
   */
  userMetaDataHash: string;

  /**
   * Lock-specific information
   * This is where you put the lock ID and name that the credential grants access to
   */
  lock?: {
    /**
     * REQUIRED: Unique identifier for the lock
     * Examples: "lock-building-a-room-101", "uuid:abc-123-def", "0x742d35..."
     */
    id: string;

    /**
     * REQUIRED: Human-readable name of the lock
     * Examples: "Main Entrance", "Lab Room 101", "Building A - Floor 2"
     */
    name: string;

    /**
     * OPTIONAL: Additional lock metadata
     */
    location?: string;
    building?: string;
    floor?: string;
    room?: string;
  };

  /**
   * OPTIONAL: Access level for this lock
   * Examples: "full-access", "time-restricted", "one-time-use"
   */
  accessLevel?: string;

  /**
   * OPTIONAL: Specific permissions for this lock
   * Examples: ["unlock", "lock", "admin", "guest"]
   */
  permissions?: string[];

  /**
   * OPTIONAL: Time-based access restrictions
   */
  accessSchedule?: {
    /**
     * Days of week access is allowed (0 = Sunday, 6 = Saturday)
     */
    allowedDays?: number[];

    /**
     * Time ranges when access is allowed
     */
    allowedTimeRanges?: Array<{
      start: string; // "09:00"
      end: string; // "17:00"
    }>;

    /**
     * Timezone for the schedule
     */
    timezone?: string;
  };

  /**
   * OPTIONAL: Access validity (can be different from credential validity)
   */
  accessValidFrom?: string;
  accessValidUntil?: string;
}

// ============================================================================
// ISSUER TYPES
// ============================================================================

/**
 * Issuer - The entity that issues the credential
 * Can be a simple URL or an object with additional properties
 */
export type Issuer =
  | VCURL
  | {
      id: VCURL;
      name?: string;
      description?: string;
      [key: string]: unknown;
    };

// ============================================================================
// PROOF TYPES (for securing mechanisms)
// ============================================================================

/**
 * Base Proof interface
 * Different securing mechanisms extend this
 */
export interface Proof {
  /**
   * Type of the proof (e.g., DataIntegrityProof, JwtProof)
   */
  type: string;

  /**
   * When the proof was created
   */
  created?: ISO8601DateTime;

  /**
   * Purpose of the proof (e.g., assertionMethod)
   */
  proofPurpose?: string;

  /**
   * Verification method identifier
   */
  verificationMethod?: VCURL;

  /**
   * The actual signature value
   */
  proofValue: string;

  /**
   * Additional proof-specific properties
   */
  [key: string]: unknown;
}

/**
 * ECDSA Proof for our implementation
 * Uses compact signature format (r+s+v)
 */
export interface ECDSAProof extends Proof {
  type: "EcdsaSecp256k1Signature2019" | "EcdsaSecp256k1RecoverySignature2020";

  /**
   * Nonce or challenge for replay protection
   */
  challenge?: string;

  /**
   * Domain binding for security
   */
  domain?: string;
}

// ============================================================================
// VERIFIABLE CREDENTIAL TYPES
// ============================================================================

/**
 * Base Verifiable Credential (without proof)
 * This is what gets signed to create a VerifiableCredential
 */
export interface Credential {
  /**
   * REQUIRED: JSON-LD context
   * Must include W3C VC base context
   */
  "@context": VCContext;

  /**
   * OPTIONAL: Unique identifier for this credential
   */
  id?: VCURL;

  /**
   * REQUIRED: Type array
   * Must include "VerifiableCredential" plus specific types
   */
  type: string[];

  /**
   * REQUIRED: Issuer identifier
   */
  issuer: Issuer;

  /**
   * REQUIRED: When the credential becomes valid
   * Replaces issuanceDate in VC 2.0
   */
  validFrom: ISO8601DateTime;

  /**
   * OPTIONAL: When the credential expires
   * Replaces expirationDate in VC 2.0
   */
  validUntil?: ISO8601DateTime;

  /**
   * REQUIRED: The subject of the credential
   */
  credentialSubject: CredentialSubject | CredentialSubject[];

  /**
   * OPTIONAL: Status information (revocation, suspension)
   */
  credentialStatus?: CredentialStatus;

  /**
   * OPTIONAL: Schema for validation
   */
  credentialSchema?: CredentialSchema | CredentialSchema[];

  /**
   * OPTIONAL: Evidence supporting the credential
   */
  evidence?: Evidence | Evidence[];

  /**
   * OPTIONAL: Terms of use
   */
  termsOfUse?: TermsOfUse | TermsOfUse[];

  /**
   * Additional properties allowed for extensibility
   */
  [key: string]: unknown;
}

/**
 * Verifiable Credential (WITH proof)
 * This is the final signed credential
 */
export interface VerifiableCredential extends Credential {
  /**
   * REQUIRED: Cryptographic proof(s)
   */
  proof: Proof | Proof[];
}

// ============================================================================
// VERIFIABLE PRESENTATION TYPES
// ============================================================================

/**
 * Base Presentation (without proof)
 */
export interface Presentation {
  /**
   * REQUIRED: JSON-LD context
   */
  "@context": VCContext;

  /**
   * OPTIONAL: Identifier for this presentation
   */
  id?: VCURL;

  /**
   * REQUIRED: Type array
   * Must include "VerifiablePresentation"
   */
  type: string[];

  /**
   * OPTIONAL: Verifiable credentials being presented
   */
  verifiableCredential?: VerifiableCredential | VerifiableCredential[];

  /**
   * OPTIONAL: Entity creating the presentation
   */
  holder?: VCURL;

  /**
   * Additional properties
   */
  [key: string]: unknown;
}

/**
 * Verifiable Presentation (WITH proof)
 */
export interface VerifiablePresentation extends Presentation {
  /**
   * REQUIRED: Cryptographic proof
   */
  proof: Proof | Proof[];
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/**
 * Credential Status - for revocation/suspension
 */
export interface CredentialStatus {
  id: VCURL;
  type: string;
  [key: string]: unknown;
}

/**
 * Credential Schema - for validation
 */
export interface CredentialSchema {
  id: VCURL;
  type: string;
  [key: string]: unknown;
}

/**
 * Evidence supporting credential claims
 */
export interface Evidence {
  id?: VCURL;
  type: string;
  [key: string]: unknown;
}

/**
 * Terms of Use
 */
export interface TermsOfUse {
  type: string;
  [key: string]: unknown;
}

// ============================================================================
// SIGNING INPUT TYPES (what gets hashed and signed)
// ============================================================================

/**
 * Canonical representation for signing
 * This is what we hash and sign to create proofs
 */
export interface CanonicalCredential {
  "@context": VCContext;
  type: string[];
  issuer: Issuer;
  validFrom: ISO8601DateTime;
  validUntil?: ISO8601DateTime;
  credentialSubject: CredentialSubject | CredentialSubject[];
  [key: string]: unknown;
}

/**
 * Options for creating credentials
 */
export interface CreateCredentialOptions {
  /**
   * Additional contexts beyond the base W3C context
   */
  additionalContexts?: string[];

  /**
   * Specific credential types beyond "VerifiableCredential"
   */
  credentialTypes?: string[];

  /**
   * Credential ID (if not provided, can be generated)
   */
  credentialId?: string;

  /**
   * Status information
   */
  credentialStatus?: CredentialStatus;

  /**
   * Schema information
   */
  credentialSchema?: CredentialSchema | CredentialSchema[];

  /**
   * Evidence
   */
  evidence?: Evidence | Evidence[];

  /**
   * Terms of use
   */
  termsOfUse?: TermsOfUse | TermsOfUse[];

  /**
   * Additional custom properties
   */
  [key: string]: unknown;
}

/**
 * Verification result
 */
export interface VerificationResult {
  /**
   * Whether verification succeeded
   */
  verified: boolean;

  /**
   * The verified credential (if successful)
   */
  verifiableCredential?: VerifiableCredential;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Additional verification details
   */
  details?: {
    issuer?: string;
    subject?: string;
    validFrom?: ISO8601DateTime;
    validUntil?: ISO8601DateTime;
    isExpired?: boolean;
    [key: string]: unknown;
  };
}
