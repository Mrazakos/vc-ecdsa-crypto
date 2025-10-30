import { ethers, SigningKey } from "ethers";
import { CryptoIdentity, VCSigningInput, SigningResult } from "./types";

/**
 * FAST Crypto Utils using ECDSA (secp256k1)
 * 100-1000x faster than RSA on mobile devices
 *
 * This class provides DUAL-MODE cryptographic utilities:
 *
 * OFF-CHAIN MODE (Physical Lock Verification):
 * - Uses raw ECDSA signatures (no Ethereum prefix)
 * - Verifies with full 65-byte public key
 * - Standard ECDSA compatible with any library
 *
 * ON-CHAIN MODE (Smart Contract Integration):
 * - Uses Ethereum-prefixed signatures
 * - Verifies with 20-byte address (ecrecover)
 * - Compatible with Solidity ecrecover function
 *
 * FUTURE-PROOF DESIGN:
 * - Off-chain verification can support post-quantum algorithms
 * - On-chain operations remain ECDSA (Ethereum native)
 */
export class CryptoUtils {
  /**
   * Generates ECDSA key pair using secp256k1 curve
   * Returns all three key components for dual-mode operation
   *
   * @returns Promise containing the key pair with privateKey, publicKey (65-byte), and address (20-byte)
   * @throws Error if key generation fails
   * @example
   * ```typescript
   * const keyPair = await CryptoUtils.generateKeyPair();
   * console.log(keyPair.privateKey);  // 0x... (for signing)
   * console.log(keyPair.publicKey);   // 0x04... (65 bytes - off-chain verification)
   * console.log(keyPair.address);     // 0x742d... (20 bytes - on-chain use)
   *
   * // Off-chain: physical lock verification
   * const offChainSig = CryptoUtils.signOffChain(vcHash, keyPair.privateKey);
   * const isValid = CryptoUtils.verifyOffChain(vcHash, offChainSig.signature, keyPair.publicKey);
   *
   * // On-chain: smart contract interaction
   * const onChainSig = await CryptoUtils.signOnChain(vcHash, keyPair.privateKey);
   * await contract.revokeCredential(vcHash, onChainSig.signature);
   * ```
   */
  static async generateCryptoIdentity(): Promise<CryptoIdentity> {
    try {
      const wallet = ethers.Wallet.createRandom();

      return {
        privateKey: wallet.privateKey, // For signing
        publicKey: wallet.publicKey, // 65-byte key (off-chain)
        address: wallet.address, // 20-byte address (on-chain)
      };
    } catch (error) {
      throw new Error(`ECDSA key generation failed: ${error}`);
    }
  }

  /**
   * Creates the canonical hash of a Verifiable Credential input
   * IMPORTANT: Your smart contract must use the SAME hashing scheme!
   *
   * @param vcInput - The VC data to hash
   * @returns The Keccak-256 hash of the canonical VC representation
   * @example
   * ```typescript
   * const vcInput = {
   *   userMetaDataHash: "0x123...",
   *   issuanceDate: new Date().toISOString(),
   *   expirationDate: new Date(Date.now() + 86400000).toISOString()
   * };
   * const vcHash = CryptoUtils.getVCHash(vcInput);
   * ```
   */
  static getVCHash(vcInput: VCSigningInput): string {
    const message = JSON.stringify({
      userMetaDataHash: vcInput.userMetaDataHash,
      issuanceDate: vcInput.issuanceDate,
      expirationDate: vcInput.expirationDate || null,
    });
    return ethers.keccak256(ethers.toUtf8Bytes(message));
  }

  // ============================================================================
  // OFF-CHAIN FUNCTIONS (Physical Lock / Mobile App Verification)
  // ============================================================================

