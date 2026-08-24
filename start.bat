@echo off
chcp 65001 > nul
echo ======================================================================
echo   💍 Wedding Seating Planner + Live Playwright Sync
echo ======================================================================
echo.

:: 1. Launch Python RSVP Sync Daemon in a separate background window
echo [1/2] Launching Python 10-minute RSVP Sync Daemon...
start "Wedding RSVP Sync Daemon" cmd /k "python scripts\scrape_guests.py"

:: 2. Launch Vite Local Web Server
echo [2/2] Launching Vite Web App...
echo.
echo 🌐 The app will open at: http://localhost:5173
echo 🔑 Password / Secret Code: kingabso
echo.
npm.cmd run dev -- --open
