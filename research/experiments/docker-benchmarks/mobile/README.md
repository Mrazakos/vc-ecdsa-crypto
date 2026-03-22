# Mobile Docker Benchmarks

Tests Verifiable Credential operations on simulated mobile environment with resource constraints.

## Quick Start

### Run Mobile Benchmarks

```powershell
.\run-mobile-benchmark.ps1
```

### Options

```powershell
# Build image fresh and clean up after
.\run-mobile-benchmark.ps1 -BuildImage -KeepContainers $false

# Skip building (use existing image)
.\run-mobile-benchmark.ps1 -BuildImage $false

# Keep containers running for inspection
.\run-mobile-benchmark.ps1 -KeepContainers
```

## What Gets Tested

Mobile device constraints:

- Limited CPU cores (simulated)
- Limited RAM (simulated)
- Network constraints (optional)
- Battery simulation (optional)

Tested operations:

- ✓ Key generation on mobile
- ✓ VC signing on low-power device
- ✓ VC verification on mobile
- ✓ Memory usage patterns
- ✓ Battery consumption modeling

## Environment Setup

### Prerequisites

- Docker Desktop installed
- 2GB free disk space
- Docker resources: 2GB RAM, 2 CPU cores

### First Run

```powershell
# Initialize Docker setup
.\run-mobile-benchmark.ps1
```

## Output

Results saved to `docker-emulation-benchmarks/mobile-benchmark-results/`:

```
mobile-benchmark-results/
├── performance-metrics.json
├── benchmark-report.md
├── resource-usage.json
└── logs/
    └── benchmark-run.log
```

## Files

| File                       | Purpose           |
| -------------------------- | ----------------- |
| `run-mobile-benchmark.ps1` | Automation script |
| `README.md`                | This file         |

## Configuration

Edit `../../docker-emulation-benchmarks/docker-compose.mobile.yml` to modify:

- CPU limits
- Memory limits
- Network simulation
- Test duration

## Troubleshooting

### Docker not found

```powershell
# Verify Docker installation
docker --version

# Restart Docker service
Restart-Service -Name com.docker.service
```

### Out of disk space

```powershell
# Clean up old images
docker system prune -a

# Check Docker disk usage
docker system df
```

### Container fails to start

Check logs:

```powershell
docker-compose -f ../../docker-emulation-benchmarks/docker-compose.mobile.yml logs
```

## See Also

- [IoT Benchmarks](../iot/) - IoT device simulations
- [Docker Setup Guide](../../docker-emulation-benchmarks/MOBILE_BENCHMARK_GUIDE.md)
