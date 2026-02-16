import { ml_dsa65 } from "@noble/post-quantum/ml-dsa";
import { CryptoService } from "./CryptoService";
import { CryptoIdentity } from "../types";
import { createHash } from "crypto";

/**
 * Post-Quantum Cryptographic Service using ML-DSA-65 (Dilithium3)
 *
 * Implementation using CRYSTALS-Dilithium (NIST-selected post-quantum signature algorithm).
 * ML-DSA-65 (formerly Dilithium3) provides security level 3 (equivalent to AES-192).
 *
 * Key characteristics:
 * - Resistant to quantum computer attacks (Shor's algorithm)
 * - Public key: 1,952 bytes
 * - Signature: ~3,309 bytes (much larger than ECDSA/RSA)
 * - Fast verification, moderate signing speed
 * - NIST standardized (FIPS 204)
 *
 * Use case: Future-proof cryptography for long-term credential validity
 */
export class PQCryptoService extends CryptoService {
  /**
   * Generate ML-DSA-65 key pair
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

      // Generate ML-DSA-65 key pair
      const keypair = ml_dsa65.keygen(seed);
      const secretKey = keypair.secretKey;
      const publicKey = keypair.publicKey;

      // Convert to hex for storage/transmission
      const privateKeyHex = "0x" + Buffer.from(secretKey).toString("hex");
      const publicKeyHex = "0x" + Buffer.from(publicKey).toString("hex");

      // Create pseudo-address from public key hash for consistency with other services
      const addressHash = createHash("sha256").update(publicKey).digest("hex");

      return {
        privateKey: privateKeyHex,
        publicKey: publicKeyHex,
        address: `0x${addressHash.substring(0, 40)}`, // 20-byte address format
      };
    } catch (error) {
      throw new Error(`ML-DSA-65 key generation failed: ${error}`);
    }
  }

  /**
   * Sign data using ML-DSA-65
   * @param data - Hash string to sign (hex format)
   * @param privateKey - Hex-encoded ML-DSA-65 secret key
   * @returns Hex-encoded signature
   */
  async sign(data: string, privateKey: string): Promise<string> {
    try {
      // Convert hex private key to Uint8Array
      const secretKey = new Uint8Array(
        Buffer.from(privateKey.replace("0x", ""), "hex")
      );

      // Convert data hash to bytes
      const dataBytes = new Uint8Array(
        Buffer.from(data.replace("0x", ""), "hex")
      );

      // Sign using ML-DSA-65
      const signature = ml_dsa65.sign(secretKey, dataBytes);

      // Return hex-encoded signature
      return "0x" + Buffer.from(signature).toString("hex");
    } catch (error) {
      throw new Error(`ML-DSA-65 signing failed: ${error}`);
    }
  }

  /**
   * Verify ML-DSA-65 signature
   * @param data - Original hash string (hex format)
   * @param signature - Hex-encoded signature
   * @param publicKey - Hex-encoded ML-DSA-65 public key
   * @returns True if signature is valid
   */
  async verify(
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Convert hex inputs to Uint8Arrays
      const publicKeyBytes = new Uint8Array(
        Buffer.from(publicKey.replace("0x", ""), "hex")
      );
      const signatureBytes = new Uint8Array(
        Buffer.from(signature.replace("0x", ""), "hex")
      );
      const dataBytes = new Uint8Array(
        Buffer.from(data.replace("0x", ""), "hex")
      );

      // Verify using ML-DSA-65
      return ml_dsa65.verify(publicKeyBytes, dataBytes, signatureBytes);
    } catch (error) {
      console.error("ML-DSA-65 verification failed:", error);
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
