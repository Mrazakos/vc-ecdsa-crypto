/**
 * @module @mraz_akos/vc-ecdsa-crypto
 * Fast ECDSA cryptographic utilities for Verifiable Credentials
 * 100-1000x faster than RSA on mobile devices
 */

// Export all types
export {
  KeyPair,
  Hash,
  Address,
  VCSigningInput,
  SigningResult,
  CryptoTestResult,
} from "./types";

// Export the main utility class
export { CryptoUtils } from "./CryptoUtils";

// Default export for convenience
import { CryptoUtils } from "./CryptoUtils";
export default CryptoUtils;
