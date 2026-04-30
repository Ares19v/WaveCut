@echo off
title WaveCut — Uninstall
color 0C
echo.
echo  ============================================
echo    WaveCut — Uninstall
echo  ============================================
echo.
echo  This will remove node_modules and dist folders.
echo  Your source code will NOT be deleted.
echo.
set /p confirm=  Are you sure? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo  Cancelled.
    pause
    exit /b 0
)

if exist "node_modules" (
    echo  Removing node_modules...
    rmdir /s /q node_modules
)
if exist "dist" (
    echo  Removing dist...
    rmdir /s /q dist
)

echo.
echo  Done. Run INSTALL.bat to reinstall.
echo.
pause
