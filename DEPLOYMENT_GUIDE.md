# 🚀 PUBG Tracker - Deployment Setup Guide

## GitHub Actions CI/CD Pipeline

This repository includes automated deployment pipelines that will deploy your PUBG Tracker to your web hosting whenever you push code to GitHub.

## 🔧 Setup Instructions

### 1. GitHub Repository Secrets

You need to add these secrets to your GitHub repository:

**Go to:** GitHub Repository → Settings → Secrets and Variables → Actions → New Repository Secret

#### For FTP Deployment:
- `FTP_SERVER` - Your FTP server hostname (e.g., `ftp.webzdarma.cz`)
- `FTP_USERNAME` - Your FTP username
- `FTP_PASSWORD` - Your FTP password
- `FTP_SERVER_DIR` - Directory path on server (e.g., `/public_html/` or `/www/`)
- `FTP_DEV_SERVER_DIR` - Dev directory path (e.g., `/public_html/dev/`)

#### For SFTP Deployment (alternative):
- `SFTP_SERVER` - Your SFTP server hostname
- `SFTP_USERNAME` - Your SFTP username  
- `SFTP_PASSWORD` - Your SFTP password
- `SFTP_SERVER_DIR` - Directory path on server

### 2. Webzdarma.cz Specific Setup

Based on your hosting at webzdarma.cz, you'll likely need:

```
FTP_SERVER: ftp.webzdarma.cz
FTP_USERNAME: your_username
FTP_PASSWORD: your_password
FTP_SERVER_DIR: /www/
```

### 3. Deployment Workflows

#### Main Deployment (`deploy.yml`)
- **Triggers:** Push to `main` or `dev` branch
- **Features:**
  - Installs Node.js dependencies
  - Prepares deployment files
  - Deploys via FTP/SFTP
  - Creates .htaccess for Apache
  - Excludes sensitive files (PUBG.JS with API keys)

#### Static Site Deployment (`deploy-static.yml`)
- **Triggers:** Push to `main` branch or manual trigger
- **Features:**
  - Creates static build
  - Deploys to GitHub Pages
  - Also deploys to custom FTP hosting
  - Perfect for frontend-only deployment

### 4. File Structure After Deployment

```
your-website/
├── index.html          # Main dashboard
├── data.json          # Match data
├── server.js          # Node.js server (if supported)
├── package.json       # Dependencies
├── public/            # Static assets
├── .htaccess          # Apache configuration
└── README.md          # Documentation
```

### 5. Security Considerations

✅ **Included in deployment:**
- Frontend files (HTML, CSS, JS)
- Match data (data.json)
- Server files (if Node.js hosting)
- Static assets

❌ **Excluded from deployment:**
- PUBG.JS (contains API keys)
- node_modules
- .git files
- .env files

### 6. Hosting Options

#### Option A: Static Hosting
If webzdarma.cz only supports static files:
- Use `deploy-static.yml`
- Only HTML/CSS/JS files are deployed
- Data updates require manual file upload or API integration

#### Option B: Node.js Hosting  
If webzdarma.cz supports Node.js:
- Use `deploy.yml`
- Full server deployment with Express
- Can run data fetching on server

#### Option C: Hybrid Approach
- Static site for main dashboard
- Separate service for data fetching
- Manual data.json updates

### 7. Testing the Pipeline

1. **Push to dev branch** - Test deployment to dev directory
2. **Check deployment logs** - GitHub Actions tab shows progress
3. **Verify files** - Check if files appear on your hosting
4. **Test functionality** - Ensure dashboard works on live site

### 8. Webzdarma.cz Connection Info

You mentioned: https://admin.webzdarma.cz/connections/

To get your FTP credentials:
1. Log into webzdarma.cz admin panel
2. Go to Connections/FTP settings
3. Note down:
   - FTP server address
   - Username  
   - Password
   - Directory path (usually `/www/` or `/public_html/`)

### 9. Manual Deployment (Alternative)

If automated deployment doesn't work initially:

```bash
# Build files locally
mkdir deploy
cp index.html data.json deploy/
cp -r public deploy/ 2>/dev/null || true

# Upload via FTP client (FileZilla, WinSCP, etc.)
```

### 10. Troubleshooting

**Common Issues:**
- Wrong FTP credentials → Check webzdarma.cz admin panel
- Permission denied → Verify server directory path
- Files not updating → Check deployment logs in GitHub Actions
- Site not loading → Verify .htaccess configuration

**Logs Location:**
GitHub Repository → Actions tab → Click on latest workflow run

---

## 🔄 Automatic Updates

Once configured:
1. **Edit code locally**
2. **Commit and push to GitHub**
3. **GitHub Actions automatically deploys**
4. **Your live site updates within minutes**

## 📞 Need Help?

If you provide your webzdarma.cz FTP credentials, I can help configure the exact settings needed for your deployment pipeline.