# Run VC-ECDSA-Crypto Comparison Tests
# Tests ECDSA, RSA-PSS, and ML-DSA-65 algorithm comparison

param(
    [string]$TestPattern = "vc-comparison",
    [switch]$Verbose = $false,
    [switch]$BuildFirst = $true
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VC-ECDSA-Crypto Comparison Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Repository: $(Get-Location)" -ForegroundColor Gray
Write-Host "Test Pattern: $TestPattern" -ForegroundColor Gray
Write-Host ""

if ($BuildFirst) {
    Write-Host "[1/2] Building TypeScript..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[2/2] Running comparison tests..." -ForegroundColor Yellow
$testArgs = @("test", "--", $TestPattern)
if ($Verbose) {
    $testArgs += "--verbose"
}

npm $testArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Comparison tests completed successfully!" -ForegroundColor Green
    Write-Host "Results saved to: comparison-results/" -ForegroundColor Green
} else {
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1
}
