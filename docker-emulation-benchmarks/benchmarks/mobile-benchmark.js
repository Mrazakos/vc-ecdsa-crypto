/**
 * Mobile Runtime Cryptographic Performance Benchmark
 * Simulates Android/iOS mobile app environment
 *
 * Focus: Key Generation and Signing Operations
 * - These are the primary crypto operations mobile wallets perform
 * - Key generation: Create new wallet/identity
 * - Signing: Authenticate user, sign transactions, issue credentials
 *
 * Scenarios:
 * 1. Mobile Wallet: User creates new digital identity
 * 2. Access Control: User signs credential request
 * 3. Authentication: User proves ownership of credentials
 */

const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

// Import crypto services
const { ECDSACryptoService, PQCryptoService, VCIssuer } = require("../dist");

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEVICE_TIER = process.env.DEVICE_TIER || "mid-range";
const CONFIG = {
  iterations: parseInt(process.env.BENCHMARK_ITERATIONS) || 200,
  warmupIterations: 10,
  algorithms: ["ECDSA", "ML-DSA-44"],
  outputDir: "./mobile-benchmark-results",
  outputFile: `mobile-results-${DEVICE_TIER}.json`,
  outputMarkdown: `mobile-report-${DEVICE_TIER}.md`,
  deviceTier: DEVICE_TIER,
};

const ALGORITHMS = {
  ECDSA: {
    name: "ECDSA secp256k1",
    description: "Standard for mobile wallets (Bitcoin, Ethereum)",
    createService: () => new ECDSACryptoService(),
  },
  "ML-DSA-44": {
    name: "ML-DSA-44 (Dilithium2)",
    description: "Post-Quantum signature scheme",
    createService: () => new PQCryptoService(),
  },
};

// ============================================================================
// MOBILE-SPECIFIC SCENARIOS
// ============================================================================

/**
 * Scenario 1: Mobile Wallet - New Identity Creation
 * User opens wallet app for first time and generates cryptographic identity
 */
async function testMobileWalletCreation(cryptoService, algorithmName) {
  const times = [];
  const memoryUsage = [];

  console.log(`\n📱 [Mobile Wallet] ${algorithmName} Identity Creation...`);

  for (let i = 0; i < CONFIG.iterations; i++) {
    if (global.gc) global.gc();

    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();

    await cryptoService.generateIdentity();

    const end = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    times.push(end - start);
    memoryUsage.push(memAfter - memBefore);
  }

  const avgTime = avg(times);
  const avgMem = avg(memoryUsage);

  console.log(
    `   ⏱️  Time: ${avgTime.toFixed(2)}ms (${min(times).toFixed(2)}ms - ${max(times).toFixed(2)}ms)`,
  );
  console.log(`   💾 Memory: ${(avgMem / 1024).toFixed(2)} KB`);

  return { times, memoryUsage };
}

/**
 * Scenario 2: Credential Request Signing
 * User requests access credential (e.g., building access, event ticket)
 * Mobile app signs the credential issuance request
 */
async function testCredentialSigning(cryptoService, algorithmName) {
  const issuer = new VCIssuer(cryptoService);
  const identity = await cryptoService.generateIdentity();
  const times = [];
  const memoryUsage = [];

  console.log(`\n✍️  [Mobile App] ${algorithmName} Credential Signing...`);

  for (let i = 0; i < CONFIG.iterations; i++) {
    if (global.gc) global.gc();

    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();

    // Realistic mobile credential: User requests building access
    await issuer.issueCredential(
      { id: "did:mobile:user" + i, name: "Mobile User" },
      {
        id: "did:building:secure-facility",
        name: "Corporate Building Access",
        accessLevel: "employee",
        validFrom: new Date().toISOString(),
      },
      identity.privateKey,
      identity.publicKey,
      {
        credentialTypes: ["AccessCredential", "MobileWalletCredential"],
        validityDays: 7, // Weekly access badge
      },
    );

    const end = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    times.push(end - start);
    memoryUsage.push(memAfter - memBefore);
  }

  const avgTime = avg(times);
  const avgMem = avg(memoryUsage);

  console.log(
    `   ⏱️  Time: ${avgTime.toFixed(2)}ms (${min(times).toFixed(2)}ms - ${max(times).toFixed(2)}ms)`,
  );
  console.log(`   💾 Memory: ${(avgMem / 1024).toFixed(2)} KB`);

  return { times, memoryUsage };
}

/**
 * Scenario 3: Rapid Sequential Signing
 * Simulates user signing multiple items in quick succession
 * (e.g., multi-sig wallet, batch transactions)
 */
