@echo off
echo ========================================
echo PUBG Tracker - Quick Incremental Update
echo ========================================
echo.
echo 📊 Collecting only NEW matches (lightweight)
echo ⏱️ This should take 1-2 minutes
echo.

set /p player="Enter player name (or press Enter for Kilma9): "
if "%player%"=="" set player=Kilma9

echo.
echo 👤 Updating data for: %player%
node PUBG.JS %player%

if errorlevel 1 (
    echo.
    echo ❌ Update failed!
    pause
    exit /b 1
)

echo.
echo ✅ Incremental update completed for %player%!
echo.

if exist data_%player%.json (
    echo 📊 Data file: data_%player%.json
) else if exist data.json (
    echo 📊 Data file: data.json
)

echo.
pause
