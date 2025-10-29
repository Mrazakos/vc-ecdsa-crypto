// ============================================================================
// CRYPTO-RELATED TYPES
// ============================================================================

/**
 * Represents a cryptographic key pair for Ethereum-compatible ECDSA
 * The publicKey is the Ethereum address (20 bytes, 0x-prefixed)
 * This enables direct smart contract integration without on-chain address derivation
 */
export interface KeyPair {
  publicKey: string; // Ethereum address - use this for smart contract interactions
  privateKey: string; // ECDSA private key for signing
}

/**
 * Represents a hash value
 */
export type Hash = string;

/**
 * Represents an Ethereum-style address
 */
export type Address = string;

/**
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
