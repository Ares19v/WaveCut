@echo off
title WaveCut — Install
color 0B
echo.
echo  ============================================
echo    WaveCut — First-Time Setup
echo  ============================================
echo.

:: Check Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Download it from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
echo  Node.js found: %NODE_VER%
echo.

echo  Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo  ============================================
echo    Installation complete!
echo    Run Run_Project.bat to launch WaveCut.
echo  ============================================
echo.
pause
