@echo off
echo ========================================
echo PUBG Tracker - Full Data Refresh
echo ========================================
echo.

echo This will:
echo   1. Archive all existing data
echo   2. Clear current data files
echo   3. Collect fresh data from last 30 days
echo.

set /p confirm="Are you sure you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo.
    echo ❌ Operation cancelled
    pause
    exit /b
)

echo.
echo 🗑️ Step 1: Flushing existing data...
node flush-and-refresh.js

if errorlevel 1 (
    echo.
    echo ❌ Data flush failed!
    pause
    exit /b 1
)

echo.
echo 📊 Step 2: Collecting fresh data for all 6 players...
echo ⏱️ This will take approximately 5-10 minutes
echo.

set PLAYERS=Kilma9 Mar-0 Hyottokko Baron_Frajeris codufus Veru_13

for %%P in (%PLAYERS%) do (
    echo.
    echo ========================================
    echo 👤 Collecting data for: %%P
    echo ========================================
    node PUBG.JS %%P
    
    if errorlevel 1 (
        echo ⚠️ Warning: Failed to collect data for %%P
    ) else (
        echo ✅ Data collection completed for %%P
    )
    
    echo.
    echo ⏸️ Pausing 30 seconds to respect API rate limits...
    timeout /t 30 /nobreak >nul
)

echo.
echo ========================================
echo ✅ Full data refresh completed!
echo ========================================
echo.
echo 📊 Summary:
dir /b data*.json 2>nul | find /c ".json"
echo.
echo 💡 Next steps:
echo    - Run 'node server.js' to test locally
echo    - Incremental collections will now be lightweight
echo    - Scheduled GitHub Actions will auto-update
echo.
pause
