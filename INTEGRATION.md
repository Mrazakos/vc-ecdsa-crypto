# Integration Guide

This guide shows how to use `@mrazakos/vc-ecdsa-crypto` in both frontend and backend applications.

## 📱 Frontend Integration

### React / Next.js

```typescript
import {
  CryptoUtils,
  type KeyPair,
  type VCSigningInput,
} from "@mrazakos/vc-ecdsa-crypto";
import { useState } from "react";

function VerifiableCredentialComponent() {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [signature, setSignature] = useState<string>("");

  const generateKeys = async () => {
    const keys = await CryptoUtils.generateKeyPair();
    setKeyPair(keys);
    // Store private key securely (e.g., encrypted in localStorage)
  };

  const signCredential = async () => {
    if (!keyPair) return;

    const userData = { email: "user@example.com", name: "User" };
    const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));

    const vcInput: VCSigningInput = {
      userMetaDataHash,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
    };

    const result = await CryptoUtils.sign(vcInput, keyPair.privateKey);
    setSignature(result.signature);
  };

  return (
    <div>
      <button onClick={generateKeys}>Generate Keys</button>
      <button onClick={signCredential}>Sign Credential</button>
      {signature && <p>Signature: {signature.substring(0, 30)}...</p>}
    </div>
  );
}
```

### Vue.js

```typescript
import { ref } from "vue";
import { CryptoUtils, type KeyPair } from "@mrazakos/vc-ecdsa-crypto";

export default {
  setup() {
    const keyPair = ref<KeyPair | null>(null);

    const generateKeys = async () => {
      keyPair.value = await CryptoUtils.generateKeyPair();
    };

    return { keyPair, generateKeys };
  },
};
```

### Angular

```typescript
import { Component } from "@angular/core";
import { CryptoUtils, KeyPair } from "@mrazakos/vc-ecdsa-crypto";

@Component({
  selector: "app-crypto",
  template: `
    <button (click)="generateKeys()">Generate Keys</button>
    <div *ngIf="keyPair">
      <p>Public Key: {{ keyPair.publicKey }}</p>
    </div>
  `,
})
export class CryptoComponent {
  keyPair: KeyPair | null = null;

  async generateKeys() {
    this.keyPair = await CryptoUtils.generateKeyPair();
  }
}
```

### Mobile (React Native)

```typescript
import { CryptoUtils } from "@mrazakos/vc-ecdsa-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Works perfectly on mobile - 100-1000x faster than RSA!
export class MobileCryptoService {
  static async generateAndStoreKeys() {
    const keyPair = await CryptoUtils.generateKeyPair();

    // Store encrypted keys
    await AsyncStorage.setItem("publicKey", keyPair.publicKey);
    // Use secure storage for private key in production

    return keyPair;
  }

  static async signCredential(privateKey: string, userData: any) {
    const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));

    return await CryptoUtils.sign(
      {
        userMetaDataHash,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      privateKey
    );
  }
}
```

## 🖥️ Backend Integration

### Node.js / Express

```typescript
import express from "express";
import { CryptoUtils, type VCSigningInput } from "@mrazakos/vc-ecdsa-crypto";

const app = express();
app.use(express.json());

// Store issuer keys securely (e.g., in environment variables or key management service)
const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY!;
const ISSUER_PUBLIC_KEY = process.env.ISSUER_PUBLIC_KEY!;

// Issue a Verifiable Credential
app.post("/api/credentials/issue", async (req, res) => {
  try {
    const { userData } = req.body;

    // Hash user data for privacy
    const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));

    const vcInput: VCSigningInput = {
      userMetaDataHash,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    // Sign the credential
    const signResult = await CryptoUtils.sign(vcInput, ISSUER_PRIVATE_KEY);

    res.json({
      credential: {
        ...vcInput,
        signature: signResult.signature,
        signedMessageHash: signResult.signedMessageHash,
        issuerPublicKey: ISSUER_PUBLIC_KEY,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to issue credential" });
  }
});

// Verify a Verifiable Credential
app.post("/api/credentials/verify", async (req, res) => {
  try {
    const { signedMessageHash, signature, publicKey } = req.body;

    const isValid = CryptoUtils.verify(signedMessageHash, signature, publicKey);

    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
});

app.listen(3000);
```

### NestJS

