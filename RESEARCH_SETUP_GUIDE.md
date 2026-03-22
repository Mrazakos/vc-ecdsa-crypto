# Research Setup Verification

Run this checklist to ensure your research environment is properly configured.

## ✅ Verification Steps

### 1. Repository Structure

```powershell
# Verify research directory exists
ls research\
```

Expected output:

```
experiments\
analysis\
data\
README.md
```

### 2. NPM Scripts

```powershell
# Check npm scripts are available
npm run 2>&1 | findstr "research:"
```

Expected output:

```
research:anova
research:all
research:comparison
research:docker:iot
research:docker:mobile
```

### 3. Automation Scripts

```powershell
# Verify PowerShell scripts exist
ls research\experiments\comparison-tests\run-*.ps1
ls research\experiments\docker-benchmarks\mobile\run-*.ps1
ls research\experiments\docker-benchmarks\iot\run-*.ps1
ls research\analysis\anova\run-*.ps1
```

### 4. Configuration Files

```powershell
# Verify config files exist
ls research\**\config.json
```

Expected files:

- `research/experiments/comparison-tests/config.json`
- `research/analysis/anova/config.json`

### 5. Documentation Files

```powershell
# Verify README files exist
ls research\**\README.md
```

Expected files:

- `research/README.md` (main entry point)
- `research/experiments/comparison-tests/README.md`
- `research/experiments/docker-benchmarks/mobile/README.md`
- `research/experiments/docker-benchmarks/iot/README.md`
- `research/analysis/anova/README.md`

---

## 🚀 Quick Test

### 1. Test Comparison Tests (No Docker needed)

```powershell
cd research\experiments\comparison-tests
.\run-comparison.ps1 -BuildFirst
```

### 2. Test Docker Benchmarks (Requires Docker)

```powershell
# Check Docker is installed
docker --version

# Test mobile benchmark
cd research\experiments\docker-benchmarks\mobile
.\run-mobile-benchmark.ps1
```

### 3. Test ANOVA (Requires Python)

```powershell
# Activate Python environment
.\.venv\Scripts\Activate.ps1

# Test ANOVA
cd research\analysis\anova
.\run-anova.ps1
```

---

## 🔧 Troubleshooting

### PowerShell Scripts Can't Execute

```powershell
# Check execution policy
Get-ExecutionPolicy

# If Restricted, allow local scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### npm scripts not showing up

```powershell
# Reinstall dependencies
rimraf node_modules package-lock.json
npm install
```

### Docker not found

```powershell
# Verify Docker is installed and running
docker --version
docker ps

# If not installed, download from docker.com
```

### Python environment issues

```powershell
# Activate venv
.\.venv\Scripts\Activate.ps1

# Reinstall packages
pip install --upgrade scipy numpy pandas matplotlib seaborn statsmodels
```

---

## 📋 Setup Checklist for Thesis Work

- [ ] Repository has research directory
- [ ] npm scripts are available (`npm run research:*`)
- [ ] PowerShell scripts can execute (check execution policy)
- [ ] Docker is installed (for benchmarks)
- [ ] Python venv is set up (for ANOVA)
- [ ] All README files are readable
- [ ] config.json files are present

---

## 📖 Usage Quick Reference

```powershell
# From repository root

# Run all research
npm run research:all

# Or run individually
npm run research:comparison
npm run research:docker:mobile
npm run research:docker:iot
npm run research:anova

# Or navigate and run directly
cd research\experiments\comparison-tests
.\run-comparison.ps1
```

---

## 🎓 Next Steps

1. Read [research/README.md](../research/README.md)
2. Run comparison tests first (fastest)
3. Run Docker benchmarks (requires Docker)
4. Run ANOVA analysis (requires Python)
5. Check results in `comparison-results/`, `docker-emulation-benchmarks/`, `anova-results/`

---

**Last Updated:** March 22, 2026
