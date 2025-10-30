# Migration Guide: v2.x to v3.0

## 🎯 What Changed?

Version 3.0 introduces a major refactoring to address several key concerns:

1. **W3C VC 2.0 Compliance** - Full support for W3C Verifiable Credentials Data Model 2.0
2. **Service-Based Architecture** - Moved away from static classes to extensible services
3. **Separation of Concerns** - Clear distinction between on-chain and off-chain operations
4. **Better Signing Model** - Clear understanding of what gets signed in a VC

## 🤔 Key Questions Answered

### Q: Should I sign the entire VC?

**Yes!** According to W3C VC spec, you sign the **entire credential document EXCEPT the proof itself**.

This includes:

- `@context` - Defines the semantic meaning
- `type` - Credential types
- `issuer` - Who issued it
- `validFrom` / `validUntil` - Validity period
- **`credentialSubject`** - THE MAIN CLAIMS (this is your data!)
- `credentialStatus` - Revocation info (if present)
- Any other metadata

The signature mathematically binds all these fields together. If ANY field is tampered with, the signature becomes invalid.

**Example:**

```typescript
// This whole structure gets signed (except 'proof'):
{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiableCredential", "AccessControlCredential"],
  "issuer": { "id": "did:example:issuer", "name": "University" },
  "validFrom": "2024-10-30T10:00:00Z",
  "validUntil": "2025-10-30T10:00:00Z",
  "credentialSubject": {
    "id": "did:example:user123",
    "userMetaDataHash": "0x123...",
    "accessLevel": "premium"
  },
  // ☝️ Everything above gets signed
  "proof": {
    // This is the signature result
    "type": "EcdsaSecp256k1RecoverySignature2020",
    "proofValue": "0xabc..."
  }
}
```

### Q: Are my VCs W3C Standard Compliant?

**Now yes!** Version 3.0 implements:

- ✅ Required `@context` with W3C base context
- ✅ Required `type` array including "VerifiableCredential"
- ✅ Required `issuer` property
- ✅ Required `validFrom` (replaces old `issuanceDate`)
- ✅ Optional `validUntil` (replaces old `expirationDate`)
- ✅ Required `credentialSubject` with claims
- ✅ Proper `proof` structure
- ✅ Support for `credentialStatus`, `credentialSchema`, `evidence`, `termsOfUse`

### Q: How do I separate on-chain and off-chain concerns?

**Use the dedicated services:**

```typescript
import { OffChainService, OnChainService } from "@mrazakos/vc-ecdsa-crypto";

// For physical locks, mobile apps (no blockchain)
const offChain = new OffChainService();
const signature = await offChain.signData(credentialHash, privateKey);
const isValid = await offChain.verifySignature(hash, sig, publicKey);

// For smart contracts, blockchain operations
const onChain = new OnChainService();
const signature = await onChain.signForBlockchain(credentialHash, privateKey);
const isValid = await onChain.verifyBlockchainSignature(hash, sig, address);
```

**Key Differences:**

| Feature              | Off-Chain               | On-Chain               |
| -------------------- | ----------------------- | ---------------------- |
| **Signature Type**   | Raw ECDSA               | Ethereum-prefixed      |
| **Verification Key** | 65-byte public key      | 20-byte address        |
| **Use Case**         | Physical locks, IoT     | Smart contracts        |
| **Blockchain**       | No interaction          | Blockchain interaction |
| **Privacy**          | High (no public ledger) | Lower (public ledger)  |

## 🚀 Migration Examples

### Old Way (v2.x)

```typescript
import { CryptoUtils } from "@mrazakos/vc-ecdsa-crypto";

// Generate keys
const keyPair = await CryptoUtils.generateCryptoIdentity();

// Sign credential
const vcInput = {
  userMetaDataHash: "0x123...",
  issuanceDate: new Date().toISOString(),
  expirationDate: new Date(Date.now() + 86400000).toISOString(),
};
const vcHash = CryptoUtils.getVCHash(vcInput);
const signature = CryptoUtils.signOffChain(vcHash, keyPair.privateKey);

// Verify
const isValid = CryptoUtils.verifyOffChain(
  vcHash,
  signature.signature,
  keyPair.publicKey
);
```

### New Way (v3.0) - W3C Compliant

```typescript
import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  AccessControlCredentialSubject,
} from "@mrazakos/vc-ecdsa-crypto";

// 1. Generate identity
const crypto = new ECDSACryptoService();
const identity = await crypto.generateIdentity();

// 2. Issue W3C-compliant VC for off-chain use
const issuer = new VCIssuer();
const vc = await issuer.issueOffChainCredential(
  { id: "did:example:issuer123", name: "University" },
  {
    id: "did:example:user456",
    userMetaDataHash: "0x123...",
    accessLevel: "premium",
  } as AccessControlCredentialSubject,
  identity.privateKey,
  {
    credentialTypes: ["AccessControlCredential"],
    validityDays: 30,
    publicKey: identity.publicKey, // Required for off-chain
  }
);

// 3. Verify the VC
const verifier = new VCVerifier();
const result = await verifier.verifyOffChainCredential(vc, identity.publicKey);

if (result.verified) {
  console.log("✅ Credential is valid!", result.details);
} else {
  console.error("❌ Invalid:", result.error);
}
```

### For On-Chain (Blockchain) Use

