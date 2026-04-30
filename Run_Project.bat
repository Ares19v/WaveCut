@echo off
title WaveCut — Media Editor
color 0B
echo.
echo  ============================================
echo    WaveCut — Professional Media Editor
echo  ============================================
echo.

:: Check node_modules exists
if not exist "node_modules" (
    echo  [!] Dependencies not installed. Running INSTALL.bat first...
    echo.
    call INSTALL.bat
    if %errorlevel% neq 0 exit /b 1
)

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found.
    echo  Please download from https://nodejs.org/
    pause
    exit /b 1
)

echo  Starting development server...
echo  Opening http://localhost:5173 in your browser...
echo.
echo  Press Ctrl+C to stop the server.
echo  ============================================
echo.

:: Small delay then open browser
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Start Vite dev server
call npm run dev
