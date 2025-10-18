/**
 * Example usage of vc-ecdsa-crypto library
 * This demonstrates all the main features
 */

import { CryptoUtils, VCSigningInput } from "./index";

async function main() {
  console.log("=".repeat(60));
  console.log("📚 VC-ECDSA-CRYPTO EXAMPLE");
  console.log("=".repeat(60));
  console.log();

  try {
    // Step 1: Generate Key Pair
    console.log("1️⃣  GENERATING KEY PAIR");
    console.log("-".repeat(60));
    const keyPair = await CryptoUtils.generateKeyPair();
    console.log("✅ Key pair generated successfully!");
    console.log(`   Public Key:  ${keyPair.publicKey.substring(0, 20)}...`);
    console.log(`   Private Key: ${keyPair.privateKey.substring(0, 20)}...`);
    console.log();

    // Step 2: Hash User Data
    console.log("2️⃣  HASHING USER DATA");
    console.log("-".repeat(60));
    const userData = {
      email: "alice@example.com",
      name: "Alice Johnson",
      age: 30,
    };
    const userMetaDataHash = CryptoUtils.hash(JSON.stringify(userData));
    console.log(`✅ User data hashed`);
    console.log(`   Hash: ${userMetaDataHash.substring(0, 30)}...`);
    console.log();

    // Step 3: Create VC Input
    console.log("3️⃣  CREATING VERIFIABLE CREDENTIAL INPUT");
    console.log("-".repeat(60));
    const vcInput: VCSigningInput = {
      userMetaDataHash: userMetaDataHash,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days from now
    };
    console.log("✅ VC Input created");
    console.log(`   Issuance: ${vcInput.issuanceDate}`);
    console.log(`   Expiration: ${vcInput.expirationDate}`);
    console.log();

    // Step 4: Sign the VC
    console.log("4️⃣  SIGNING VERIFIABLE CREDENTIAL");
    console.log("-".repeat(60));
    const signResult = await CryptoUtils.sign(vcInput, keyPair.privateKey);
    console.log("✅ VC signed successfully!");
    console.log(`   Signature: ${signResult.signature.substring(0, 30)}...`);
    console.log(
      `   Signed Hash: ${signResult.signedMessageHash.substring(0, 30)}...`
    );
    console.log();

    // Step 5: Verify the Signature
    console.log("5️⃣  VERIFYING SIGNATURE");
    console.log("-".repeat(60));
    const isValid = CryptoUtils.verify(
      signResult.signedMessageHash,
      signResult.signature,
      keyPair.publicKey
    );
    console.log(
      `${isValid ? "✅" : "❌"} Signature verification: ${
        isValid ? "PASSED" : "FAILED"
      }`
    );
    console.log();

    // Step 6: Test with Invalid Signature
    console.log("6️⃣  TESTING WITH INVALID SIGNATURE");
    console.log("-".repeat(60));
    const tamperedSignature = signResult.signature.replace("a", "b");
    const isInvalid = CryptoUtils.verify(
      signResult.signedMessageHash,
      tamperedSignature,
      keyPair.publicKey
    );
    console.log(
      `${
        !isInvalid ? "✅" : "❌"
      } Invalid signature correctly rejected: ${!isInvalid}`
    );
    console.log();

    // Step 7: Run Full Test Suite
    console.log("7️⃣  RUNNING FULL TEST SUITE");
    console.log("-".repeat(60));
    const testResult = await CryptoUtils.runCryptoTest();
    if (testResult.success) {
      console.log("✅ All tests passed!");
      testResult.results.forEach((result) => console.log(`   ${result}`));
    } else {
      console.error(`❌ Test failed: ${testResult.error}`);
    }
    console.log();

    console.log("=".repeat(60));
    console.log("🎉 EXAMPLE COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the example
main();
