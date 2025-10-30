import { ECDSACryptoService } from "./CryptoService";

/**
 * On-Chain Service
 *
 * Handles cryptographic operations for smart contract integration
 * (e.g., Ethereum blockchain, credential revocation, on-chain verification)
 *
 * KEY CHARACTERISTICS:
 * - Uses Ethereum-prefixed signatures ("\x19Ethereum Signed Message:\n32")
 * - Verifies with 20-byte Ethereum address
 * - Compatible with Solidity's ecrecover function
 * - Required for blockchain interactions
 * - Immutable on-chain record
 */
export class OnChainService {
  private cryptoService: ECDSACryptoService;

  constructor(cryptoService?: ECDSACryptoService) {
    this.cryptoService = cryptoService || new ECDSACryptoService();
  }

  /**
   * Sign data for on-chain verification
   * USE CASE: Smart contract calls (e.g., revokeCredential)
   * Automatically adds Ethereum-specific prefix
   *
   * @param dataHash - The hash to sign
   * @param privateKey - Private key for signing
   * @returns Object containing signature and signed hash
   * @example
   * ```typescript
   * const onChain = new OnChainService();
   * const credentialHash = onChain.hashCredential(credential);
   * const result = await onChain.signForBlockchain(credentialHash, privateKey);
   * await contract.revokeCredential(credentialHash, result.signature);
   * ```
   */
  async signForBlockchain(
    dataHash: string,
    privateKey: string
  ): Promise<{ signature: string; signedHash: string }> {
    const signature = await this.cryptoService.sign(dataHash, privateKey, {
      ethereumPrefix: true, // Ethereum-prefixed signature
    });

    return {
      signature,
      signedHash: dataHash,
    };
  }

  /**
   * Verify on-chain signature using ETHEREUM ADDRESS
   * This does exactly what your smart contract's ecrecover does
   *
   * @param dataHash - Original hash that was signed
   * @param signature - On-chain signature
   * @param ethereumAddress - 20-byte Ethereum address
   * @returns True if signature is valid
   * @example
   * ```typescript
   * const onChain = new OnChainService();
   * const isValid = await onChain.verifyBlockchainSignature(
   *   credentialHash,
   *   signature,
   *   identity.address  // 20-byte address!
   * );
   * ```
   */
  async verifyBlockchainSignature(
    dataHash: string,
    signature: string,
    ethereumAddress: string
  ): Promise<boolean> {
    return this.cryptoService.verify(dataHash, signature, ethereumAddress, {
      ethereumPrefix: true, // Ethereum-prefixed verification
    });
  }

  /**
   * Hash credential data for blockchain operations
   * IMPORTANT: Your smart contract must use the SAME hashing scheme!
   *
   * @param data - Data to hash
   * @returns Keccak-256 hash (Ethereum standard)
   */
  hashCredential(data: Record<string, unknown> | string): string {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    return this.cryptoService.hash(dataString);
  }

  /**
   * Create a message hash for smart contract verification
   * This matches what Solidity's ecrecover expects
   *
   * @param message - Message to hash
   * @returns Prefixed message hash
   */
  createMessageHash(message: string): string {
    return this.cryptoService.hash(message);
  }

  /**
   * Sign a transaction for submission to blockchain
   * @param transaction - Transaction data
   * @param privateKey - Private key to sign with
   * @returns Signed transaction
   */
  async signTransaction(
    transaction: {
      to: string;
      value?: string;
      data?: string;
      gasLimit?: number;
      gasPrice?: string;
      nonce?: number;
    },
    privateKey: string
  ): Promise<string> {
    // This would typically use ethers.js Wallet.signTransaction
    // Placeholder for actual implementation
    throw new Error(
      "Transaction signing requires a provider. Use ethers.Wallet directly."
    );
  }

  /**
   * Recover Ethereum address from signature
   * Useful for verification without needing to know the address beforehand
   *
   * @param dataHash - Hash that was signed
   * @param signature - Signature
   * @returns Recovered Ethereum address
   */
  async recoverAddress(dataHash: string, signature: string): Promise<string> {
    const ethers = await import("ethers");
    const hashBytes = ethers.ethers.getBytes(dataHash);
    return ethers.ethers.verifyMessage(hashBytes, signature);
  }

  /**
   * Create a revocation hash for smart contract
   * Standard format for credential revocation
   *
   * @param credentialId - ID of the credential
   * @param issuerAddress - Address of the issuer
   * @returns Hash for revocation registry
   */
  createRevocationHash(credentialId: string, issuerAddress: string): string {
    const data = `revoke_${credentialId}_${issuerAddress}`;
    return this.cryptoService.hash(data);
  }

  /**
   * Verify revocation status signature
   * @param credentialHash - Hash of the credential
   * @param revocationSignature - Signature from revocation registry
   * @param issuerAddress - Issuer's address
   * @returns True if revocation signature is valid
   */
  async verifyRevocationSignature(
    credentialHash: string,
    revocationSignature: string,
    issuerAddress: string
  ): Promise<boolean> {
    return this.verifyBlockchainSignature(
      credentialHash,
      revocationSignature,
      issuerAddress
    );
  }
}
