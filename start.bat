@echo off
setlocal
cd /d "%~dp0"
echo ======================================================================
echo   Wedding Seating Planner + Live Playwright Sync
echo ======================================================================
echo.

echo [1/2] Starting Python 10-minute RSVP Sync Daemon in background...
start "Wedding-RSVP-Sync-Daemon" cmd /c "python scripts\scrape_guests.py"

echo [2/2] Starting Vite Web Server...
echo.
echo Address: http://localhost:5173
echo Secret Code: kingabso
echo.

call npm.cmd run dev -- --open
