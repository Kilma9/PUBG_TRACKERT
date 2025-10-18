#!/bin/bash

# 🚀 Local Deployment Test Script
# This script simulates what the GitHub Actions pipeline will do

echo "🔧 PUBG Tracker - Local Deployment Test"
echo "======================================="

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p deploy

# Copy frontend files
echo "📋 Copying frontend files..."
cp index.html deploy/
cp data.json deploy/ 2>/dev/null || echo "⚠️  No data.json found - creating empty one"
echo '[]' > deploy/data.json 2>/dev/null

# Copy public directory if it exists
if [ -d "public" ]; then
    echo "📂 Copying public directory..."
    cp -r public deploy/
else
    echo "⚠️  No public directory found"
fi

# Copy server files for Node.js hosting
echo "🖥️  Copying server files..."
cp server.js deploy/
cp package.json deploy/
cp package-lock.json deploy/

# Copy documentation
cp README.md deploy/

# Create .htaccess for Apache hosting
echo "⚙️  Creating .htaccess file..."
cat > deploy/.htaccess << 'EOF'
# PUBG Tracker - Apache Configuration
DirectoryIndex index.html

# Enable rewrite engine
RewriteEngine On

# Handle SPA routing (if needed)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>
EOF

# Create deployment info
echo "ℹ️  Creating deployment info..."
cat > deploy/deployment-info.txt << EOF
PUBG Tracker Deployment
=====================
Generated: $(date)
Local test deployment
Files included:
- index.html (Dashboard)
- data.json (Match data)  
- server.js (Express server)
- package.json (Dependencies)
- .htaccess (Apache config)
- README.md (Documentation)

For production deployment, use GitHub Actions pipeline.
EOF

# Show deployment summary
echo ""
echo "✅ Deployment preparation complete!"
echo "📁 Files ready in './deploy/' directory:"
ls -la deploy/

echo ""
echo "🌐 To test locally:"
echo "   cd deploy"
echo "   python -m http.server 8080"
echo "   # Or use any local web server"

echo ""
echo "📤 To upload to webzdarma.cz:"
echo "   1. Use FTP client (FileZilla, WinSCP)"
echo "   2. Upload contents of 'deploy/' folder"
echo "   3. Or use GitHub Actions for automatic deployment"

echo ""
echo "🔧 Next steps:"
echo "   1. Configure GitHub repository secrets"
echo "   2. Push to GitHub to trigger auto-deployment"
echo "   3. Check GitHub Actions logs for deployment status"