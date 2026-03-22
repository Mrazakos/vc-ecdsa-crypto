# Repository Restructuring Summary

## What Was Done

Your repository has been restructured to make research experiments easily discoverable and runnable. All thesis work is now organized under a dedicated `research/` directory.

### Directory Structure Created

```
research/
├── experiments/                    # Run these to collect data
│   ├── comparison-tests/           # ECDSA vs RSA vs ML-DSA-65
│   │   ├── run-comparison.ps1      # Automation script (PowerShell)
│   │   ├── config.json             # Experiment configuration
│   │   └── README.md               # Complete documentation
│   │
│   └── docker-benchmarks/          # Device simulations
│       ├── mobile/                 # Mobile device benchmark
│       │   ├── run-mobile-benchmark.ps1
│       │   └── README.md
│       │
│       └── iot/                    # IoT device benchmark
│           ├── run-iot-benchmark.ps1
│           └── README.md
│
├── analysis/                       # Learn from results
│   └── anova/                      # Statistical analysis
│       ├── run-anova.ps1           # Automation script
│       ├── config.json             # Analysis configuration
│       └── README.md               # Complete documentation
│
├── data/                           # Future: organized results
│   ├── performance-results/
│   └── docker-results/
│
└── README.md                       # MAIN ENTRY POINT
```

### Files Created/Modified

#### New Files

