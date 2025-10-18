# 🚀 Quick Start Guide

Get up and running with `@mrazakos/vc-ecdsa-crypto` in 2 minutes!

## Installation

```bash
npm install @mrazakos/vc-ecdsa-crypto
```

## Basic Usage

### 1. Import the library

```typescript
import { CryptoUtils } from "@mrazakos/vc-ecdsa-crypto";
```

### 2. Generate a key pair

```typescript
const keyPair = await CryptoUtils.generateKeyPair();
// keyPair.publicKey  - Share this
// keyPair.privateKey - Keep this secret!
```

### 3. Sign data

```typescript
const userData = { email: "user@example.com", name: "John" };
const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));

const vcInput = {
  userMetaDataHash: userMetaDataHash,
  issuanceDate: new Date().toISOString(),
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const result = await CryptoUtils.sign(vcInput, keyPair.privateKey);
console.log(result.signature);
```

### 4. Verify signature

```typescript
const isValid = CryptoUtils.verify(
  result.signedMessageHash,
  result.signature,
  keyPair.publicKey
);

console.log(isValid ? "Valid!" : "Invalid!");
```

## Common Use Cases

### Hash User Data

```typescript
const hash = CryptoUtils.hash("any string data");
```

### Run Tests

```typescript
const testResult = await CryptoUtils.runCryptoTest();
if (testResult.success) {
  console.log("All systems go! 🚀");
}
```

## That's it! 🎉

For more examples, see:

- [README.md](./README.md) - Full documentation
- [INTEGRATION.md](./INTEGRATION.md) - Frontend & Backend integration
- [src/example.ts](./src/example.ts) - Complete examples

---

**Need help?** Open an issue on [GitHub](https://github.com/Mrazakos/vc-ecdsa-crypto/issues)
