# VC-ECDSA-Crypto Research

Automated research workflow for cryptographic algorithm comparison thesis.

## 🎯 Overview

This research directory contains all experiments, analyses, and results for comparing ECDSA, RSA-PSS, and ML-DSA-65 cryptographic algorithms in the context of W3C Verifiable Credentials.

### Algorithms Compared

- **ECDSA (secp256k1)** - Fast, modern elliptic curve (baseline)
- **RSA-PSS** - Classical industry standard (2048-bit)
- **ML-DSA-65** - NIST post-quantum lattice-based

### Thesis Focus

- Performance comparison across different computational loads
- Security analysis and attack resistance
- Real-world testing on mobile and IoT devices
- Statistical validation of differences

---

## 📊 Three Experiments

### 1. Comparison Tests

**Performance and security analysis of algorithms**

```powershell
cd experiments\comparison-tests
.\run-comparison.ps1
```

Measures:

- Key generation time
- Credential signing time
- Credential verification time
- Signature & credential sizes
- Security under attack

📍 Details: [experiments/comparison-tests/README.md](experiments/comparison-tests/README.md)

---

### 2. Mobile Docker Benchmarks

**Test operations on simulated mobile devices**

```powershell
cd experiments\docker-benchmarks\mobile
.\run-mobile-benchmark.ps1
```

Simulates:

- Limited CPU (modern smartphone)
- Limited RAM
- Network constraints
- Real-world mobile operations

📍 Details: [experiments/docker-benchmarks/mobile/README.md](experiments/docker-benchmarks/mobile/README.md)

---

### 3. IoT Docker Benchmarks

**Test operations on simulated IoT edge devices**

```powershell
cd experiments\docker-benchmarks\iot
.\run-iot-benchmark.ps1
```

Simulates:

- Constrained CPU (ARM single-core)
- Minimal RAM (128-512MB)
- Slow I/O operations
- IoT scalability patterns

📍 Details: [experiments/docker-benchmarks/iot/README.md](experiments/docker-benchmarks/iot/README.md)

### 4. Raspberry Pi 3 Benchmark

**Run the benchmark directly on a Raspberry Pi 3**

```powershell
npm run benchmark:pi -- --iterations 10
```

Use this when you want native on-device numbers instead of a Docker emulation profile.

Measures:

- Key generation time
- Credential signing time
- Credential verification time
- Signature and credential sizes
- Environment metadata for the Pi run

Results are written to `comparison-results/pi-benchmark-results/`.

---

## 📈 Statistical Analysis

### ANOVA Analysis

**Robust statistical testing of performance differences**

```powershell
cd analysis\anova
.\run-anova.ps1
```

Performs:

- Assumption testing (normality, homogeneity)
- Welch's ANOVA (unequal variances)
- Kruskal-Wallis (non-parametric)
- Post-hoc pairwise comparisons
- Effect size calculations
- Statistical visualization

📍 Details: [analysis/anova/README.md](analysis/anova/README.md)

---

## 🚀 Quick Start (All Experiments)

### Option A: Using npm scripts (from repo root)

```powershell
# Run all research experiments sequentially
npm run research:all

# Run individual experiments
npm run research:comparison
npm run research:docker:mobile
npm run research:docker:iot
npm run research:anova
```

### Option B: Manual workflow

```powershell
# 1. Run comparison tests
cd experiments\comparison-tests
.\run-comparison.ps1

# 2. Run mobile benchmarks
cd ..\docker-benchmarks\mobile
.\run-mobile-benchmark.ps1

# 3. Run IoT benchmarks
cd ..\iot
.\run-iot-benchmark.ps1

# 4. Analyze results with ANOVA
cd ..\..\analysis\anova
.\run-anova.ps1
```

---

## 📁 Directory Structure

```
research/
├── experiments/                    ← Run these experiments
│   ├── comparison-tests/           # Algorithm comparison
│   │   ├── run-comparison.ps1
│   │   ├── config.json
│   │   └── README.md
│   └── docker-benchmarks/          # Device simulations
│       ├── mobile/
│       │   ├── run-mobile-benchmark.ps1
│       │   └── README.md
│       └── iot/
│           ├── run-iot-benchmark.ps1
│           └── README.md
│
├── analysis/                       ← Learn from results
│   └── anova/                      # Statistical analysis
│       ├── run-anova.ps1
│       ├── config.json
│       └── README.md
│
├── data/                           ← Organized results
│   ├── performance-results/        # Comparison test results
│   └── docker-results/             # Mobile & IoT results
│
└── README.md                       ← You are here
```

---

## 💾 Data & Results

### Results Organization

All results are automatically organized by timestamp:

```
../comparison-results/
├── performance-2026-03-22T10-30-45.123Z/
│   ├── performance-report.md
│   ├── raw-data.json
│   └── comparison-tables.json
└── security-2026-03-22T10-30-45.123Z/
    ├── security-report.md
    └── security-results.json

../docker-emulation-benchmarks/
├── mobile-benchmark-results/
│   ├── benchmark-report.md
│   └── performance-metrics.json
└── iot-benchmark-results/
    ├── benchmark-report.md
    └── performance-metrics.json

../anova-results/
├── anova-report.md
├── statistical-summary.json
└── plots/
    ├── distribution_boxplots.png
    ├── qq_plots.png
    └── ... [more visualizations]
```

