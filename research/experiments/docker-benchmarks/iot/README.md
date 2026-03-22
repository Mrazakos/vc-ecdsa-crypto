# IoT Docker Benchmarks

Tests Verifiable Credential operations on simulated IoT environment with characteristics of edge devices.

## Quick Start

### Run IoT Benchmarks

```powershell
.\run-iot-benchmark.ps1
```

### Options

```powershell
# Build image fresh and clean up after
.\run-iot-benchmark.ps1 -BuildImage -KeepContainers $false

# Skip building (use existing image)
.\run-iot-benchmark.ps1 -BuildImage $false

# Keep containers running for inspection
.\run-iot-benchmark.ps1 -KeepContainers
```

## What Gets Tested

IoT device constraints:

- Limited CPU (typically single-core or low-clock)
- Minimal RAM (128MB-512MB range)
- Slow I/O operations
- Network latency simulation
- Package loss simulation

Tested operations:

- ✓ Key generation on IoT device
- ✓ VC signing with constraints
- ✓ VC verification in edge setting
- ✓ Memory footprint
- ✓ Network efficiency
- ✓ Scalability with device count

## Environment Setup

### Prerequisites

- Docker Desktop installed
- 1.5GB free disk space
- Docker resources: 1GB RAM, 1-2 CPU cores

### First Run

```powershell
.\run-iot-benchmark.ps1
```

## Output

Results saved to `docker-emulation-benchmarks/iot-benchmark-results/`:

```
iot-benchmark-results/
├── performance-metrics.json
├── benchmark-report.md
├── network-analysis.json
├── scalability-results.json
└── logs/
    └── benchmark-run.log
```

## Files

| File                    | Purpose           |
| ----------------------- | ----------------- |
| `run-iot-benchmark.ps1` | Automation script |
| `README.md`             | This file         |

## Configuration

Edit `../../docker-emulation-benchmarks/docker-compose.yml` to modify:

- CPU limits
- Memory limits
- Network latency/loss
- Number of simulated devices
- Test duration

## Device Profiles Tested

### Profile: Raspberry Pi 3B+

- CPU: ARM Cortex-A53 (4 cores @ 1.4 GHz)
- RAM: 1GB
- Storage: microSD (limited I/O)

### Profile: Arduino MKR WiFi 1010

- CPU: ATSAMD21 (48 MHz)
- RAM: 32KB
- Requires specialized handling

### Profile: Generic Edge Gateway

- CPU: Low-power x86 (1-2 cores)
- RAM: 256MB-512MB
- Standard Linux environment

## Troubleshooting

### Container memory limits too strict

Increase in docker-compose.yml:

```yaml
services:
  iot-device:
    mem_limit: "512m" # Increase this
```

### Network simulation not working

Verify container networking:

```powershell
docker network ls
docker network inspect bridge
```

### Benchmark timeout

Increase timeout in docker-compose.yml:

```yaml
environment:
  TEST_TIMEOUT: "120000" # milliseconds
```

## See Also

- [Mobile Benchmarks](../mobile/) - Mobile device simulations
- [Docker Setup Guide](../../docker-emulation-benchmarks/DOCKER_BENCHMARK_GUIDE.md)
- [Comparison Tests](../../comparison-tests/) - Algorithm performance comparison
