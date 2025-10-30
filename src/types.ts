// ============================================================================
// W3C VC 2.0 COMPLIANT TYPES
// ============================================================================
export * from "./types/w3c-vc.types";

// ============================================================================
// CRYPTO-RELATED TYPES
// ============================================================================

/**
 * Represents a complete cryptographic identity for dual-mode operation
 * Contains all three components needed for off-chain and on-chain operations
 */
export interface CryptoIdentity {
  privateKey: string; // Private key for signing (keep secret!)
  publicKey: string; // Full 65-byte ECDSA public key (0x04...) - for off-chain verification
  address: string; // Ethereum address (20 bytes) - for on-chain smart contract use
}

/**
 * @deprecated Use CryptoIdentity instead
 */
export interface KeyPair extends CryptoIdentity {}

/**
 * Represents a hash value
 */
export type Hash = string;

/**
 * Represents an Ethereum-style address
 */
export type Address = string;

// ============================================================================
// LEGACY TYPES (maintained for backward compatibility)
// ============================================================================

/**
 * @deprecated Use W3C VC types instead. This is legacy type for simple VC input.
 * Input type for signing a Verifiable Credential
 * Contains the essential data that needs to be cryptographically signed
 */
export interface VCSigningInput {
  userMetaDataHash: string; // Hash of the user metadata for privacy protection
  issuanceDate: string; // ISO string format
  expirationDate?: string; // ISO string format (optional)
}

/**
 * Result of a signing operation
 * Contains the signature and the hash that was signed
 */
export interface SigningResult {
  signature: string;
  signedMessageHash: string;
}

/**
 * Result of a cryptographic test
 */
export interface CryptoTestResult {
  success: boolean;
  results: string[];
  error?: string;
}