```typescript
import { VCIssuer, VCVerifier } from "@mrazakos/vc-ecdsa-crypto";

const issuer = new VCIssuer();
const verifier = new VCVerifier();

// Issue for blockchain
const vc = await issuer.issueOnChainCredential(
  { id: `did:ethr:${identity.address}`, name: "Organization" },
  {
    id: `did:ethr:${userAddress}`,
    userMetaDataHash: "0x123...",
  },
  identity.privateKey,
  {
    credentialTypes: ["BlockchainCredential"],
    ethereumAddress: identity.address, // Required for on-chain
  }
);

// Verify (can be done off-chain or verified in smart contract)
const result = await verifier.verifyOnChainCredential(vc, identity.address);
```

## 🔧 Backward Compatibility

The old `CryptoUtils` static class is still available for backward compatibility:

```typescript
import { CryptoUtils } from "@mrazakos/vc-ecdsa-crypto";

// Old code still works!
const keyPair = await CryptoUtils.generateCryptoIdentity();
const signature = CryptoUtils.signOffChain(hash, keyPair.privateKey);
```

**However, we recommend migrating to the new service-based architecture for:**

- Better testability
- Easier extension
- Type safety
- Future-proofing

## 📦 Extended Example: Complete Workflow

```typescript
import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  OffChainService,
  AccessControlCredentialSubject,
} from "@mrazakos/vc-ecdsa-crypto";

async function completeWorkflow() {
  // 1. Setup services
  const crypto = new ECDSACryptoService();
  const issuer = new VCIssuer();
  const verifier = new VCVerifier();
  const offChain = new OffChainService();

  // 2. Generate identities
  const issuerIdentity = await crypto.generateIdentity();
  const userIdentity = await crypto.generateIdentity();

  // 3. Issue credential
  const vc = await issuer.issueOffChainCredential(
    {
      id: "did:example:university",
      name: "Example University",
    },
    {
      id: `did:key:${userIdentity.publicKey}`,
      userMetaDataHash: crypto.hash("user@example.com"),
      degree: "Bachelor of Science",
      graduationYear: 2024,
    } as AccessControlCredentialSubject,
    issuerIdentity.privateKey,
    {
      credentialTypes: ["UniversityDegreeCredential"],
      validityDays: 365,
      publicKey: issuerIdentity.publicKey,
    }
  );

  console.log("📄 Issued VC:", JSON.stringify(vc, null, 2));

  // 4. Verify credential
  const verificationResult = await verifier.verifyOffChainCredential(
    vc,
    issuerIdentity.publicKey,
    { checkExpiration: true }
  );

  console.log("✅ Verification:", verificationResult);

  // 5. Use off-chain service for challenge-response (e.g., unlock door)
  const challenge = offChain.createChallenge();
  const challengeHash = crypto.hash(challenge);
  const response = await crypto.sign(challengeHash, userIdentity.privateKey);

  const challengeValid = await offChain.verifyChallengeResponse(
    challenge,
    response,
    userIdentity.publicKey
  );

  if (challengeValid) {
    console.log("🔓 Access granted!");
  }
}

completeWorkflow().catch(console.error);
```

## 🎓 Best Practices

### 1. Choose the Right Service

- **Off-Chain** for privacy, physical devices, mobile apps
- **On-Chain** for blockchain, smart contracts, public ledgers

### 2. Always Validate in Addition to Verifying

```typescript
const result = await verifier.verifyOffChainCredential(vc, publicKey, {
  checkExpiration: true, // ✅ Check if expired
  checkNotBefore: true, // ✅ Check if not yet valid
});
```

### 3. Use Type-Safe Credential Subjects

```typescript
interface MyCustomCredentialSubject extends CredentialSubject {
  email: string;
  role: string;
  permissions: string[];
}

const vc = await issuer.issueOffChainCredential(
  issuer,
  {
    id: "did:example:user",
    email: "user@example.com",
    role: "admin",
    permissions: ["read", "write"],
  } as MyCustomCredentialSubject,
  privateKey,
  { publicKey }
);
```

### 4. Handle Errors Gracefully

```typescript
const result = await verifier.verifyOffChainCredential(vc, publicKey);

if (!result.verified) {
  switch (result.error) {
    case "Credential expired":
      // Request new credential
      break;
    case "Invalid signature":
      // Reject access
      break;
    default:
    // Log error
  }
}
```

## 🔮 Future Extensions

The new architecture makes it easy to add:

- **Post-quantum algorithms**: Implement new `CryptoService` subclass
- **Different proof types**: Extend `Proof` interface
- **Custom validation**: Extend `VCVerifier`
- **New credential types**: Define new `CredentialSubject` interfaces

```typescript
// Future: Post-quantum crypto
class QuantumResistantCryptoService extends CryptoService {
  async generateIdentity() {
    /* ... */
  }
  async sign(data, key) {
    /* ... */
  }
  async verify(data, sig, key) {
    /* ... */
  }
}

// Use it with existing services!
const issuer = new VCIssuer(new QuantumResistantCryptoService());
```

## 📚 Additional Resources

- [W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model/)
- [API Documentation](./README.md)
- [Test Examples](./tests/)

## 🆘 Need Help?

- Check the [examples folder](./examples/) for more use cases
- Read the inline documentation in each service
- Review the test suite for real-world usage
