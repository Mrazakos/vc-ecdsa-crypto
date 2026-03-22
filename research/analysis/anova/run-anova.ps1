param(
    [string]$DataFolder = "comparison-results",
    [switch]$GeneratePlots = $true,
    [switch]$OpenResults = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANOVA Statistical Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Repository: $(Get-Location)" -ForegroundColor Gray
Write-Host "Data folder: $DataFolder" -ForegroundColor Gray
Write-Host "Generate plots: $GeneratePlots" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/3] Checking Python environment..." -ForegroundColor Yellow
$pythonCmd = if (Test-Path ".venv\Scripts\python.exe") { ".venv\Scripts\python.exe" } else { "python" }

& $pythonCmd --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python not found or .venv not activated!" -ForegroundColor Red
    Write-Host "Please activate Python environment: .\\.venv\\Scripts\\Activate.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/3] Running ANOVA analysis..." -ForegroundColor Yellow

$args = @(
    "scripts/Anova_helpers_complete_comparison.py",
    "-d", $DataFolder
)
if ($GeneratePlots) {
    $args += "-p"
}

& $pythonCmd $args

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[3/3] Analysis complete!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ANOVA analysis completed successfully!" -ForegroundColor Green
    Write-Host "Results saved to: anova-results/" -ForegroundColor Green
    Write-Host "Plots saved to: anova-results/plots/" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "- Review the ANOVA report in anova-results/" -ForegroundColor Cyan
    Write-Host "- Check the statistical plots for visualizations" -ForegroundColor Cyan
    Write-Host "- Export results for thesis" -ForegroundColor Cyan
} else {
    Write-Host "ANOVA analysis failed!" -ForegroundColor Red
    exit 1
}
