# @mrazakos/vc-ecdsa-crypto

[![npm version](https://img.shields.io/npm/v/@mrazakos/vc-ecdsa-crypto.svg)](https://www.npmjs.com/package/@mrazakos/vc-ecdsa-crypto)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

> **Fast ECDSA cryptographic utilities for W3C Verifiable Credentials - 100-1000x faster than RSA on mobile devices.**

A production-ready TypeScript library for issuing, signing, and verifying W3C Verifiable Credentials using ECDSA (secp256k1). Designed for both off-chain and on-chain (Ethereum-compatible) credential management with exceptional performance on resource-constrained devices.

---

## 🚀 Features

- **⚡ Blazing Fast**: 100-1000x faster than RSA on mobile devices
- **🔐 W3C Compliant**: Full support for W3C Verifiable Credentials 2.0 specification
- **⛓️ Dual Mode**: Both off-chain and on-chain (Ethereum-compatible) operations
- **🏗️ Service Architecture**: Clean separation of concerns with dedicated services
- **🛡️ Battle-Tested**: Comprehensive test suite with 100% operational success rate
- **📱 Mobile Optimized**: Minimal computational overhead perfect for IoT and mobile
- **🔑 Smart Contract Ready**: Ethereum address-based public keys for seamless blockchain integration
- **TypeScript Native**: Full type safety with comprehensive TypeScript definitions

---

## 📦 Installation

```bash
npm install @mrazakos/vc-ecdsa-crypto
```

**Requirements:**
- Node.js ≥ 16.0.0
- TypeScript ≥ 5.0 (for TypeScript projects)

**⚠️ Security Warning:** This library is provided for educational and development purposes. While it has passed comprehensive testing, it has NOT undergone formal security audits. **Do not use in production environments handling sensitive data or financial transactions without additional security review.**

---

## 🎯 Quick Start

### Basic Example: Issue and Verify a Credential

```typescript
import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  AccessControlCredentialSubject,
} from "@mrazakos/vc-ecdsa-crypto";

async function quickstart() {
  // 1. Create a crypto service instance
  const crypto = new ECDSACryptoService();
  
  // 2. Generate identity for the issuer (credential authority)
  const issuerIdentity = await crypto.generateIdentity();
  console.log("Issuer Address:", issuerIdentity.address);
  
  // 3. Create credential subject (what the credential is about)
  const userEmail = "user@example.com";
  const credentialSubject: AccessControlCredentialSubject = {
    id: `did:key:${issuerIdentity.publicKey}`,
    userMetaDataHash: crypto.hash(userEmail),
    lock: {
      id: "lock-123",
      name: "Main Office Door",
    },
    accessLevel: "standard",
    permissions: ["unlock"],
  };
  
  // 4. Issue the credential
  const issuer = new VCIssuer();
  const credential = await issuer.issueOffChainCredential(
    { id: "did:example:authority", name: "Security Team" },
    credentialSubject,
    issuerIdentity.privateKey,
    {
      publicKey: issuerIdentity.publicKey,
      credentialTypes: ["LockAccessCredential"],
    }
  );
  
  console.log("✅ Credential issued:", credential);
  
  // 5. Verify the credential
  const verifier = new VCVerifier();
  const result = await verifier.verifyOffChainCredential(
    credential,
    issuerIdentity.publicKey,
    { checkExpiration: true }
  );
  
  if (result.verified) {
    console.log("✅ Credential verified successfully!");
    console.log("Access granted to:", credentialSubject.lock?.name);
  } else {
    console.log("❌ Credential verification failed!");
  }
}

quickstart().catch(console.error);
```

---

## 📚 Core Services

The library follows a service-based architecture for clean separation of concerns:

### 1. **ECDSACryptoService** - Core Cryptography

Low-level cryptographic operations using ECDSA (secp256k1):

```typescript
import { ECDSACryptoService } from "@mrazakos/vc-ecdsa-crypto";

const crypto = new ECDSACryptoService();

// Generate identity
const identity = await crypto.generateIdentity();
// Returns: { privateKey, publicKey, address }

// Hash data
const hash = crypto.hash("data to hash");

// Sign data (off-chain)
const signature = await crypto.sign(hash, identity.privateKey);

// Verify signature (off-chain)
const isValid = await crypto.verify(hash, signature, identity.publicKey);
```

**Performance:**
- Key Generation: ~10ms
- Signing: ~1.5ms
- Verification: ~4ms

### 2. **VCIssuer** - Credential Issuance

Issue W3C-compliant verifiable credentials:

```typescript
import { VCIssuer } from "@mrazakos/vc-ecdsa-crypto";

const issuer = new VCIssuer();

// Issue off-chain credential
const credential = await issuer.issueOffChainCredential(
  { id: "did:example:issuer", name: "Authority" },
  credentialSubject,
  privateKey,
  {
    publicKey: publicKey,
    credentialTypes: ["CustomCredential"],
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }
);

// Issue on-chain credential (Ethereum-compatible)
const onChainCredential = await issuer.issueOnChainCredential(
  issuer,
  credentialSubject,
  privateKey,
  { address: ethereumAddress }
);
```

### 3. **VCVerifier** - Credential Verification

Verify W3C credentials with comprehensive validation:

```typescript
import { VCVerifier } from "@mrazakos/vc-ecdsa-crypto";

const verifier = new VCVerifier();

// Verify off-chain credential
const result = await verifier.verifyOffChainCredential(
  credential,
  issuerPublicKey,
  {
    checkExpiration: true,
    checkNotBefore: true,
  }
);

console.log(result.verified); // true/false
console.log(result.reason); // Failure reason if verified = false

// Verify on-chain credential
const onChainResult = await verifier.verifyOnChainCredential(
  credential,
  issuerAddress,
  { checkExpiration: true }
);
```

### 4. **OnChainService** - Blockchain Integration

Ethereum-compatible operations for smart contract integration:

```typescript
import { OnChainService } from "@mrazakos/vc-ecdsa-crypto";

const onChainService = new OnChainService();

// Sign with Ethereum message prefix
const signature = await onChainService.signOnChain(hash, privateKey);

// Verify and recover address
const isValid = await onChainService.verifyOnChain(
  hash,
  signature,
  expectedAddress
);

// Recover signer address (for smart contracts)
const signerAddress = await onChainService.recoverAddress(hash, signature);

// Batch verification (efficient for multiple checks)
const results = await onChainService.batchVerify(
  [hash1, hash2, hash3],
  [sig1, sig2, sig3],
  [addr1, addr2, addr3]
);
```

### 5. **OffChainService** - Off-Chain Operations

Off-chain utilities for challenge-response and access tokens:

```typescript
import { OffChainService } from "@mrazakos/vc-ecdsa-crypto";

const offChainService = new OffChainService();

// Generate access token
const token = await offChainService.generateAccessToken(
  userId,
  metadata,
  privateKey,
  { publicKey, expiresInSeconds: 3600 }
);

// Verify access token
const tokenResult = await offChainService.verifyAccessToken(
  token,
  publicKey,
  { checkExpiration: true }
);

// Challenge-response authentication
const challenge = offChainService.createChallenge();
const response = await offChainService.signChallenge(challenge, privateKey);
const isChallengeValid = await offChainService.verifyChallenge(
  challenge,
  response,
  publicKey
);
```

---

## 🎨 Use Cases

### 1. Access Control System (Smart Locks)

```typescript
// Issue access credential for a smart lock
const lockCredential = await issuer.issueOffChainCredential(
  { id: "did:lock:admin", name: "Building Manager" },
  {
    id: `did:user:${userId}`,
    userMetaDataHash: crypto.hash(userEmail),
    lock: { id: "lock-123", name: "Office 401" },
    accessLevel: "standard",
    permissions: ["unlock"],
  },
  adminPrivateKey,
  { publicKey: adminPublicKey, credentialTypes: ["LockAccessCredential"] }
);

// Lock verifies credential
const verificationResult = await verifier.verifyOffChainCredential(
  lockCredential,
  adminPublicKey,
  { checkExpiration: true }
);

if (verificationResult.verified) {
  // Grant access
  console.log("🔓 Door unlocked!");
}
```

### 2. Educational Certificates

```typescript
// University issues degree credential
const degreeCertificate = await issuer.issueOffChainCredential(
  { id: "did:university:mit", name: "MIT" },
  {
    id: `did:student:${studentId}`,
    degree: "Bachelor of Science",
    major: "Computer Science",
    graduationDate: "2025-05-15",
    gpa: 3.8,
  },
  universityPrivateKey,
  { publicKey: universityPublicKey, credentialTypes: ["DegreeCertificate"] }
);

// Employer verifies credential
const isValid = await verifier.verifyOffChainCredential(
  degreeCertificate,
  universityPublicKey
);
```

### 3. Blockchain Integration (DeFi, NFTs)

```typescript
// Issue on-chain verifiable credential
const nftAccessCredential = await issuer.issueOnChainCredential(
  { id: "did:nft:authority", name: "NFT Platform" },
  {
    id: `did:eth:${userAddress}`,
    tokenId: "12345",
    collectionAddress: "0x...",
    privileges: ["mint", "transfer"],
  },
  platformPrivateKey,
  { address: platformAddress }
);

// Smart contract verifies signature
const signerAddress = await onChainService.recoverAddress(
  credentialHash,
  credential.proof.proofValue
);

// Contract checks if signer is authorized
if (signerAddress === authorizedIssuer) {
  // Execute privileged action
}
```

### 4. API Authentication

```typescript
// Generate short-lived access token
const accessToken = await offChainService.generateAccessToken(
  userId,
  { roles: ["admin"], scopes: ["read", "write"] },
  serverPrivateKey,
  { publicKey: serverPublicKey, expiresInSeconds: 3600 }
);

// Client sends token with API request
// Server verifies token
const tokenVerification = await offChainService.verifyAccessToken(
  accessToken,
  serverPublicKey,
  { checkExpiration: true }
);

if (tokenVerification.verified) {
  // Process API request
}
```

---

## 🔐 Security

### ⚠️ Important Security Notice

**This library has been tested against specific attack vectors, but security cannot be guaranteed to be 100%.** While comprehensive stress testing shows strong defensive properties, **any attack vector not explicitly tested may succeed**. This is true for all cryptographic software.

### Security Assessment

The library has undergone comprehensive stress testing with **good security posture in tested scenarios**:

- ✅ **100% operational success rate** across all tested services
- ✅ **0 security breaches** in tested adversarial scenarios
- ✅ **0 robustness crashes** with tested malformed inputs
- ✅ Successfully defended against tested signature forgery, replay attacks, and tampering attempts

**⚠️ What Has NOT Been Tested:**
- Side-channel attacks (timing, power analysis, cache-timing)
- Quantum computing attacks (ECDSA is quantum-vulnerable)
- Advanced cryptanalysis attacks
- Social engineering and physical security attacks
- Attacks on the underlying Node.js crypto implementation
- Zero-day vulnerabilities in dependencies

**Key Security Features (In Tested Scenarios):**
- ECDSA (secp256k1) cryptographic foundation
- W3C Verifiable Credentials 2.0 compliance
- Deterministic canonicalization for hash consistency
- Replay attack protection with nonces (tested)
- Temporal validation (expiration, not-before checks)
- Graceful error handling without information leakage (in tested cases)

### Best Practices

**For Production Deployments:**

1. **Private Key Management**
   ```typescript
   // ❌ DON'T: Store keys in plaintext
   const privateKey = "0x1234...";
   
   // ✅ DO: Use environment variables or secure vaults
   const privateKey = process.env.ISSUER_PRIVATE_KEY;
   
   // ✅ DO: Use Hardware Security Modules (HSMs) for production
   ```

2. **Key Storage**
   - Never commit private keys to version control
   - Use encrypted storage (AWS KMS, Azure Key Vault, etc.)
   - Implement key rotation policies
   - Zero out keys in memory after use

3. **Rate Limiting**
   ```typescript
   // Implement rate limiting on cryptographic operations
   // to prevent DoS and timing attacks
   ```

4. **Input Validation**
   ```typescript
   // Always validate inputs before passing to library
   if (!isValidCredential(credential)) {
     throw new Error("Invalid credential format");
   }
   ```

5. **Expiration Times**
   ```typescript
   // Use short-lived credentials where appropriate
   const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour
   ```

### Known Limitations & Risks

⚠️ **CRITICAL: DO NOT USE IN HIGH-SECURITY OR FINANCIALLY-CRITICAL ENVIRONMENTS WITHOUT ADDITIONAL SECURITY AUDITS**

- **Side-channel attacks**: Not tested - timing attacks may be possible
- **Quantum resistance**: ECDSA is quantum-vulnerable - not future-proof
- **Dependency security**: Relies on external package security - supply chain risks exist
- **Untested attack vectors**: Many attack types have not been evaluated
- **No formal security audit**: This library has not undergone professional third-party security audit
- **Production risk**: Use at your own risk - we are aware attacks not tested here may succeed

**Recommended Before Production Use:**
1. Professional third-party security audit
2. Penetration testing by security experts
3. Comprehensive threat modeling for your specific use case
4. Regular security updates and monitoring
5. Bug bounty program consideration

For detailed security analysis (of tested scenarios), see [LIBRARY_SECURITY_ASSESSMENT.md](./LIBRARY_SECURITY_ASSESSMENT.md).

---

## 📊 Performance

Based on comprehensive stress testing (600+ operations per service):

| Operation | Average Time | Throughput (single-threaded) |
|-----------|-------------|------------------------------|
| Key Generation | 9.66ms | ~100 ops/sec |
| Off-Chain Signing | 1.40ms | ~700 ops/sec |
| Off-Chain Verification | 3.66ms | ~270 ops/sec |
| On-Chain Signing | 1.57ms | ~630 ops/sec |
| On-Chain Verification | 4.03ms | ~250 ops/sec |
| Credential Issuance | 1.92ms | ~520 ops/sec |
| Credential Verification | 4.57ms | ~220 ops/sec |

**Comparison with RSA:**
- **Mobile devices**: 100-1000x faster than RSA-2048
- **Desktop**: 10-50x faster than RSA-2048
- **Smaller signatures**: ~65 bytes vs 256 bytes (RSA-2048)

---

## 🏗️ Architecture

### Dual-Mode Operation

The library supports both off-chain and on-chain credential management:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ├─────────────────────────┐
                           │                         │
                    ┌──────▼──────┐          ┌──────▼──────┐
                    │  Off-Chain  │          │  On-Chain   │
                    │   Service   │          │   Service   │
                    └──────┬──────┘          └──────┬──────┘
                           │                         │
                           ├─────────────────────────┤
                           │                         │
                    ┌──────▼─────────────────────────▼──────┐
                    │         ECDSACryptoService            │
                    │        (secp256k1 curve)              │
                    └───────────────────────────────────────┘
```

**Off-Chain Mode:**
- Uses 65-byte uncompressed public keys
- Faster verification (no blockchain interaction)
- Ideal for mobile apps, IoT devices, APIs

**On-Chain Mode:**
- Uses Ethereum addresses (20 bytes)
- EIP-191 compatible signatures
- Smart contract integration ready
- Gas-optimized operations

---

## 🧪 Testing

The library includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- crypto-service-stress.test.ts

# Run with coverage
npm test -- --coverage
```

**Test Coverage:**
- ✅ Crypto Service: 600 operations, 0 failures
- ✅ VC Issuer: 51 operations, 0 failures
- ✅ VC Verifier: 52 operations, 0 failures
- ✅ On-Chain Service: 151 operations, 0 failures
- ✅ Off-Chain Service: 90 operations, 0 failures

**Adversarial Testing:**
- Signature forgery attempts
- Message tampering
- Replay attacks
- Wrong key verification
- Malformed input handling
- Expiration bypass attempts

---

## 🛠️ Development

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Mrazakos/vc-ecdsa-crypto.git
cd vc-ecdsa-crypto

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode (watch)
npm run dev
```

### Project Structure

```
vc-ecdsa-crypto/
├── src/
│   ├── index.ts                 # Main exports
│   ├── types.ts                 # Legacy types
│   ├── types/
│   │   └── w3c-vc.types.ts     # W3C VC type definitions
│   ├── services/
│   │   ├── CryptoService.ts     # Core crypto operations
│   │   ├── OffChainService.ts   # Off-chain utilities
│   │   ├── OnChainService.ts    # Blockchain integration
│   │   ├── VCIssuer.ts          # Credential issuance
│   │   └── VCVerifier.ts        # Credential verification
│   └── examples/
│       └── simple-lock-open-example.ts
├── tests/                       # Comprehensive test suites
├── dist/                        # Compiled output
└── package.json
```

---

## 📖 API Reference

### Types

#### CryptoIdentity
```typescript
interface CryptoIdentity {
  privateKey: string;    // Hex-encoded private key
  publicKey: string;     // 65-byte uncompressed public key
  address: string;       // Ethereum address (20 bytes)
}
```

#### VerifiableCredential (W3C)
```typescript
interface VerifiableCredential<T = any> {
  "@context": string[];
  type: string[];
  issuer: Issuer | string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: T;
  proof: Proof;
}
```

#### AccessControlCredentialSubject
```typescript
interface AccessControlCredentialSubject {
  id: string;
  userMetaDataHash: string;
  lock?: {
    id: string;
    name: string;
  };
  accessLevel?: string;
  permissions?: string[];
}
```

For complete API documentation, see the TypeScript definitions in `dist/index.d.ts`.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Before submitting:**
- Run tests: `npm test`
- Ensure TypeScript compiles: `npm run build`
- Follow existing code style
- Add tests for new features

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Mráz Ákos

---

## 🔗 Links

- **npm Package**: [@mrazakos/vc-ecdsa-crypto](https://www.npmjs.com/package/@mrazakos/vc-ecdsa-crypto)
- **GitHub Repository**: [Mrazakos/vc-ecdsa-crypto](https://github.com/Mrazakos/vc-ecdsa-crypto)
- **Issues**: [GitHub Issues](https://github.com/Mrazakos/vc-ecdsa-crypto/issues)
- **W3C VC Spec**: [Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)

---

## 📚 Additional Resources

- [QUICKSTART.md](./QUICKSTART.md) - Get started in 2 minutes
- [LIBRARY_SECURITY_ASSESSMENT.md](./LIBRARY_SECURITY_ASSESSMENT.md) - Detailed security analysis
- [THESIS_RSA_VS_ECDSA_COMPARISON.md](./THESIS_RSA_VS_ECDSA_COMPARISON.md) - Performance comparison
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [PUBLISH_CHECKLIST.md](./PUBLISH_CHECKLIST.md) - Publishing guidelines

---

## 💬 Support

Need help? Have questions?

- 📧 Open an [issue](https://github.com/Mrazakos/vc-ecdsa-crypto/issues)
- 💡 Check existing [discussions](https://github.com/Mrazakos/vc-ecdsa-crypto/discussions)
- 📖 Read the [documentation](https://github.com/Mrazakos/vc-ecdsa-crypto)

---

## ⭐ Show Your Support

If this library helps your project, please consider giving it a star on GitHub!

---

<div align="center">

**Built with ❤️ for the decentralized future**

[⬆ back to top](#mrazakosvc-ecdsa-crypto)

</div>