1. **research/README.md** - Complete research workflow guide
2. **research/experiments/comparison-tests/** - Comparison test setup
   - `run-comparison.ps1`
   - `config.json`
   - `README.md`
3. **research/experiments/docker-benchmarks/mobile/** - Mobile benchmark setup
   - `run-mobile-benchmark.ps1`
   - `README.md`
4. **research/experiments/docker-benchmarks/iot/** - IoT benchmark setup
   - `run-iot-benchmark.ps1`
   - `README.md`
5. **research/analysis/anova/** - ANOVA analysis setup
   - `run-anova.ps1`
   - `config.json`
   - `README.md`
6. **RESEARCH_SETUP_GUIDE.md** - Verification checklist
7. **docs/** - (Ready for additional documentation)

#### Modified Files

1. **package.json** - Added npm scripts

   ```json
   "research:comparison": "cd research/experiments/comparison-tests && .\\run-comparison.ps1",
   "research:docker:mobile": "cd research/experiments/docker-benchmarks/mobile && .\\run-mobile-benchmark.ps1",
   "research:docker:iot": "cd research/experiments/docker-benchmarks/iot && .\\run-iot-benchmark.ps1",
   "research:anova": "cd research/analysis/anova && .\\run-anova.ps1",
   "research:all": "npm run research:comparison && npm run research:docker:mobile && npm run research:docker:iot && npm run research:anova"
   ```

2. **README.md** - Added "🔬 Research & Benchmarking" section
   - Quick reference to run experiments
   - Links to research documentation

---

## 🚀 How to Use

### Quick Start (All Experiments)

```powershell
npm run research:all
```

This will run sequentially:

1. Comparison tests (fastest, ~5-10 minutes)
2. Mobile benchmarks (requires Docker, ~10-15 minutes)
3. IoT benchmarks (requires Docker, ~10-15 minutes)
4. ANOVA analysis (requires Python, ~5 minutes)

### Run Individual Experiments

```powershell
# Performance comparison only
npm run research:comparison

# Mobile device simulation
npm run research:docker:mobile

# IoT device simulation
npm run research:docker:iot

# Statistical analysis
npm run research:anova
```

### Or Run Directly

```powershell
# Navigate to experiment directory
cd research/experiments/comparison-tests
.\run-comparison.ps1

# Navigate to analysis directory
cd ..\..\analysis\anova
.\run-anova.ps1
```

---

## 📍 Where Results Go

All results are saved with timestamps automatically:

| Experiment        | Results Location                                        |
| ----------------- | ------------------------------------------------------- |
| Comparison tests  | `comparison-results/`                                   |
| Mobile benchmarks | `docker-emulation-benchmarks/mobile-benchmark-results/` |
| IoT benchmarks    | `docker-emulation-benchmarks/iot-benchmark-results/`    |
| ANOVA analysis    | `anova-results/`                                        |

Each contains:

- Markdown reports
- JSON data files
- Plots & visualizations

---

## 📚 Documentation

### For Getting Started

1. **[RESEARCH_SETUP_GUIDE.md](./RESEARCH_SETUP_GUIDE.md)** - Verification checklist

### For Running Experiments

1. **[research/README.md](./research/README.md)** - Complete research workflow
2. **[research/experiments/comparison-tests/README.md](./research/experiments/comparison-tests/README.md)** - Comparison test details
3. **[research/experiments/docker-benchmarks/mobile/README.md](./research/experiments/docker-benchmarks/mobile/README.md)** - Mobile benchmark setup
4. **[research/experiments/docker-benchmarks/iot/README.md](./research/experiments/docker-benchmarks/iot/README.md)** - IoT benchmark setup
5. **[research/analysis/anova/README.md](./research/analysis/anova/README.md)** - ANOVA analysis guide

### Research Context Files (Already Existed)

- [ALGORITHM_COMPARISON_GUIDE.md](./ALGORITHM_COMPARISON_GUIDE.md)
- [THESIS_RSA_VS_ECDSA_COMPARISON.md](./THESIS_RSA_VS_ECDSA_COMPARISON.md)
- [LIBRARY_SECURITY_ASSESSMENT.md](./LIBRARY_SECURITY_ASSESSMENT.md)

---

## ⚙️ Prerequisites

### Comparison Tests (Fastest, No Extra Dependencies)

- ✅ Node.js ≥ 16.0.0
- ✅ npm (comes with Node.js)
- ✅ Already installed dependencies

Time: ~5-10 minutes

### Docker Benchmarks (Requires Docker)

- ✅ Docker Desktop (latest version)
- ✅ ~2GB free disk space
- ✅ Linux containers mode on Windows

Time: ~10-15 minutes each (mobile & IoT)

### ANOVA Analysis (Requires Python)

- ✅ Python 3.8+
- ✅ Virtual environment (recommended)
- ✅ Python packages: scipy, numpy, pandas, matplotlib, seaborn, statsmodels

Time: ~5 minutes

**Setup Python environment:**

```powershell
# Create virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install scipy numpy pandas matplotlib seaborn statsmodels
```

---

## 🎓 Best Practices for Thesis

### 1. Run in Order

```powershell
# This ensures you have data before running analysis
npm run research:all
```

### 2. Keep Results Organized

- Results are automatically timestamped
- Don't delete old results - keep them for reproducibility
- Archive final results separately for thesis submission

### 3. Document Your Runs

Before running major experiments, note:

```powershell
# Add comments to your workflow
# Date: 2026-03-22
# Purpose: Final performance comparison for thesis draft
# Environment: Windows 10, Node 18.0, Docker Desktop 4.8

npm run research:all
```

### 4. Export for Thesis

```powershell
# After running experiments:
# 1. Review markdown reports in:
#    - comparison-results/
#    - anova-results/
# 2. Copy relevant plots to thesis/figures/
# 3. Cite the timestamp of experiment in thesis
```

### 5. Reproducibility Note

When writing thesis, include:

```bibtex
@misc{vc-ecdsa-crypto-experiments,
  title={VC-ECDSA-Crypto Performance Experiments},
  author={Your Name},
  year={2026},
  howpublished={GitHub Repository},
  note={Experiments run on 2026-03-22 using research scripts}
}
```

---

## 🔍 What Each Experiment Does

### Comparison Tests

- **What**: Runs performance and security tests
- **How long**: 5-10 minutes
- **Output**: Performance tables, security analysis
- **Result suitability**: Excellent for thesis comparison table
- **Dependencies**: None (uses existing Jest tests)

### Mobile Benchmarks

- **What**: Simulates iPhone/Android-like constraints
- **How long**: 10-15 minutes
- **Output**: Mobile-specific performance metrics
- **Result suitability**: Real-world performance claim support
- **Dependencies**: Docker Desktop

### IoT Benchmarks

- **What**: Simulates Raspberry Pi/edge device constraints
- **How long**: 10-15 minutes
- **Output**: IoT-specific performance & scalability
- **Result suitability**: IoT/edge device use case validation
- **Dependencies**: Docker Desktop

### ANOVA Analysis

- **What**: Statistical significance testing
- **How long**: 5 minutes
- **Output**: p-values, effect sizes, post-hoc tests
- **Result suitability**: Academic rigor, thesis validation
- **Dependencies**: Python 3.8+ with scipy/pandas

---

## 📊 Data Flow

```
Experiments → Results → Analysis → Thesis

Comparison Tests → comparison-results/
Mobile Benchmark → docker-emulation-benchmarks/mobile-benchmark-results/
IoT Benchmark    → docker-emulation-benchmarks/iot-benchmark-results/

        ↓

    ANOVA Analysis → anova-results/
    (processes all above)

        ↓

   Extract findings → Thesis writing
   Export plots → Thesis figures/
   Document methods → Methods section
```

---

## ✅ Verification

To verify everything is set up:

```powershell
# 1. Check npm scripts exist
npm run 2>&1 | findstr "research:"

# 2. Check directories exist
ls research\experiments\
ls research\analysis\

# 3. Check PowerShell scripts exist
ls research\**\*.ps1

# 4. Check documentation
ls research\**\README.md
```

See [RESEARCH_SETUP_GUIDE.md](./RESEARCH_SETUP_GUIDE.md) for detailed verification.

---

## 🎯 Next Steps

1. **Review Structure**: `cd research && ls` - see what was created
2. **Read Overview**: Open [research/README.md](./research/README.md)
3. **Run Quick Test**: `npm run research:comparison`
4. **Check Results**: `ls comparison-results/`
5. **Full Run**: `npm run research:all` (when ready)
6. **Analyze**: `npm run research:anova`
7. **Export**: Copy plots/tables to thesis

---

## 💡 Key Improvements Made

### For Discoverability

- ✅ Clear `research/` directory separates thesis work from library code
- ✅ Single entry point: `research/README.md`
- ✅ Each experiment has its own documented folder with `README.md`

### For Reproducibility

- ✅ npm scripts: `npm run research:*`
- ✅ PowerShell automation: `.ps1` scripts with clear options
- ✅ Configuration files: `config.json` documents experiment parameters
- ✅ Timestamped results: Easy to track which run produced which output

### For Ease of Use

- ✅ Single command: `npm run research:all`
- ✅ Clear documentation in every folder
- ✅ Setup verification guide included
- ✅ Troubleshooting sections in each README

### For Academic Rigor

- ✅ Automated ANOVA analysis with statistical testing
- ✅ Outlier handling and assumption checking
- ✅ Effect sizes for practical significance
- ✅ Visualizations for thesis presentation

---

## 📝 Summary

Your repository is now restructured for thesis success:

1. **Library code** remains in `src/` and `tests/`
2. **Research experiments** are organized under `research/`
3. **Easy execution** via npm scripts or direct PowerShell
4. **Complete documentation** at every level
5. **Reproducible results** with proper organization and timestamps

**You can now:**

- ✅ Run any experiment independently
- ✅ Run all experiments in sequence
- ✅ Easily find and use results for thesis
- ✅ Share methodology with others
- ✅ Reproduce results even months later

---

**Restructured:** March 22, 2026  
**Status:** Ready for thesis research  
**Next:** Read [research/README.md](./research/README.md) and run your first experiment!
