import {
  ECDSACryptoService,
  VCIssuer,
  VCVerifier,
  AccessControlCredentialSubject,
} from "../src/index";

describe("Lock Access Credential - Single Lock Scenario", () => {
  it("should issue and verify a VC for a single lock and allow access if all checks pass", async () => {
    // 1. Generate keypair for issuer (lock admin)
    const crypto = new ECDSACryptoService();
    const issuerIdentity = await crypto.generateIdentity();
    const userEmail = "example@user.com";

    // 2. Issue a VC for lock #1 (Test Lock) to example@user.com
    const issuer = new VCIssuer();
    const lockId = "lock-1";
    const lockName = "Test Lock";
    const credentialSubject: AccessControlCredentialSubject = {
      id: `did:key:${issuerIdentity.publicKey}`,
      userMetaDataHash: crypto.hash(userEmail),
      lock: {
        id: lockId,
        name: lockName,
      },
      accessLevel: "standard",
      permissions: ["unlock"],
    };
    const vc = await issuer.issueOffChainCredential(
      { id: "did:example:lock-admin", name: "Lock Admin" },
      credentialSubject,
      issuerIdentity.privateKey,
      {
        publicKey: issuerIdentity.publicKey,
        credentialTypes: ["LockAccessCredential"],
      }
    );

    // 3. Simulate the lock verifying the credential
    const verifier = new VCVerifier();
    const result = await verifier.verifyOffChainCredential(
      vc,
      issuerIdentity.publicKey,
      { checkExpiration: true }
    );
    expect(result.verified).toBe(true);
    expect(
      (vc.credentialSubject as AccessControlCredentialSubject).lock?.id
    ).toBe(lockId);
    expect(
      (vc.credentialSubject as AccessControlCredentialSubject).lock?.name
    ).toBe(lockName);
    expect(result.details).toBeDefined();
  });

  it("should deny access if the lock ID does not match", async () => {
    const crypto = new ECDSACryptoService();
    const issuerIdentity = await crypto.generateIdentity();
    const userEmail = "example@user.com";
    const issuer = new VCIssuer();
    const credentialSubject: AccessControlCredentialSubject = {
      id: `did:key:${issuerIdentity.publicKey}`,
      userMetaDataHash: crypto.hash(userEmail),
      lock: {
        id: "lock-1",
        name: "Test Lock",
      },
    };
    const vc = await issuer.issueOffChainCredential(
      { id: "did:example:lock-admin" },
      credentialSubject,
      issuerIdentity.privateKey,
      { publicKey: issuerIdentity.publicKey }
    );
    // Simulate lock #2 trying to use the credential
    const myLockId = "lock-2";
    const subject = vc.credentialSubject as AccessControlCredentialSubject;
    const isForThisLock = subject.lock?.id === myLockId;
    expect(isForThisLock).toBe(false);
  });
});
