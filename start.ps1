# Wedding Seating Planner 1-Click PowerShell Launcher
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Wedding Seating Planner + Live Playwright Sync" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Python Playwright Sync Daemon in new window
Write-Host "[1/2] Launching Python 10-minute RSVP Sync Daemon in background..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python scripts/scrape_guests.py"

# 2. Start Vite Dev Server and open browser
Write-Host "[2/2] Launching Vite Web App..." -ForegroundColor Green
Write-Host "Address: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Secret Gate: kingabso" -ForegroundColor Yellow
Write-Host ""

& npm.cmd run dev -- --open