  /**
   * Signs a RAW hash for OFF-CHAIN verification (e.g., physical lock)
   * This signature can be verified by ANY standard ECDSA library
   * NO Ethereum-specific prefix is added
   *
   * USE CASE: Physical lock verifies VC without smart contract
   *
   * @param dataHash - The raw hash to sign (e.g., vcHash from getVCHash)
   * @param privateKey - The private key to sign with
   * @returns SigningResult with compact signature (r+s+v format)
   * @example
   * ```typescript
   * const vcHash = CryptoUtils.getVCHash(vcInput);
   * const signature = CryptoUtils.signOffChain(vcHash, keyPair.privateKey);
   * // Physical lock can verify with keyPair.publicKey
   * ```
   */
  static signOffChain(dataHash: string, privateKey: string): SigningResult {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const hashBytes = ethers.getBytes(dataHash);

      // wallet.signingKey.sign() signs the RAW hash (no Ethereum prefix)
      const sig = wallet.signingKey.sign(hashBytes);

      return {
        signature: sig.serialized, // Serialized signature format
        signedMessageHash: dataHash,
      };
    } catch (error) {
      throw new Error(`ECDSA off-chain signing failed: ${error}`);
    }
  }

  /**
   * Verifies an OFF-CHAIN signature using the FULL PUBLIC KEY
   * This is what your physical lock will use
   *
   * @param dataHash - The original raw hash
   * @param signature - The off-chain signature (from signOffChain)
   * @param publicKey - The full 65-byte public key (0x04...)
   * @returns true if signature is valid
   * @example
   * ```typescript
   * const isValid = CryptoUtils.verifyOffChain(
   *   vcHash,
   *   signature.signature,
   *   keyPair.publicKey  // 65-byte key!
   * );
   * ```
   */
  static verifyOffChain(
    dataHash: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const hashBytes = ethers.getBytes(dataHash);

      // Recover public key from raw hash and signature
      const recoveredPubKey = SigningKey.recoverPublicKey(hashBytes, signature);

      // Compare recovered key with expected key
      return recoveredPubKey.toLowerCase() === publicKey.toLowerCase();
    } catch (error) {
      console.error("❌ Off-chain verification failed:", error);
      return false;
    }
  }

  // ============================================================================
  // ON-CHAIN FUNCTIONS (Smart Contract Integration)
  // ============================================================================

  /**
   * Signs a hash with ETHEREUM-SPECIFIC PREFIX for on-chain use
   * USE ONLY for smart contract calls (e.g., revokeCredential)!
   * This adds the "\x19Ethereum Signed Message:\n32" prefix
   *
   * @param dataHash - The hash to sign (e.g., vcHash)
   * @param privateKey - The private key to sign with
   * @returns SigningResult with Ethereum-prefixed signature
   * @example
   * ```typescript
   * const vcHash = CryptoUtils.getVCHash(vcInput);
   * const signature = await CryptoUtils.signOnChain(vcHash, keyPair.privateKey);
   * await contract.revokeCredential(vcHash, signature.signature);
   * ```
   */
  static async signOnChain(
    dataHash: string,
    privateKey: string
  ): Promise<SigningResult> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const hashBytes = ethers.getBytes(dataHash);

      // signMessage() AUTOMATICALLY adds the Ethereum prefix
      const signature = await wallet.signMessage(hashBytes);

      return {
        signature: signature,
        signedMessageHash: dataHash,
      };
    } catch (error) {
      throw new Error(`ECDSA on-chain signing failed: ${error}`);
    }
  }

  /**
   * Verifies an ON-CHAIN (Ethereum-prefixed) signature using ADDRESS
   * This does exactly what your smart contract's ecrecover does
   *
   * @param dataHash - The original hash
   * @param signature - The on-chain signature (from signOnChain)
   * @param ethereumAddress - The expected signer's address
   * @returns true if signature is valid
   * @example
   * ```typescript
   * const isValid = CryptoUtils.verifyOnChain(
   *   vcHash,
   *   signature.signature,
   *   keyPair.address  // 20-byte address!
   * );
   * ```
   */
  static verifyOnChain(
    dataHash: string,
    signature: string,
    ethereumAddress: string
  ): boolean {
    try {
      const hashBytes = ethers.getBytes(dataHash);

      // verifyMessage() knows to look for Ethereum prefix
      const recoveredAddress = ethers.verifyMessage(hashBytes, signature);

      return recoveredAddress.toLowerCase() === ethereumAddress.toLowerCase();
    } catch (error) {
      console.error("❌ On-chain verification failed:", error);
      return false;
    }
  }

  // ============================================================================
  // LEGACY COMPATIBILITY FUNCTIONS
  // ============================================================================

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
