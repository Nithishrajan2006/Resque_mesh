<#
.SYNOPSIS
    ResQMesh - Single-Command Development & Demo Launcher for Windows PowerShell
.DESCRIPTION
    Launches the FastAPI backend and Vite frontend development servers concurrently in separate windows.
#>

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   ResQMesh - AI Mesh Networks & Disaster Response Platform      " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[*] Checking environment..." -ForegroundColor White

# Verify Python
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Error "Python 3 is required but was not found in PATH."
    exit 1
}

# Verify Node
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "Node.js is required but was not found in PATH."
    exit 1
}

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "[*] Launching Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; Write-Host 'Starting ResQMesh Backend...' -ForegroundColor Cyan; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[*] Launching Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; Write-Host 'Starting ResQMesh Frontend...' -ForegroundColor Cyan; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host ""
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "   ResQMesh Services Initialized Successfully!" -ForegroundColor Green
Write-Host "   - Command Center UI:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "   - Backend API Docs:   http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "   - Health Check:       http://127.0.0.1:8000/api/health" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "Tip: Click 'Load Demo Scenario' in the UI header to populate data." -ForegroundColor Yellow
