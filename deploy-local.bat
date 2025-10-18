@echo off
echo 🚀 PUBG Tracker - Local Deployment Test
echo =======================================

REM Create deployment directory
echo 📁 Creating deployment directory...
if not exist "deploy" mkdir deploy

REM Copy frontend files
echo 📋 Copying frontend files...
copy index.html deploy\ >nul 2>&1
if exist data.json (
    copy data.json deploy\ >nul 2>&1
) else (
    echo ⚠️  No data.json found - creating empty one
    echo [] > deploy\data.json
)

REM Copy public directory if it exists
if exist "public" (
    echo 📂 Copying public directory...
    xcopy public deploy\public\ /E /I /Q >nul 2>&1
) else (
    echo ⚠️  No public directory found
)

REM Copy server files
echo 🖥️  Copying server files...
copy server.js deploy\ >nul 2>&1
copy package.json deploy\ >nul 2>&1
copy package-lock.json deploy\ >nul 2>&1

REM Copy documentation
copy README.md deploy\ >nul 2>&1

REM Create .htaccess file
echo ⚙️  Creating .htaccess file...
(
echo # PUBG Tracker - Apache Configuration
echo DirectoryIndex index.html
echo.
echo # Enable rewrite engine
echo RewriteEngine On
echo.
echo # Handle SPA routing ^(if needed^)
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule ^^(.*)$ index.html [QSA,L]
echo.
echo # Security headers
echo ^<IfModule mod_headers.c^>
echo     Header always set X-Frame-Options DENY
echo     Header always set X-Content-Type-Options nosniff
echo ^</IfModule^>
) > deploy\.htaccess

REM Create deployment info
echo ℹ️  Creating deployment info...
(
echo PUBG Tracker Deployment
echo =====================
echo Generated: %date% %time%
echo Local test deployment
echo Files included:
echo - index.html ^(Dashboard^)
echo - data.json ^(Match data^)
echo - server.js ^(Express server^)
echo - package.json ^(Dependencies^)
echo - .htaccess ^(Apache config^)
echo - README.md ^(Documentation^)
echo.
echo For production deployment, use GitHub Actions pipeline.
) > deploy\deployment-info.txt

REM Show deployment summary
echo.
echo ✅ Deployment preparation complete!
echo 📁 Files ready in './deploy/' directory:
dir deploy /b

echo.
echo 🌐 To test locally:
echo    cd deploy
echo    python -m http.server 8080
echo    # Or use any local web server

echo.
echo 📤 To upload to webzdarma.cz:
echo    1. Use FTP client (FileZilla, WinSCP)
echo    2. Upload contents of 'deploy/' folder  
echo    3. Or use GitHub Actions for automatic deployment

echo.
echo 🔧 Next steps:
echo    1. Configure GitHub repository secrets
echo    2. Push to GitHub to trigger auto-deployment
echo    3. Check GitHub Actions logs for deployment status

pause