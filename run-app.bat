@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tidak ditemukan di PATH.
  echo Install Node.js dulu, lalu jalankan file ini lagi.
  pause
  exit /b 1
)

set PORT=4173

if exist "data\merged\game-data.json" (
  set DATA_PATH=data\merged\game-data.json
) else (
  set DATA_PATH=data\fixtures\game-data.json
)

echo Starting PoE2 Build Generator...
echo URL: http://localhost:%PORT%
echo Data: %DATA_PATH%
echo.
echo Tekan Ctrl+C untuk stop server.
echo.

start "" "http://localhost:%PORT%"
node src\server.js

pause
