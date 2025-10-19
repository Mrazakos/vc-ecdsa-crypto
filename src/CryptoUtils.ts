import { ethers } from "ethers";
import {
  KeyPair,
  VCSigningInput,
  SigningResult,
  CryptoTestResult,
} from "./types";

/**
 * FAST Crypto Utils using ECDSA (secp256k1)
 * 100-1000x faster than RSA on mobile devices
 *
 * This class provides cryptographic utilities for:
 * - Generating ECDSA key pairs
 * - Signing Verifiable Credentials
 * - Verifying signatures
 * - Hashing data
 */
export class CryptoUtils {
  /**
   * Generates ECDSA key pair using secp256k1 curve
   * @returns Promise containing the generated key pair with public and private keys
   * @throws Error if key generation fails
   * @example
   * ```typescript
   * const keyPair = await CryptoUtils.generateKeyPair();
   * console.log(keyPair.publicKey);  // 0x04...
   * console.log(keyPair.privateKey); // 0x...
   * ```
   */
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      const startTime = Date.now();

      const wallet = ethers.Wallet.createRandom();

      const endTime = Date.now();

      return {
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey, // Compressed format (68 chars)
      };
    } catch (error) {
      throw new Error(`ECDSA key generation failed: ${error}`);
    }
  }

  /**
   * Signs a Verifiable Credential input with ECDSA
   * Signs the hash of the VC data (userMetaDataHash + issuanceDate + expirationDate)
   * @param vcInput - The VC signing input containing userMetaDataHash, issuanceDate, and expirationDate
   * @param privateKey - The ECDSA private key to sign with
   * @returns SigningResult containing the signature and the hash that was signed
   * @throws Error if signing fails
   * @example
   * ```typescript
   * const vcInput = {
   *   userMetaDataHash: "0x123...",
   *   issuanceDate: new Date().toISOString(),
   *   expirationDate: new Date(Date.now() + 86400000).toISOString()
   * };
   * const result = await CryptoUtils.sign(vcInput, privateKey);
   * console.log(result.signature);
   * ```
   */
  static async sign(
    vcInput: VCSigningInput,
    privateKey: string
  ): Promise<SigningResult> {
    try {
      // Step 1: Create a canonical message from the VC input
      const message = JSON.stringify({
        userMetaDataHash: vcInput.userMetaDataHash,
        issuanceDate: vcInput.issuanceDate,
        expirationDate: vcInput.expirationDate || null,
      });

      // Step 2: Hash the message
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(message));

      // Step 3: Sign the hash
      const wallet = new ethers.Wallet(privateKey);

      // Convert hash to bytes and sign it
      const hashBytes = ethers.getBytes(dataHash);
      const signature = await wallet.signMessage(hashBytes);

      return {
        signature: signature,
        signedMessageHash: dataHash,
      };
    } catch (error) {
      throw new Error(`ECDSA signing failed: ${error}`);
    }
  }

  /**
   * Verifies ECDSA signature against data hash
   * The decrypted signature should match the data hash
   *
   * Conceptually, verification answers:
   * "Given this hash, signature, and public key,
   * could this signature have ONLY been created by
   * someone who knew the corresponding private key
   * AND was signing this exact hash?"
   *
   * If answer is YES → signature is valid
   * If answer is NO → signature is invalid or forged
   *
   * @param dataHash - The hash that was signed
   * @param signature - The signature to verify
   * @param publicKey - The public key to verify against
   * @returns true if signature is valid, false otherwise
   * @example
   * ```typescript
   * const isValid = CryptoUtils.verify(
   *   signResult.signedMessageHash,
   *   signResult.signature,
   *   publicKey
   * );
   * console.log(isValid ? "Valid!" : "Invalid!");
   * ```
   */
  static verify(
    dataHash: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      // Convert hash to bytes for verification
      const hashBytes = ethers.getBytes(dataHash);

      // Recover the address from the signature and hash
      const recoveredAddress = ethers.verifyMessage(hashBytes, signature);

      // Get the expected address from the public key
      const expectedAddress = ethers.computeAddress(publicKey);

      const isValid =
        recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
      console.log(
        `✅ Signature verification: ${isValid ? "PASSED" : "FAILED"}`
      );

      return isValid;
    } catch (error) {
      console.error("❌ ECDSA verification failed:", error);
      return false;
    }
  }

  /**
   * Creates a Keccak-256 hash of the input data
   * @param data - The string data to hash
   * @returns The hash as a hex string
   * @example
   * ```typescript
   * const hash = CryptoUtils.hash("Hello, World!");
   * console.log(hash); // 0x...
   * ```
   */
  static hash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }
}
