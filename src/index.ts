/**
 * @module @mraz_akos/vc-ecdsa-crypto
 * Fast ECDSA cryptographic utilities for W3C Verifiable Credentials
 * 100-1000x faster than RSA on mobile devices
 * 
 * VERSION 3.0 - W3C VC 2.0 Compliant with Service-Based Architecture
 */

// ============================================================================
// W3C VC 2.0 TYPES
// ============================================================================
export * from "./types/w3c-vc.types";

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================
export {
  KeyPair, // @deprecated - use CryptoIdentity
  CryptoIdentity,
  Hash,
  Address,
  VCSigningInput, // @deprecated - use W3C VC types
  SigningResult,
  CryptoTestResult,
} from "./types";

// ============================================================================
// NEW SERVICE-BASED ARCHITECTURE (Recommended)
// ============================================================================

// Core crypto services
export { CryptoService, ECDSACryptoService } from "./services/CryptoService";

// Separation of concerns: on-chain vs off-chain
export { OffChainService } from "./services/OffChainService";
export { OnChainService } from "./services/OnChainService";

// W3C VC issuing and verification
export { VCIssuer } from "./services/VCIssuer";
export { VCVerifier } from "./services/VCVerifier";

// ============================================================================
// LEGACY STATIC CLASS (for backward compatibility)
// ============================================================================
export { CryptoUtils } from "./CryptoUtils";

// ============================================================================
// DEFAULT EXPORT (convenience)
// ============================================================================
import { CryptoUtils } from "./CryptoUtils";
import { VCIssuer } from "./services/VCIssuer";
import { VCVerifier } from "./services/VCVerifier";
import { ECDSACryptoService } from "./services/CryptoService";
import { OffChainService } from "./services/OffChainService";
import { OnChainService } from "./services/OnChainService";

/**
 * Default export provides both legacy and new APIs
 */
export default {
  // Legacy static utilities
  CryptoUtils,

  // New service classes
  VCIssuer,
  VCVerifier,
  ECDSACryptoService,
  OffChainService,
  OnChainService,
};