async function testRapidSigning(cryptoService, algorithmName) {
  const issuer = new VCIssuer(cryptoService);
  const identity = await cryptoService.generateIdentity();
  const batchSize = 10;
  const batchTimes = [];

  console.log(
    `\n⚡ [Batch Operations] ${algorithmName} Rapid Signing (${batchSize} signatures)...`,
  );

  for (
    let batch = 0;
    batch < Math.floor(CONFIG.iterations / batchSize);
    batch++
  ) {
    if (global.gc) global.gc();

    const start = performance.now();

    // Sign multiple credentials rapidly
    const promises = [];
    for (let i = 0; i < batchSize; i++) {
      promises.push(
        issuer.issueCredential(
          { id: "did:user:batch" + batch + i },
          { id: "did:service:api", operation: "transaction" + i },
          identity.privateKey,
          identity.publicKey,
          { validityDays: 1 },
        ),
      );
    }

    await Promise.all(promises);
    const end = performance.now();

    batchTimes.push(end - start);
  }

  const avgBatchTime = avg(batchTimes);
  const avgPerSignature = avgBatchTime / batchSize;

  console.log(
    `   ⏱️  Batch Time: ${avgBatchTime.toFixed(2)}ms for ${batchSize} signatures`,
  );
  console.log(`   ⏱️  Per Signature: ${avgPerSignature.toFixed(2)}ms`);

  return { batchTimes, avgPerSignature };
}

/**
 * Analyze practical mobile implications
 */
async function analyzeMobileImplications(cryptoService, algorithmName) {
  const identity = await cryptoService.generateIdentity();
  const issuer = new VCIssuer(cryptoService);

  const vc = await issuer.issueCredential(
    { id: "did:example:issuer" },
    { id: "did:example:holder" },
    identity.privateKey,
    identity.publicKey,
  );

  const proof = Array.isArray(vc.proof) ? vc.proof[0] : vc.proof;
  const signatureSize = proof.proofValue.length;
  const credentialSize = JSON.stringify(vc).length;
  const publicKeySize = identity.publicKey.length;
  const privateKeySize = identity.privateKey.length;

  console.log(`\n📊 [Mobile Impact] ${algorithmName}:`);
  console.log(
    `   🔑 Private Key: ${privateKeySize} bytes (${(privateKeySize / 1024).toFixed(2)} KB)`,
  );
  console.log(`   🔓 Public Key: ${publicKeySize} bytes`);
  console.log(`   ✍️  Signature: ${signatureSize} bytes`);
  console.log(
    `   📄 Full Credential: ${credentialSize} bytes (${(credentialSize / 1024).toFixed(2)} KB)`,
  );

  // Mobile network implications
  const nfcTransferTime = (credentialSize / 424000) * 1000; // NFC at 424 kbps
  const bluetoothTransferTime = (credentialSize / 2000000) * 1000; // BLE at ~2 Mbps
  const qrCodeCapacity = 2953; // Max bytes in QR code (version 40, Low EC)
  const fitsInQR = credentialSize <= qrCodeCapacity;

  console.log(`\n📡 [Transfer Analysis]:`);
  console.log(`   NFC Transfer (~424 kbps): ${nfcTransferTime.toFixed(2)}ms`);
  console.log(
    `   Bluetooth LE (~2 Mbps): ${bluetoothTransferTime.toFixed(2)}ms`,
  );
  console.log(
    `   QR Code: ${fitsInQR ? "✅ Fits" : "❌ Too large"} (max ${qrCodeCapacity} bytes)`,
  );

  return {
    publicKeySize,
    privateKeySize,
    signatureSize,
    credentialSize,
    nfcTransferTime,
    bluetoothTransferTime,
    fitsInQR,
  };
}

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function min(arr) {
  return Math.min(...arr);
}

function max(arr) {
  return Math.max(...arr);
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr) {
  const mean = avg(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - mean, 2));
  return Math.sqrt(avg(squareDiffs));
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, index)];
}

// ============================================================================
// MAIN BENCHMARK EXECUTION
// ============================================================================

