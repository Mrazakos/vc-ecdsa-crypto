import { ethers } from "ethers";
import { ECDSACryptoService } from "./CryptoService";

/**
 * Off-Chain Service
 *
 * Handles cryptographic operations for physical device verification
 * (e.g., smart locks, IoT devices, mobile app verification)
 *
 * KEY CHARACTERISTICS:
 * - Uses RAW ECDSA signatures (no Ethereum prefix)
 * - Verifies with full 65-byte public key
 * - Standard ECDSA compatible with any library
 * - Can support post-quantum algorithms in the future
 * - Privacy-focused (no blockchain interaction)
 */
export class OffChainService {
  private cryptoService: ECDSACryptoService;

  constructor(cryptoService?: ECDSACryptoService) {
    this.cryptoService = cryptoService || new ECDSACryptoService();
  }

  /**
   * Sign data for off-chain verification
   * USE CASE: Physical lock verifies VC without smart contract
   *
   * @param dataHash - The hash to sign (e.g., credential hash)
   * @param privateKey - Private key for signing
   * @returns Object containing signature and signed hash
   * @example
   * ```typescript
   * const offChain = new OffChainService();
   * const credentialHash = offChain.hashCredential(credential);
   * const result = await offChain.signCredential(credentialHash, privateKey);
   * // Physical lock can verify with publicKey
   * ```
   */
  async signData(
    dataHash: string,
    privateKey: string
  ): Promise<{ signature: string; signedHash: string }> {
    const signature = await this.cryptoService.sign(dataHash, privateKey, {
      ethereumPrefix: false, // RAW signature, no Ethereum prefix
    });

    return {
      signature,
      signedHash: dataHash,
    };
  }

  /**
   * Verify off-chain signature using FULL PUBLIC KEY
   * This is what your physical lock will use
   *
   * @param dataHash - Original hash that was signed
   * @param signature - Signature to verify
   * @param publicKey - Full 65-byte public key (0x04...)
   * @returns True if signature is valid
   * @example
   * ```typescript
   * const offChain = new OffChainService();
   * const isValid = await offChain.verifySignature(
   *   credentialHash,
   *   signature,
   *   identity.publicKey  // 65-byte key!
   * );
   * if (isValid) {
   *   // Unlock door, grant access, etc.
   * }
   * ```
   */
  async verifySignature(
    dataHash: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    return this.cryptoService.verify(dataHash, signature, publicKey, {
      ethereumPrefix: false, // RAW verification
    });
  }

  /**
   * Hash credential data for signing
   * Creates a canonical hash of the credential content
   *
   * @param data - Data to hash (can be object or string)
   * @returns Keccak-256 hash
   */
  hashCredential(data: Record<string, unknown> | string): string {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    return this.cryptoService.hash(dataString);
  }

  /**
   * Create a nonce for challenge-response authentication
   * Prevents replay attacks
   */
  createChallenge(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /**
   * Verify a challenge-response
   * @param challenge - Original challenge sent
   * @param response - Signed challenge
   * @param publicKey - Public key of the signer
   */
  async verifyChallengeResponse(
    challenge: string,
    response: string,
    publicKey: string
  ): Promise<boolean> {
    const challengeHash = this.cryptoService.hash(challenge);
    return this.verifySignature(challengeHash, response, publicKey);
  }

  /**
   * Generate a time-based access token
   * Useful for temporary access grants
   *
   * @param identity - Crypto identity to sign with
   * @param validitySeconds - How long the token is valid
   * @returns Signed token with expiration
   */
  async generateAccessToken(
    privateKey: string,
    validitySeconds: number = 300
  ): Promise<{
    token: string;
    signature: string;
    expiresAt: number;
  }> {
    const expiresAt = Date.now() + validitySeconds * 1000;
    const token = `access_${expiresAt}_${ethers.hexlify(
      ethers.randomBytes(16)
    )}`;
    const tokenHash = this.cryptoService.hash(token);
    const signature = await this.signData(tokenHash, privateKey);

    return {
      token,
      signature: signature.signature,
      expiresAt,
    };
  }

  /**
   * Verify access token
   * @param token - Token string
   * @param signature - Signature of the token
   * @param publicKey - Public key to verify against
   * @returns True if token is valid and not expired
   */
  async verifyAccessToken(
    token: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    // Check expiration
    const parts = token.split("_");
    if (parts.length < 2) return false;

    const expiresAt = parseInt(parts[1], 10);
    if (Date.now() > expiresAt) {
      return false; // Token expired
    }

    // Verify signature
    const tokenHash = this.cryptoService.hash(token);
    return this.verifySignature(tokenHash, signature, publicKey);
  }
}
