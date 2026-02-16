import NodeRSA from "node-rsa";
import { createHash } from "crypto";
import { CryptoService } from "./CryptoService";
import { CryptoIdentity } from "../types";

/**
 * RSA-PSS Cryptographic Service
 *
 * Implementation using node-rsa (backed by Node.js native crypto/OpenSSL)
 * for realistic RSA performance benchmarks.
 *
 * Key characteristics:
 * - 2048-bit or 4096-bit key size (configurable)
 * - SHA-256 hash function
 * - PSS padding (more secure than PKCS#1 v1.5)
 * - Uses native OpenSSL (20-100x faster than pure JS)
 * - Larger key and signature sizes than ECDSA
 *
 * Use case: Realistic comparison baseline for traditional public-key cryptography
 */
export class RSACryptoService extends CryptoService {
  private keySize: number;

  /**
   * @param keySize - RSA key size in bits (2048 or 4096)
   */
  constructor(keySize: number = 2048) {
    super();
    if (keySize !== 2048 && keySize !== 4096) {
      throw new Error("RSA key size must be 2048 or 4096 bits");
    }
    this.keySize = keySize;
  }

  /**
   * Generate RSA key pair using node-rsa
   * @returns CryptoIdentity with PEM-encoded keys
   */
  async generateIdentity(): Promise<CryptoIdentity> {
    try {
      const key = new NodeRSA({ b: this.keySize });

      const privateKeyPem = key.exportKey("pkcs8-private-pem");
      const publicKeyPem = key.exportKey("pkcs8-public-pem");

      // Create a pseudo-address from public key hash (for consistency with other services)
      const publicKeyHash = createHash("sha256")
        .update(publicKeyPem)
        .digest("hex");

      return {
        privateKey: privateKeyPem,
        publicKey: publicKeyPem,
        address: `0x${publicKeyHash.substring(0, 40)}`, // 20-byte address format
      };
    } catch (error) {
      throw new Error(`RSA key generation failed: ${error}`);
    }
  }

  /**
   * Sign data using RSA-PSS
   * @param data - Hash string to sign (hex format)
   * @param privateKey - PEM-encoded private key
   * @returns Base64-encoded signature
   */
  async sign(data: string, privateKey: string): Promise<string> {
    try {
      const key = new NodeRSA();
      key.importKey(privateKey, "pkcs8-private-pem");

      // Set signing scheme to PSS with SHA-256
      key.setOptions({
        signingScheme: {
          scheme: "pss",
          hash: "sha256",
          saltLength: 32,
        },
      });

      // Convert hex hash to buffer
      const dataBuffer = Buffer.from(data.replace("0x", ""), "hex");

      // Sign and return base64
      const signature = key.sign(dataBuffer, "base64");
      return signature;
    } catch (error) {
      throw new Error(`RSA signing failed: ${error}`);
    }
  }

  /**
   * Verify RSA-PSS signature
   * @param data - Original hash string (hex format)
   * @param signature - Base64-encoded signature
   * @param publicKey - PEM-encoded public key
   * @returns True if signature is valid
   */
  async verify(
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const key = new NodeRSA();
      key.importKey(publicKey, "pkcs8-public-pem");

      // Set verification scheme to PSS with SHA-256
      key.setOptions({
        signingScheme: {
          scheme: "pss",
          hash: "sha256",
          saltLength: 32,
        },
      });

      // Convert hex hash to buffer
      const dataBuffer = Buffer.from(data.replace("0x", ""), "hex");

      // Verify signature
      return key.verify(dataBuffer, signature, undefined, "base64");
    } catch (error) {
      console.error("RSA verification failed:", error);
      return false;
    }
  }

  /**
   * Hash data using SHA-256
   * @param data - String data to hash
   * @returns Hex-encoded hash with 0x prefix
   */
  hash(data: string): string {
    return "0x" + createHash("sha256").update(data, "utf8").digest("hex");
  }

  /**
   * Create a canonical hash of an object for signing
   * Uses the same canonicalization as ECDSA for fair comparison
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

    // Sort keys alphabetically and filter out undefined values
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

  /**
   * Get the configured key size
   */
  getKeySize(): number {
    return this.keySize;
  }
}
