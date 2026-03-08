import { ml_dsa44 } from "@noble/post-quantum/ml-dsa";
import { CryptoService } from "./CryptoService";
import { CryptoIdentity } from "../types";
import { createHash } from "crypto";

/**
 * Post-Quantum Cryptographic Service using ML-DSA-44 (Dilithium2)
 *
 * Implementation using CRYSTALS-Dilithium (NIST-selected post-quantum signature algorithm).
 * ML-DSA-44 (formerly Dilithium2) provides security level 2 (equivalent to AES-128).
 *
 * Key characteristics:
 * - Resistant to quantum computer attacks (Shor's algorithm)
 * - Public key: 1,312 bytes (raw) → ~1,750 bytes (base64)
 * - Signature: ~2,420 bytes (raw) → ~3,227 bytes (base64)
 * - Fast verification and signing speed
 * - NIST standardized (FIPS 204)
 * - Uses Base64 encoding for 33% size efficiency vs hex
 *
 * Use case: Future-proof cryptography for long-term credential validity with better performance
 *
 * Note: Uses Base64 encoding (not hex) since PQ signatures don't need Ethereum compatibility
 */
export class PQCryptoService extends CryptoService {
  /**
   * Generate ML-DSA-44 key pair
   * @returns CryptoIdentity with hex-encoded keys
   */
  async generateIdentity(): Promise<CryptoIdentity> {
    try {
      // Generate random seed for key generation
      const seed = new Uint8Array(32);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(seed);
      } else {
        // Node.js fallback
        const nodeCrypto = require("crypto");
        nodeCrypto.randomFillSync(seed);
      }

      // Generate ML-DSA-44 key pair
      const keypair = ml_dsa44.keygen(seed);
      const secretKey = keypair.secretKey;
      const publicKey = keypair.publicKey;

      // Convert to Base64 for efficient storage/transmission (33% smaller than hex)
      const privateKeyBase64 = Buffer.from(secretKey).toString("base64");
      const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

      // Create pseudo-address from public key hash for consistency with other services
      const addressHash = createHash("sha256").update(publicKey).digest("hex");

      return {
        privateKey: privateKeyBase64,
        publicKey: publicKeyBase64,
        address: `0x${addressHash.substring(0, 40)}`, // 20-byte address format
      };
    } catch (error) {
      throw new Error(`ML-DSA-44 key generation failed: ${error}`);
    }
  }

  /**
   * Sign data using ML-DSA-44
   * @param data - Hash string to sign (hex format)
   * @param privateKey - Base64-encoded ML-DSA-44 secret key
   * @returns Base64-encoded signature
   */
  async sign(data: string, privateKey: string): Promise<string> {
    try {
      // Convert base64 private key to Uint8Array
      const secretKey = new Uint8Array(Buffer.from(privateKey, "base64"));

      // Convert data hash to bytes (hash is still hex with 0x prefix for consistency)
      const dataBytes = new Uint8Array(
        Buffer.from(data.replace("0x", ""), "hex"),
      );

      // Sign using ML-DSA-44
      const signature = ml_dsa44.sign(secretKey, dataBytes);

      // Return base64-encoded signature (33% smaller than hex)
      return Buffer.from(signature).toString("base64");
    } catch (error) {
      throw new Error(`ML-DSA-44 signing failed: ${error}`);
    }
  }

  /**
   * Verify ML-DSA-44 signature
   * @param data - Original hash string (hex format)
   * @param signature - Base64-encoded signature
   * @param publicKey - Base64-encoded ML-DSA-44 public key
   * @returns True if signature is valid
   */
  async verify(
    data: string,
    signature: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      // Convert base64 inputs to Uint8Arrays
      const publicKeyBytes = new Uint8Array(Buffer.from(publicKey, "base64"));
      const signatureBytes = new Uint8Array(Buffer.from(signature, "base64"));
      // Data hash is still hex format for consistency across algorithms
      const dataBytes = new Uint8Array(
        Buffer.from(data.replace("0x", ""), "hex"),
      );

      // Verify using ML-DSA-44
      return ml_dsa44.verify(publicKeyBytes, dataBytes, signatureBytes);
    } catch (error) {
      console.error("ML-DSA-44 verification failed:", error);
      return false;
    }
  }

  /**
   * Hash data using SHA-256
   * @param data - String data to hash
   * @returns Hex-encoded hash with 0x prefix
   */
  hash(data: string): string {
    const hash = createHash("sha256").update(data, "utf8").digest("hex");
    return "0x" + hash;
  }

  /**
   * Create a canonical hash of an object for signing
   * Uses the same canonicalization as ECDSA/RSA for fair comparison
   */
  createCanonicalHash(obj: unknown): string {
    const canonical = this.canonicalize(obj);
    return this.hash(canonical);
  }

  /**
   * Canonicalize an object for deterministic hashing
   * Identical implementation to ECDSACryptoService for consistency
   */
  canonicalize(obj: unknown): string {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
    if (typeof obj !== "object") return JSON.stringify(obj);

    if (Array.isArray(obj)) {
      const items = obj.map((item) => this.canonicalize(item));
      return `[${items.join(",")}]`;
    }
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
