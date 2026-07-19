#!/usr/bin/env node

const { mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");
const os = require("os");
const { performance } = require("perf_hooks");

let cryptoLib;

try {
  cryptoLib = require("../dist");
} catch (error) {
  console.error("Build the project first with: npm run build");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const {
  ECDSACryptoService,
  PQCryptoService,
  FalconCryptoService,
  VCIssuer,
  VCVerifier,
} = cryptoLib;

const iterations = parsePositiveInteger(
  readArgValue("--iterations") ?? process.env.PI_BENCH_ITERATIONS,
  200,
);
const outputDir = readArgValue("--output-dir") ?? "comparison-results";

async function main() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      cpuCores: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      nodeVersion: process.version,
    },
    testConfig: {
      iterations,
    },
    algorithms: {
      ecdsa: createEmptyMetrics(
        "ECDSA secp256k1",
        "256-bit (32 bytes private, 65 bytes public)",
      ),
      dilithium2: createEmptyMetrics(
        "ML-DSA-44 (Dilithium2)",
        "1952 bytes public, 4000 bytes secret",
      ),
      falcon512: createEmptyMetrics(
        "Falcon-512",
        "897 bytes public, 1281 bytes secret",
      ),
    },
    summary: {
      fastest: { keyGen: "", signing: "", verification: "" },
      smallest: { keySize: "", signatureSize: "", credentialSize: "" },
    },
  };

  console.log("=".repeat(80));
  console.log("RASPBERRY PI BENCHMARK");
  console.log("=".repeat(80));
  console.log(`Iterations per test: ${iterations}`);
  console.log(`CPU: ${results.environment.cpuModel}`);
  console.log(
    `Platform: ${results.environment.platform} ${results.environment.release}`,
  );
  console.log(`Node: ${results.environment.nodeVersion}`);
  console.log();

  await benchmarkAlgorithm(
    new ECDSACryptoService(),
    results.algorithms.ecdsa,
    iterations,
  );
  await benchmarkAlgorithm(
    new PQCryptoService(),
    results.algorithms.dilithium2,
    iterations,
  );
  await benchmarkAlgorithm(
    new FalconCryptoService(),
    results.algorithms.falcon512,
    iterations,
  );

  results.summary.fastest.keyGen = getFastest([
    { name: "ECDSA", time: avg(results.algorithms.ecdsa.keyGenTime) },
    { name: "ML-DSA-44", time: avg(results.algorithms.dilithium2.keyGenTime) },
    { name: "Falcon-512", time: avg(results.algorithms.falcon512.keyGenTime) },
  ]);
  results.summary.fastest.signing = getFastest([
    { name: "ECDSA", time: avg(results.algorithms.ecdsa.signTime) },
    { name: "ML-DSA-44", time: avg(results.algorithms.dilithium2.signTime) },
    { name: "Falcon-512", time: avg(results.algorithms.falcon512.signTime) },
  ]);
  results.summary.fastest.verification = getFastest([
    { name: "ECDSA", time: avg(results.algorithms.ecdsa.verifyTime) },
    { name: "ML-DSA-44", time: avg(results.algorithms.dilithium2.verifyTime) },
    { name: "Falcon-512", time: avg(results.algorithms.falcon512.verifyTime) },
  ]);

  results.summary.smallest.keySize = "ECDSA";
  results.summary.smallest.signatureSize = getSmallestSignature([
    { name: "ECDSA", size: results.algorithms.ecdsa.signatureSize },
    { name: "ML-DSA-44", size: results.algorithms.dilithium2.signatureSize },
    { name: "Falcon-512", size: results.algorithms.falcon512.signatureSize },
  ]);
  results.summary.smallest.credentialSize = getSmallestCredential([
    { name: "ECDSA", size: avg(results.algorithms.ecdsa.credentialSize) },
    {
      name: "ML-DSA-44",
      size: avg(results.algorithms.dilithium2.credentialSize),
    },
    {
      name: "Falcon-512",
      size: avg(results.algorithms.falcon512.credentialSize),
    },
  ]);

  const report = generateMarkdownReport(results);
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const dir = join(process.cwd(), outputDir, `performance-${timestamp}`);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, "performance-report.md"), report);
  writeFileSync(join(dir, "raw-data.json"), JSON.stringify(results, null, 2));

  console.log();
  console.log("=".repeat(80));
  console.log("BENCHMARK COMPLETE");
  console.log("=".repeat(80));
  console.log(`Results: ${dir}`);
  console.log("Files: performance-report.md, raw-data.json");
}

