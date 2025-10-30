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