async function runMobileBenchmark() {
  console.log(
    "╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     Mobile Runtime Cryptographic Performance Benchmark        ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝",
  );
  console.log(`\n📱 Device Tier: ${CONFIG.deviceTier.toUpperCase()}`);
  console.log(`🔄 Iterations: ${CONFIG.iterations}`);
  console.log(`⚙️  Node.js: ${process.version}`);
  console.log(`💻 Platform: ${process.platform} ${process.arch}`);
  console.log(`🧠 Memory Limit: ${process.env.NODE_OPTIONS || "default"}\n`);

  const results = {};

  for (const algoKey of CONFIG.algorithms) {
    const algo = ALGORITHMS[algoKey];
    console.log(`\n${"=".repeat(70)}`);
    console.log(`🔐 ${algo.name}`);
    console.log(`   ${algo.description}`);
    console.log("=".repeat(70));

    const cryptoService = algo.createService();

    // Warmup
    console.log(
      `\n🔥 Warming up JIT compiler (${CONFIG.warmupIterations} iterations)...`,
    );
    for (let i = 0; i < CONFIG.warmupIterations; i++) {
      await cryptoService.generateIdentity();
    }

    // Run mobile-specific tests
    const walletCreation = await testMobileWalletCreation(
      cryptoService,
      algoKey,
    );
    const credentialSigning = await testCredentialSigning(
      cryptoService,
      algoKey,
    );
    const rapidSigning = await testRapidSigning(cryptoService, algoKey);
    const mobileImplications = await analyzeMobileImplications(
      cryptoService,
      algoKey,
    );

    results[algoKey] = {
      algorithm: algo.name,
      description: algo.description,
      walletCreation: {
        avgTime: avg(walletCreation.times),
        minTime: min(walletCreation.times),
        maxTime: max(walletCreation.times),
        medianTime: median(walletCreation.times),
        stdDev: stdDev(walletCreation.times),
        p95: percentile(walletCreation.times, 0.95),
        p99: percentile(walletCreation.times, 0.99),
        avgMemory: avg(walletCreation.memoryUsage),
      },
      credentialSigning: {
        avgTime: avg(credentialSigning.times),
        minTime: min(credentialSigning.times),
        maxTime: max(credentialSigning.times),
        medianTime: median(credentialSigning.times),
        stdDev: stdDev(credentialSigning.times),
        p95: percentile(credentialSigning.times, 0.95),
        p99: percentile(credentialSigning.times, 0.99),
        avgMemory: avg(credentialSigning.memoryUsage),
      },
      rapidSigning: {
        avgBatchTime: avg(rapidSigning.batchTimes),
        avgPerSignature: rapidSigning.avgPerSignature,
      },
      sizes: mobileImplications,
    };
  }

  // Save results
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        deviceTier: CONFIG.deviceTier,
        timestamp: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
  );

  console.log(`\n✅ Results saved to: ${outputPath}`);

  // Generate summary comparison
  generateComparisonSummary(results);
}

function generateComparisonSummary(results) {
  console.log(`\n\n${"=".repeat(70)}`);
  console.log("📊 MOBILE PERFORMANCE SUMMARY");
  console.log("=".repeat(70));

  const ecdsa = results["ECDSA"];
  const mldsa = results["ML-DSA-44"];

  console.log(`\n🔑 Wallet Creation (Identity Generation):`);
  console.log(
    `   ECDSA:     ${ecdsa.walletCreation.avgTime.toFixed(2)}ms (median: ${ecdsa.walletCreation.medianTime.toFixed(2)}ms)`,
  );
  console.log(
    `   ML-DSA-44: ${mldsa.walletCreation.avgTime.toFixed(2)}ms (median: ${mldsa.walletCreation.medianTime.toFixed(2)}ms)`,
  );
  console.log(
    `   Speedup:   ${(mldsa.walletCreation.avgTime / ecdsa.walletCreation.avgTime).toFixed(2)}x faster with ECDSA`,
  );

  console.log(`\n✍️  Credential Signing:`);
  console.log(
    `   ECDSA:     ${ecdsa.credentialSigning.avgTime.toFixed(2)}ms (P95: ${ecdsa.credentialSigning.p95.toFixed(2)}ms)`,
  );
  console.log(
    `   ML-DSA-44: ${mldsa.credentialSigning.avgTime.toFixed(2)}ms (P95: ${mldsa.credentialSigning.p95.toFixed(2)}ms)`,
  );
  console.log(
    `   Speedup:   ${(mldsa.credentialSigning.avgTime / ecdsa.credentialSigning.avgTime).toFixed(2)}x faster with ECDSA`,
  );

  console.log(`\n⚡ Rapid Signing (10 signatures):`);
  console.log(
    `   ECDSA:     ${ecdsa.rapidSigning.avgBatchTime.toFixed(2)}ms batch`,
  );
  console.log(
    `   ML-DSA-44: ${mldsa.rapidSigning.avgBatchTime.toFixed(2)}ms batch`,
  );

  console.log(`\n📦 Data Sizes:`);
  console.log(
    `   Credential Size - ECDSA:     ${ecdsa.sizes.credentialSize} bytes`,
  );
  console.log(
    `   Credential Size - ML-DSA-44: ${mldsa.sizes.credentialSize} bytes`,
  );
  console.log(
    `   Overhead: ${((mldsa.sizes.credentialSize / ecdsa.sizes.credentialSize - 1) * 100).toFixed(1)}% larger with ML-DSA-44`,
  );

  console.log(`\n📱 Mobile UX Impact:`);
  const ecdsaUXAcceptable = ecdsa.credentialSigning.p95 < 100; // <100ms is imperceptible
  const mldsaUXAcceptable = mldsa.credentialSigning.p95 < 100;
  console.log(
    `   ECDSA P95 latency:    ${ecdsaUXAcceptable ? "✅ Imperceptible (<100ms)" : "⚠️  Noticeable"}`,
  );
  console.log(
    `   ML-DSA-44 P95 latency: ${mldsaUXAcceptable ? "✅ Imperceptible (<100ms)" : "⚠️  Noticeable"}`,
  );

  console.log(`\n${"=".repeat(70)}\n`);
}

// Run the benchmark
runMobileBenchmark().catch((error) => {
  console.error("❌ Benchmark failed:", error);
  process.exit(1);
});