async function benchmarkAlgorithm(crypto, metrics, iterationCount) {
  const issuer = new VCIssuer(crypto);
  const verifier = new VCVerifier(crypto);

  const keyGenTimes = [];
  for (let index = 0; index < iterationCount; index += 1) {
    const start = performance.now();
    await crypto.generateIdentity();
    keyGenTimes.push(performance.now() - start);
  }
  metrics.keyGenTime = keyGenTimes;

  const identity = await crypto.generateIdentity();
  const issueTimes = [];
  let vc;
  for (let index = 0; index < iterationCount; index += 1) {
    const start = performance.now();
    vc = await issuer.issueCredential(
      { id: "did:example:issuer123", name: "Pi Benchmark Issuer" },
      {
        id: "did:example:user456",
        name: "Benchmark Subject",
        accessLevel: "premium",
      },
      identity.privateKey,
      identity.publicKey,
      { validityDays: 30 },
    );
    issueTimes.push(performance.now() - start);
  }
  metrics.signTime = issueTimes;

  const proof = Array.isArray(vc.proof) ? vc.proof[0] : vc.proof;
  metrics.signatureSize = proof.proofValue.length;
  metrics.credentialSize = [JSON.stringify(vc).length];

  const verifyTimes = [];
  for (let index = 0; index < iterationCount; index += 1) {
    const start = performance.now();
    await verifier.verifyCredential(vc, identity.publicKey, {
      checkExpiration: true,
    });
    verifyTimes.push(performance.now() - start);
  }
  metrics.verifyTime = verifyTimes;

  console.log(`${metrics.name}`);
  console.log(`  Key generation: ${avg(keyGenTimes).toFixed(3)}ms avg`);
  console.log(`  Signing:        ${avg(issueTimes).toFixed(3)}ms avg`);
  console.log(`  Verification:   ${avg(verifyTimes).toFixed(3)}ms avg`);
  console.log(`  Signature size: ${metrics.signatureSize} bytes`);
  console.log(`  Credential size:${JSON.stringify(vc).length} bytes`);
  console.log();
}

function createEmptyMetrics(name, keySize) {
  return {
    name,
    keySize,
    signatureSize: 0,
    keyGenTime: [],
    signTime: [],
    verifyTime: [],
    credentialSize: [],
  };
}

function generateMarkdownReport(results) {
  const { algorithms, summary, environment, testConfig } = results;

  return `# Raspberry Pi Performance Benchmark

**Date:** ${new Date(results.timestamp).toLocaleString()}  
**Iterations:** ${testConfig.iterations} per operation

## Environment

- Platform: ${environment.platform} ${environment.release}
- Architecture: ${environment.arch}
- CPU: ${environment.cpuModel}
- Cores: ${environment.cpuCores}
- Memory: ${(environment.totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
- Node.js: ${environment.nodeVersion}

## Summary

- Fastest key generation: ${summary.fastest.keyGen}
- Fastest signing: ${summary.fastest.signing}
- Fastest verification: ${summary.fastest.verification}
- Smallest key size: ${summary.smallest.keySize}
- Smallest signature size: ${summary.smallest.signatureSize}
- Smallest credential size: ${summary.smallest.credentialSize}

## Results

| Algorithm | Key Gen Avg (ms) | Sign Avg (ms) | Verify Avg (ms) | Signature Size (bytes) | Credential Size (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| ${algorithms.ecdsa.name} | ${avg(algorithms.ecdsa.keyGenTime).toFixed(3)} | ${avg(algorithms.ecdsa.signTime).toFixed(3)} | ${avg(algorithms.ecdsa.verifyTime).toFixed(3)} | ${algorithms.ecdsa.signatureSize} | ${Math.round(avg(algorithms.ecdsa.credentialSize))} |
| ${algorithms.dilithium2.name} | ${avg(algorithms.dilithium2.keyGenTime).toFixed(3)} | ${avg(algorithms.dilithium2.signTime).toFixed(3)} | ${avg(algorithms.dilithium2.verifyTime).toFixed(3)} | ${algorithms.dilithium2.signatureSize} | ${Math.round(avg(algorithms.dilithium2.credentialSize))} |
| ${algorithms.falcon512.name} | ${avg(algorithms.falcon512.keyGenTime).toFixed(3)} | ${avg(algorithms.falcon512.signTime).toFixed(3)} | ${avg(algorithms.falcon512.verifyTime).toFixed(3)} | ${algorithms.falcon512.signatureSize} | ${Math.round(avg(algorithms.falcon512.credentialSize))} |

## Pi 3 Notes

- ECDSA should be the practical baseline on a Pi 3.
- RSA-2048 is usable but usually slower.
- ML-DSA-44 is the current NIST PQ benchmark path.
- Falcon-512 is the heaviest path and may be significantly slower on this hardware.
`;
}

function avg(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getFastest(items) {
  return items.reduce((fastest, current) =>
    current.time < fastest.time ? current : fastest,
  ).name;
}

function getSmallestSignature(items) {
  return items.reduce((smallest, current) =>
    current.size < smallest.size ? current : smallest,
  ).name;
}

function getSmallestCredential(items) {
  return items.reduce((smallest, current) =>
    current.size < smallest.size ? current : smallest,
  ).name;
}

function readArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

main().catch((error) => {
  console.error("Pi benchmark failed:", error);
  process.exit(1);
});
