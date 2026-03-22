# Run IoT Docker Benchmarks
# Tests VC operations on simulated IoT environment

param(
    [switch]$BuildImage = $true,
    [switch]$KeepContainers = $false,
    [switch]$Verbose = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IoT Docker Benchmarks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dockerDir = Join-Path (Get-Location) "docker-emulation-benchmarks"

Write-Host "Repository: $(Get-Location)" -ForegroundColor Gray
Write-Host "Docker directory: $dockerDir" -ForegroundColor Gray
Write-Host ""

Push-Location $dockerDir

try {
    if ($BuildImage) {
        Write-Host "[1/3] Building IoT Docker image..." -ForegroundColor Yellow
        docker-compose -f docker-compose.yml build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Docker build failed!" -ForegroundColor Red
            exit 1
        }
    }

    Write-Host "[2/3] Running IoT benchmarks..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml up

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[3/3] Collecting results..." -ForegroundColor Yellow
        
        $resultsDir = Join-Path $dockerDir "iot-benchmark-results"
        
        if (Test-Path $resultsDir) {
            Write-Host ""
            Write-Host "IoT benchmarks completed!" -ForegroundColor Green
            Write-Host "Results saved to: $resultsDir" -ForegroundColor Green
        }
    } else {
        Write-Host "Benchmarks failed!" -ForegroundColor Red
        exit 1
    }

    if (!$KeepContainers) {
        Write-Host "Cleaning up containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose.yml down
    }
}
finally {
    Pop-Location
}