### Accessing Results

| Results                | Location                                                   |
| ---------------------- | ---------------------------------------------------------- |
| Performance comparison | `../comparison-results/`                                   |
| Security testing       | `../comparison-results/`                                   |
| Mobile benchmarks      | `../docker-emulation-benchmarks/mobile-benchmark-results/` |
| IoT benchmarks         | `../docker-emulation-benchmarks/iot-benchmark-results/`    |
| Statistical analysis   | `../anova-results/`                                        |

---

## 🔧 Setup & Prerequisites

### System Requirements

#### For Comparison Tests

- Node.js ≥ 16.0.0
- npm or yarn
- TypeScript ≥ 5.0
- Jest ≥ 29.0.0

#### For Docker Benchmarks

- Docker Desktop (latest)
- 2GB+ free disk space
- Linux containers mode (Windows)

#### For ANOVA Analysis

- Python 3.8+
- Virtual environment (recommended)
- See [analysis/anova/README.md](analysis/anova/README.md) for Python packages

### First-Time Setup

```powershell
# 1. Install Node dependencies (from repo root)
npm install

# 2. Build TypeScript
npm run build

# 3. (Optional) Set up Python for ANOVA
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install scipy numpy pandas matplotlib seaborn statsmodels
```

---

## 📋 Workflow Checklist

Use this for running complete research:

- [ ] **Setup Phase**
  - [ ] Install Node dependencies: `npm install`
  - [ ] Build code: `npm run build`
  - [ ] Setup Python: `python -m venv .venv` + install packages

- [ ] **Experimentation Phase**
  - [ ] Run comparison tests: `npm run research:comparison`
  - [ ] Run mobile benchmarks: `npm run research:docker:mobile`
  - [ ] Run IoT benchmarks: `npm run research:docker:iot`

- [ ] **Analysis Phase**
  - [ ] Run ANOVA: `npm run research:anova`
  - [ ] Review statistical reports
  - [ ] Check visualizations

- [ ] **Thesis Integration**
  - [ ] Extract key findings for thesis
  - [ ] Copy relevant tables & plots
  - [ ] Document assumptions & limitations
  - [ ] Cross-reference results

---

## 🎓 Using Results in Thesis

### Recommended Sections

1. **Performance Comparison**
   - Tables from `comparison-results/performance-*/performance-report.md`
   - Plots from `anova-results/plots/`

2. **Security Analysis**
   - Security findings from `comparison-results/security-*/security-report.md`
   - Attack resistance data

3. **Real-World Testing**
   - Mobile results from `docker-emulation-benchmarks/mobile-benchmark-results/`
   - IoT results from `docker-emulation-benchmarks/iot-benchmark-results/`

4. **Statistical Validation**
   - ANOVA report: `anova-results/anova-report.md`
   - Effect sizes for practical significance
   - Post-hoc comparisons for detailed analysis

---

## 🔍 Troubleshooting

### "Tests fail with missing module"

```powershell
cd ..\.. # Go to repo root
npm install
npm run build
```

### Docker experiments fail

```powershell
# Verify Docker is running
docker ps

# Clean old images/containers
docker system prune -a

# Rerun benchmark
cd research\experiments\docker-benchmarks\mobile
.\run-mobile-benchmark.ps1
```

### ANOVA analysis fails

```powershell
# Activate Python environment
.\.venv\Scripts\Activate.ps1

# Install/upgrade dependencies
pip install --upgrade scipy numpy pandas matplotlib seaborn statsmodels

# Rerun analysis
cd research\analysis\anova
.\run-anova.ps1
```

### Results not appearing

- Check that experiments completed successfully (exit code 0)
- Verify results directory exists with correct timestamp
- For comparison tests: check `../comparison-results/`
- For Docker: check `../docker-emulation-benchmarks/[mobile|iot]-benchmark-results/`

---

## 📖 Documentation

Each experiment has detailed documentation:

- [Comparison Tests](experiments/comparison-tests/README.md) - Algorithm comparison details
- [Mobile Benchmarks](experiments/docker-benchmarks/mobile/README.md) - Mobile simulation setup
- [IoT Benchmarks](experiments/docker-benchmarks/iot/README.md) - IoT device testing
- [ANOVA Analysis](analysis/anova/README.md) - Statistical testing methodology

---

## 📝 Citation & References

When citing this research work:

```bibtex
@thesis{yourname2026,
  title={Cryptographic Algorithm Comparison for Verifiable Credentials},
  author={Your Name},
  year={2026},
  school={Your University},
  url={https://github.com/Mrazakos/vc-ecdsa-crypto}
}
```

---

## 🤝 Contributing to Research

To add new experiments:

1. Create folder in `experiments/`
2. Add `run-*.ps1` automation script
3. Add `config.json` with experiment parameters
4. Add `README.md` with clear instructions
5. Update `package.json` with npm script

Example:

```json
"research:my-experiment": "cd research/experiments/my-experiment && .\\run-my-experiment.ps1"
```

---

## 📞 Support

For issues or questions:

1. Check the specific experiment README first
2. Review troubleshooting section above
3. Check main repository [README](../README.md)

---

**Last Updated:** March 22, 2026  
**Status:** Ready for thesis research
