import { falcon512 } from "@noble/post-quantum/falcon.js";
import { createHash, randomFillSync } from "crypto";
import { CryptoIdentity } from "../types";
import { CryptoService } from "./CryptoService";

/**
 * Post-Quantum Cryptographic Service using Falcon-512
 *
 * Falcon-512 is a lattice-based signature scheme from the NIST PQC Round 3
 * selection process. This service mirrors the existing PQ service pattern
 * but locks the implementation to Falcon-512 only so benchmark comparisons
 * stay at a single security level.
 */
export class FalconCryptoService extends CryptoService {
  async generateIdentity(): Promise<CryptoIdentity> {
    try {
      const seed = new Uint8Array(48);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(seed);
      } else {
        randomFillSync(seed);
      }

      const keypair = falcon512.keygen(seed);
      const secretKey = keypair.secretKey;
      const publicKey = keypair.publicKey;

      const privateKeyBase64 = Buffer.from(secretKey).toString("base64");
      const publicKeyBase64 = Buffer.from(publicKey).toString("base64");
      const addressHash = createHash("sha256").update(publicKey).digest("hex");

      return {
        privateKey: privateKeyBase64,
        publicKey: publicKeyBase64,
        address: `0x${addressHash.substring(0, 40)}`,
      };
    } catch (error) {
      throw new Error(`Falcon-512 key generation failed: ${error}`);
    }
  }

  async sign(data: string, privateKey: string): Promise<string> {
    try {
      const secretKey = new Uint8Array(Buffer.from(privateKey, "base64"));
      const dataBytes = new Uint8Array(
        Buffer.from(data.replace("0x", ""), "hex"),
      );

      const signature = falcon512.sign(dataBytes, secretKey);
      return Buffer.from(signature).toString("base64");
    } catch (error) {
      throw new Error(`Falcon-512 signing failed: ${error}`);
    }
  }

  async verify(
    data: string,
    signature: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      const publicKeyBytes = new Uint8Array(Buffer.from(publicKey, "base64"));
      const signatureBytes = new Uint8Array(Buffer.from(signature, "base64"));
      const dataBytes = new Uint8Array(
        Buffer.from(data.replace("0x", ""), "hex"),
      );

      return falcon512.verify(signatureBytes, dataBytes, publicKeyBytes);
    } catch (error) {
      console.error("Falcon-512 verification failed:", error);
      return false;
    }
  }

  hash(data: string): string {
    const hash = createHash("sha256").update(data, "utf8").digest("hex");
    return "0x" + hash;
  }

  createCanonicalHash(obj: unknown): string {
    const canonical = this.canonicalize(obj);
    return this.hash(canonical);
  }

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