```typescript
import { Injectable } from "@nestjs/common";
import { CryptoUtils, VCSigningInput } from "@mrazakos/vc-ecdsa-crypto";

@Injectable()
export class CredentialService {
  private readonly issuerPrivateKey = process.env.ISSUER_PRIVATE_KEY!;
  private readonly issuerPublicKey = process.env.ISSUER_PUBLIC_KEY!;

  async issueCredential(userData: any) {
    const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));

    const vcInput: VCSigningInput = {
      userMetaDataHash,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    return await CryptoUtils.sign(vcInput, this.issuerPrivateKey);
  }

  verifyCredential(signedMessageHash: string, signature: string): boolean {
    return CryptoUtils.verify(
      signedMessageHash,
      signature,
      this.issuerPublicKey
    );
  }
}
```

### Serverless (AWS Lambda / Vercel)

```typescript
import { CryptoUtils } from "@mrazakos/vc-ecdsa-crypto";

// Vercel API Route
export default async function handler(req, res) {
  if (req.method === "POST") {
    const { userData } = req.body;

    const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));

    const vcInput = {
      userMetaDataHash,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
    };

    const result = await CryptoUtils.sign(vcInput, process.env.PRIVATE_KEY);

    res.status(200).json({ signature: result.signature });
  }
}
```

## 🔒 Security Best Practices

### Private Key Management

```typescript
// ❌ NEVER do this in production
const privateKey = "0x1234..."; // Hardcoded

// ✅ Use environment variables
const privateKey = process.env.PRIVATE_KEY;

// ✅ Use a key management service (AWS KMS, Azure Key Vault, etc.)
import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

async function getPrivateKey() {
  const kms = new KMSClient({ region: "us-east-1" });
  const command = new DecryptCommand({ CiphertextBlob: encryptedKey });
  const response = await kms.send(command);
  return response.Plaintext.toString();
}

// ✅ Frontend: Use secure storage
// React Native: react-native-keychain
// Web: Don't store private keys in localStorage - use server-side signing
```

### Frontend Security

```typescript
// For frontend applications, consider this flow:

// 1. User generates keys on their device
const userKeyPair = await CryptoUtils.generateKeyPair();

// 2. Store public key on server, keep private key on device
await fetch("/api/users/register", {
  method: "POST",
  body: JSON.stringify({ publicKey: userKeyPair.publicKey }),
});

// 3. User signs locally
const signature = await CryptoUtils.sign(vcInput, userKeyPair.privateKey);

// 4. Server verifies with stored public key
const isValid = CryptoUtils.verify(hash, signature, storedPublicKey);
```

## 🔄 Common Patterns

### Key Rotation

```typescript
class KeyManager {
  private keys: Map<string, KeyPair> = new Map();

  async rotateKeys(userId: string) {
    const newKeyPair = await CryptoUtils.generateKeyPair();
    const oldKeyPair = this.keys.get(userId);

    // Store both keys temporarily for migration
    this.keys.set(userId, newKeyPair);
    this.keys.set(`${userId}_old`, oldKeyPair!);

    return newKeyPair;
  }
}
```

### Batch Verification

```typescript
async function verifyMultipleCredentials(credentials: Array<any>) {
  const results = await Promise.all(
    credentials.map((cred) =>
      CryptoUtils.verify(cred.hash, cred.signature, cred.publicKey)
    )
  );

  return results.every((result) => result === true);
}
```

### Credential Revocation

```typescript
interface RevocationList {
  revokedHashes: Set<string>;
}

function isCredentialRevoked(
  signedHash: string,
  revocationList: RevocationList
): boolean {
  return revocationList.revokedHashes.has(signedHash);
}

function verifyAndCheckRevocation(
  hash: string,
  signature: string,
  publicKey: string,
  revocationList: RevocationList
): boolean {
  const isValidSignature = CryptoUtils.verify(hash, signature, publicKey);
  const isNotRevoked = !isCredentialRevoked(hash, revocationList);

  return isValidSignature && isNotRevoked;
}
```

## 📦 Publishing Your Module

Once you're ready to share your module:

```bash
# 1. Build the project
npm run build

# 2. Test locally
npm test

# 3. Login to npm
npm login

# 4. Publish (public)
npm publish --access public

# 5. Or publish scoped package
npm publish
```

## 🔧 Troubleshooting

### Issue: Module not found in browser

Make sure your bundler (webpack, vite, etc.) is configured to handle node modules:

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    include: ["@mrazakos/vc-ecdsa-crypto"],
  },
};
```

### Issue: TypeScript errors

Ensure you have the type definitions:

```bash
npm install --save-dev @types/node
```

### Issue: Performance in browser

The library is already optimized, but ensure you're not blocking the main thread:

```typescript
// Use Web Workers for heavy operations
const worker = new Worker("crypto-worker.js");
worker.postMessage({ action: "generateKey" });
```
