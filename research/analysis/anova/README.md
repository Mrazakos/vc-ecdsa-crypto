# ANOVA Statistical Analysis

Robust statistical analysis of cryptographic algorithm performance comparison data.

## Quick Start

### Run ANOVA Analysis

```powershell
.\run-anova.ps1
```

### Options

```powershell
# Generate plots automatically
.\run-anova.ps1 -GeneratePlots

# Use custom data folder
.\run-anova.ps1 -DataFolder "comparison-results"

# Pre-activate Python environment first
.\.venv\Scripts\Activate.ps1
.\run-anova.ps1
```

## Prerequisites

### Python Environment

**First time setup:**

```powershell
# Create virtual environment (if not exists)
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install scipy numpy pandas matplotlib seaborn statsmodels
```

**Subsequent runs:**

```powershell
.\.venv\Scripts\Activate.ps1
.\run-anova.ps1
```

## What Gets Analyzed

### Input Data

- Comparison test results from `comparison-results/`
- Docker benchmark results (mobile & IoT)
- Raw measurement files (JSON format)

### Statistical Tests Performed

1. **Descriptive Statistics**
   - Mean, median, std deviation
   - Min/max values
   - Quartiles and percentiles

2. **Normality Testing**
   - Shapiro-Wilk test
   - Q-Q plots
   - Histogram analysis

3. **Variance Homogeneity**
   - Levene's test
   - Bartlett's test

4. **Main Analysis**
   - Welch's ANOVA (robust to unequal variances)
   - Kruskal-Wallis test (non-parametric alternative)
   - Effect sizes (eta-squared, omega-squared, Cohen's d)

5. **Post-Hoc Testing**
   - Tukey's HSD for pairwise comparisons
   - Bonferroni-corrected t-tests
   - Confidence intervals

### Visualizations Generated

- ✓ Distribution boxplots
- ✓ Violin plots (density + quartiles)
- ✓ Q-Q plots (normality assessment)
- ✓ Residual plots
- ✓ Interaction plots
- ✓ Effect size plots

## Output

All results saved to `anova-results/`:

```
anova-results/
├── comparison-analysis/
│   ├── anova-report.md                 # Main findings
│   ├── statistical-summary.json        # Raw statistics
│   ├── assumptions-diagnostics.md      # Test assumption checks
│   ├── effect-sizes.json               # Effect size analysis
│   ├── pairwise-comparisons.json       # Post-hoc test results
│   └── plots/
├── iot-analysis/
│   ├── anova-report.md
│   ├── statistical-summary.json
│   └── plots/
└── comprehensive-analysis/
   ├── anova-report.md
   ├── statistical-summary.json
   └── plots/
```

## Interpreting Results

### ANOVA Report

The main report (`anova-report.md`) includes:

1. **Summary Statistics** - Raw numbers for each algorithm
2. **Test Results** - p-values and test statistics
3. **Effect Sizes** - Practical significance (not just p < 0.05)
4. **Post-Hoc Analysis** - Which pairs differ significantly
5. **Recommendations** - Practical conclusions for thesis

### Key Sections

#### Example: Performance Comparison

```
Algorithm Comparison: Signing Time

ANOVA Results:
F-statistic: 156.23
p-value: < 0.001 ***

Significant differences found between algorithms.

Welch's ANOVA (robust): F = 145.31, p < 0.001
Kruskal-Wallis (non-parametric): H = 142.87, p < 0.001

Effect Size: η² = 0.78 (large effect)

Pairwise Comparisons (Tukey HSD):
ECDSA   vs RSA-PSS:    p < 0.001 (ECDSA faster by 12.3ms)
ECDSA   vs ML-DSA-65:  p < 0.001 (ECDSA faster by 45.1ms)
RSA-PSS vs ML-DSA-65:  p < 0.05  (RSA-PSS faster by 32.8ms)
```

### Interpreting p-values

- **p < 0.001** (\*\*\*): Highly significant difference
- **p < 0.01** (\*\*): Very significant difference
- **p < 0.05** (\*): Significant difference
- **p > 0.05**: No significant difference

### Interpreting Effect Sizes

| Value            | Interpretation |
| ---------------- | -------------- |
| η² < 0.01        | Small effect   |
| 0.01 ≤ η² < 0.06 | Medium effect  |
| η² ≥ 0.14        | Large effect   |

## Files

| File            | Purpose                      |
| --------------- | ---------------------------- |
| `run-anova.ps1` | PowerShell automation script |
| `config.json`   | Analysis configuration       |
| `README.md`     | This file                    |

## Troubleshooting

### "Python not found"

```powershell
# Check if .venv exists
ls .venv

# Create if missing
python -m venv .venv

# Activate
.\.venv\Scripts\Activate.ps1
```

### Import errors (scipy, pandas, etc.)

```powershell
# Re-install dependencies
pip install --upgrade scipy numpy pandas matplotlib seaborn statsmodels
```

### "No raw-data.json files found"

- Ensure comparison tests have been run first
- Check that results are in `comparison-results/` directory
- Verify file structure: `comparison-results/performance-*/raw-data.json`

### Plots not generating

```powershell
# Run with explicit plot generation
.\run-anova.ps1 -GeneratePlots $true
```

## Advanced Usage

### Analyze specific metrics only

```powershell
# Edit scripts/run_robust_anova_analysis.py and modify:
metrics_to_analyze = ['signing_time', 'key_generation_time']
```

### Change output directory

```powershell
.\run-anova.ps1 -DataFolder "path/to/custom/results"
```

### Manual analysis

```powershell
# Activate Python environment
.\.venv\Scripts\Activate.ps1

# Run analysis script directly
python scripts/run_robust_anova_analysis.py -d comparison-results
```

## See Also

- [Comparison Tests](../../experiments/comparison-tests/) - Run performance tests
- [Mobile Benchmarks](../../experiments/docker-benchmarks/mobile/) - Mobile testing
- [IoT Benchmarks](../../experiments/docker-benchmarks/iot/) - IoT testing
