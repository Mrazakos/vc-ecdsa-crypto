import { ethers, SigningKey } from "ethers";
import { CryptoIdentity } from "../types";

/**
 * Base Cryptographic Service
 *
 * This class provides an extensible architecture for cryptographic operations.
 * Instead of static methods, it uses instance methods which allows for:
 * - Easy extension with new algorithms
 * - Dependency injection for testing
 * - Configuration per instance
 * - Future support for post-quantum algorithms
 *
 * Current implementation uses ECDSA (secp256k1) which is:
 * - 100-1000x faster than RSA on mobile devices
 * - Native to Ethereum ecosystem
 * - Well-supported across platforms
 */
export abstract class CryptoService {
  /**
   * Generate a new cryptographic identity
   * Different implementations can provide different key types
   */
  abstract generateIdentity(): Promise<CryptoIdentity>;

  /**
   * Sign data with a private key
   * @param data - Data to sign (typically a hash)
   * @param privateKey - Private key to sign with
   * @returns Signature string
   */
  abstract sign(data: string, privateKey: string): Promise<string>;

  /**
   * Verify a signature
   * @param data - Original data that was signed
   * @param signature - Signature to verify
   * @param publicKeyOrAddress - Public key or address to verify against
   * @returns True if signature is valid
   */
  abstract verify(
    data: string,
    signature: string,
    publicKeyOrAddress: string
  ): Promise<boolean>;

  /**
   * Hash data using the algorithm's native hash function
   * @param data - Data to hash
   * @returns Hash string
   */
  abstract hash(data: string): string;
}

/**
 * ECDSA (secp256k1) Implementation
 *
 * This is the current production implementation using ECDSA.
 * Ethereum-compatible and optimized for mobile devices.
 */
export class ECDSACryptoService extends CryptoService {
  /**
   * Generates ECDSA key pair using secp256k1 curve
   * Returns all three key components for dual-mode operation
   *
   * @returns Promise containing the key pair with privateKey, publicKey (65-byte), and address (20-byte)
   * @throws Error if key generation fails
   * @example
   * ```typescript
   * const cryptoService = new ECDSACryptoService();
   * const identity = await cryptoService.generateIdentity();
   * console.log(identity.privateKey);  // 0x... (for signing)
   * console.log(identity.publicKey);   // 0x04... (65 bytes - off-chain verification)
   * console.log(identity.address);     // 0x742d... (20 bytes - on-chain use)
   * ```
   */
  async generateIdentity(): Promise<CryptoIdentity> {
    try {
      const wallet = ethers.Wallet.createRandom();

      return {
        privateKey: wallet.privateKey,
        publicKey: ethers.SigningKey.computePublicKey(wallet.publicKey, false),
        address: wallet.address,
      };
    } catch (error) {
      throw new Error(`ECDSA key generation failed: ${error}`);
    }
  }

  /**
   * Sign data using ECDSA
   * @param data - The hash to sign
   * @param privateKey - Private key for signing
   * @param options - Signing options
   * @returns Signature in compact format
   */
  async sign(
    data: string,
    privateKey: string,
    options?: { ethereumPrefix?: boolean }
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);

      if (options?.ethereumPrefix) {
        // On-chain signing with Ethereum prefix
        const dataBytes = ethers.getBytes(data);
        return await wallet.signMessage(dataBytes);
      } else {
        // Off-chain signing (raw signature, no prefix)
        const hashBytes = ethers.getBytes(data);
        const sig = wallet.signingKey.sign(hashBytes);
        return sig.serialized;
      }
    } catch (error) {
      throw new Error(`ECDSA signing failed: ${error}`);
    }
  }

  /**
   * Verify ECDSA signature
   * @param data - Original data
   * @param signature - Signature to verify
   * @param publicKeyOrAddress - Can be full public key or Ethereum address
   * @param options - Verification options
   * @returns True if signature is valid
   */
  async verify(
    data: string,
    signature: string,
    publicKeyOrAddress: string,
    options?: { ethereumPrefix?: boolean }
  ): Promise<boolean> {
    try {
      const hashBytes = ethers.getBytes(data);

      if (options?.ethereumPrefix) {
        // On-chain verification (expects Ethereum prefix)
        const recoveredAddress = ethers.verifyMessage(hashBytes, signature);
        return (
          recoveredAddress.toLowerCase() === publicKeyOrAddress.toLowerCase()
        );
      } else {
        // Off-chain verification (raw signature, full public key required)
        const recoveredPubKey = SigningKey.recoverPublicKey(
          hashBytes,
          signature
        );
        return (
          recoveredPubKey.toLowerCase() === publicKeyOrAddress.toLowerCase()
        );
      }
    } catch (error) {
      console.error("ECDSA verification failed:", error);
      return false;
    }
  }

  /**
   * Hash data using Keccak-256 (Ethereum's hash function)
   * @param data - String data to hash
   * @returns Hex-encoded hash
   */
  hash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Create a canonical hash of an object for signing
   * This ensures consistent hashing regardless of JSON property order
   *
   * CRITICAL: This must be deterministic!
   * The same object must always produce the same hash.
   *
   * Used by VCIssuer, VCVerifier, and VCRevoke for consistent credential hashing.
   *
   * @param obj - Object to hash (typically a Credential)
   * @returns Keccak-256 hash of the canonical representation
   *
   * @example
   * ```typescript
   * const crypto = new ECDSACryptoService();
   * const credential = { ... };
   * const hash = crypto.createCanonicalHash(credential);
   * ```
   */
  createCanonicalHash(obj: unknown): string {
    const canonical = this.canonicalize(obj);
    return this.hash(canonical);
  }

  /**
   * Canonicalize an object for deterministic hashing
   * Sorts keys alphabetically and filters out undefined values
   *
   * This matches JSON.stringify behavior where undefined properties are omitted.
   * Ensures the same object always produces the same canonical string.
   *
   * @param obj - Object to canonicalize
   * @returns Canonical string representation
   *
   * @example
   * ```typescript
   * const crypto = new ECDSACryptoService();
   * const canonical = crypto.canonicalize({ b: 2, a: 1, c: undefined });
   * // Result: '{"a":1,"b":2}' (sorted keys, undefined filtered)
   * ```
   */
  canonicalize(obj: unknown): string {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
    if (typeof obj !== "object") return JSON.stringify(obj);

    if (Array.isArray(obj)) {
      const items = obj.map((item) => this.canonicalize(item));
      return `[${items.join(",")}]`;
    }

    // Sort keys alphabetically and filter out undefined values
    // This matches JSON.stringify behavior where undefined properties are omitted
    const sorted = Object.keys(obj as Record<string, unknown>)
      .sort()
      .filter((key) => {
        const value = (obj as Record<string, unknown>)[key];
        return value !== undefined;
      })
      .map((key) => {
        const value = (obj as Record<string, unknown>)[key];
        return `"${key}":${this.canonicalize(value)}`;
      });

    return `{${sorted.join(",")}}`;
  }
}
