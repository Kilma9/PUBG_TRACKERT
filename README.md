# 🎮 PUBG Performance Tracker

A comprehensive PUBG statistics dashboard with automated data collection, interactive visualizations, mini games, and real-time analytics. Built for teams to track performance across multiple players with beautiful charts, meme dashboards, team records, and playable browser games.

## 📋 Table of Contents
- [Project Goal](#-project-goal)
- [Current Status](#-current-status)
- [Features](#-features)
- [Mini Games](#-mini-games)
- [Tech Stack](#-tech-stack)
- [Deployment](#-deployment)
- [Quick Start](#-quick-start)
- [API Setup](#-api-setup)
- [GitHub Actions Automation](#-github-actions-automation)
- [Analytics System](#-analytics-system)
- [Project Structure](#-project-structure)

## 🎯 Project Goal

Create an automated, privacy-respecting PUBG statistics tracking system that:
- **Fetches match data** from PUBG API for multiple team members automatically
- **Stores individual player statistics** in separate JSON files for detailed analysis
- **Visualizes performance trends** with interactive Chart.js graphs
- **Runs on GitHub Actions** for hands-free data collection (no local server needed)
- **Deploys to static hosting** (webzdarma.cz) with FTP automation
- **Provides entertainment** through built-in mini games (2D Runner, Battle Royale)
- **Tracks visitor analytics** when running locally with Node.js server

## ✅ Current Status

**Production Ready** - Fully deployed and operational at [kilma-pubg.wz.cz:8080](http://kilma-pubg.wz.cz:8080/)

### What's Working:
- ✅ Automated data collection via GitHub Actions (4x daily at 8 PM, 9 PM, 10 PM, 11 PM Prague time)
- ✅ Multi-player tracking (6 players: Kilma9, Mar-0, Hyottokko, Baron_Frajeris, codufus, Veru_13)
- ✅ Individual player data files (`data_PlayerName.json`) with detailed match history
- ✅ Interactive dashboard with player selection and match navigation
- ✅ Weapon damage analysis with Chart.js visualizations
- ✅ Meme Dashboard with player-specific jokes and achievements
- ✅ Team Records tracking (best kills, damage, headshots, survival time)
- ✅ Changelog system with version history
- ✅ Two playable mini games (2D Runner, Battle Royale)
- ✅ FTP deployment automation to webzdarma.cz hosting
- ✅ Analytics system (Node.js server) with visitor tracking
- ✅ Static analytics page for hosting without Node.js

### Active Development:
- 🔄 Continuous refinement of game mechanics
- 🔄 Analytics visualization improvements
- 🔄 Additional meme content and team records

## ✨ Features

### 📊 **Statistics Dashboard**
- **Real-time PUBG API Integration**: Fetches match data for configured players
- **Daily Statistics Grouping**: Organizes matches by date with team performance summaries
- **Interactive Charts**: Bar charts for kills, damage, headshots per player per day
- **Team Performance Tracking**: Aggregates stats across all team members in each match
- **Weapon Damage Analysis**: Detailed weapon-specific damage with pie charts
- **Match Navigation**: Browse through days and individual matches with dropdown selectors
- **Player Profiles**: Individual stat cards with kills, damage, DBNOs, assists
- **Responsive Design**: Mobile-friendly layout that adapts to all screen sizes

### 🎮 **Mini Games**

#### **🏃 2D Runner Game** (`game.html`)
- Side-scrolling UAZ driving game inspired by PUBG
- Dodge obstacles (rocks, trees, bunkers)
- Collect loot boxes for points
- Progressive difficulty with speed increases
- High score tracking

#### **⚔️ Battle Royale** (`gamebr.html`) - **NEW v0.2**
- **Top-down shooter** with full Battle Royale mechanics
- **Solo & Duos Modes**: Play alone or in 2v2v2 teams
- **6 AI Players**: Tactical AI with leader/follower behavior in Duos
- **Weapon System**: M1911 Pistol (starting), Beryl M762, S12K Shotgun, MG3
- **Armor & Loot Drops**: Special crates spawn every 30 seconds
- **Continuous Zone Shrinking**: Zone shrinks to 50 units, dealing increasing damage
- **Ultra-Detailed Graphics**: Multi-layer desert terrain, detailed buildings, realistic weapon sprites
- **Smart Spawn System**: Players never spawn inside obstacles
- **Frame-Rate Independent**: Smooth 60+ FPS gameplay on all monitors

### 🤡 **Special Sections**
- **Meme Dashboard**: Player-specific memes, nicknames, and achievements
- **Team Records**: Hall of fame for best performance (kills, damage, survival)
- **Changelog**: Version history with all updates and features
- **Analytics** (Node.js): Visitor tracking with Chart.js visualizations

## 🛠️ Tech Stack

### **Backend**
- **Node.js** with Express for local development server
- **PUBG Developer API** with telemetry integration
- **Axios** for HTTP requests to PUBG API
- **GitHub Actions** for automated data collection and deployment

### **Frontend**
- **HTML5, CSS3** with modern responsive design
- **Vanilla JavaScript** (no frameworks - lightweight and fast)
- **Chart.js** for interactive data visualizations
- **Canvas API** for game rendering (mini games)

### **Data Storage**
- **JSON Files**: Local file storage for match history
  - `data.json` - Combined team data
  - `data_PlayerName.json` - Individual player statistics
  - `last-sync.json` - Sync timestamp tracking
  - `analytics.json` - Visitor analytics (when running Node.js server)

### **Deployment**
- **GitHub Actions** for CI/CD automation
- **FTP Deploy** to webzdarma.cz static hosting
- **Apache .htaccess** for routing and caching configuration

## 🚀 Deployment

### **Option 1: Static Hosting (Recommended for Production)**

This project is designed to deploy to **any static hosting** (GitHub Pages, Netlify, Vercel, webzdarma.cz, etc.) using GitHub Actions.

#### **Setup for Your Own Hosting:**

1. **Fork or clone this repository**
   ```bash
   git clone https://github.com/Kilma9/PUBG_TRACKERT.git
   cd PUBG_TRACKERT
   ```

2. **Configure GitHub Secrets** (for FTP deployment):
   - Go to `Settings → Secrets and variables → Actions`
   - Add the following secrets:
     - `PUBG_API_KEY`: Your PUBG Developer API key
     - `WEBZDARMA_FTP_SERVER`: Your FTP server address (e.g., `ftp.yourhost.com`)
     - `WEBZDARMA_FTP_USERNAME`: FTP username
     - `WEBZDARMA_FTP_PASSWORD`: FTP password
     - `WEBZDARMA_FTP_DIR`: Server directory path (e.g., `/public_html/`)

3. **Update Player Names** in `PUBG.JS`:
   ```javascript
   const PLAYERS = [
     { name: 'YourSteamName1', apiName: 'YourSteamName1' },
     { name: 'YourSteamName2', apiName: 'YourSteamName2' },
     // Add more players...
   ];
   ```

4. **Customize Automation** in `.github/workflows/`:
   - `fetch-pubg-data.yml` - Data collection schedule
   - `deploy-static.yml` - Deployment configuration

5. **Push to GitHub** and Actions will automatically:
   - Fetch PUBG data on schedule (default: 8 PM, 9 PM, 10 PM, 11 PM)
   - Deploy to your hosting via FTP

### **Option 2: Local Development**

Run the project locally with Node.js for development and testing.

```bash
# Install dependencies
npm install

# Fetch PUBG data manually
node PUBG.JS

# Start local server
npm start
# or
node server.js

# Open browser
# http://localhost:3000
```

**Local Features:**
- ✅ All dashboard features
- ✅ Mini games (2D Runner, Battle Royale)
- ✅ **Analytics tracking** (visitor stats saved to `analytics.json`)
- ✅ **Live analytics dashboard** at `http://localhost:3000/analytics`

## 🔑 API Setup

### **Get PUBG Developer API Key**

1. Visit [PUBG Developer Portal](https://developer.pubg.com/)
2. Sign in and create an application
3. Copy your API key
4. Add to GitHub Secrets as `PUBG_API_KEY` (for automation)
5. Or add directly to `PUBG.JS` for local testing:
   ```javascript
   const API_KEY = 'your-api-key-here';
   ```

### **Find Your Steam Player Name**

1. Visit [PUBG Lookup](https://pubglookup.com/)
2. Search for your Steam profile
3. Copy the exact player name (case-sensitive)
4. Add to `PLAYERS` array in `PUBG.JS`

## ⚙️ GitHub Actions Automation

### **Automated Data Collection** (`fetch-pubg-data.yml`)

Runs 4 times daily (Prague time zone):
- 8:00 PM (20:00)
- 9:00 PM (21:00)
- 10:00 PM (22:00)
- 11:00 PM (23:00)

**What it does:**
1. Fetches recent matches for all configured players
2. Downloads telemetry data for weapon statistics
3. Creates individual player data files (`data_PlayerName.json`)
4. Updates combined team data (`data.json`)
5. Records sync timestamp (`last-sync.json`)
6. Commits and pushes changes to repository

### **Automated Deployment** (`deploy-static.yml`)

Triggers on every push to `main` branch.

**What it does:**
1. Builds deployment package with all necessary files
2. Creates `.htaccess` for Apache configuration
3. Deploys via FTP to webzdarma.cz hosting
4. Includes: HTML files, JSON data, game assets, analytics page

## 📊 Analytics System

### **Node.js Server Analytics** (`server.js` + `/analytics` route)

When running locally with `node server.js`:
- ✅ Tracks all page visits with IP anonymization
- ✅ Records timestamp, page, user agent, referrer
- ✅ Generates session IDs (hashed, non-reversible)
- ✅ Stores data in `analytics.json` (max 10,000 visits)
- ✅ **GDPR Compliant**: IP last octet removed, no personal data

**Access**: `http://localhost:3000/analytics`

### **Static Analytics Page** (`analytics.html`)

Works on static hosting without Node.js:
- ✅ Reads from `analytics.json` if available
- ✅ Shows "no data" message gracefully if file missing
- ✅ Same Chart.js visualizations as server route
- ✅ Daily traffic, page popularity, traffic sources charts

**Access**: `http://your-domain.com/analytics.html`

**Privacy Features:**
- IP anonymization (last octet replaced with `xxx`)
- Session ID hashing (MD5, non-reversible)
- No cookies, no tracking scripts
- 10,000 visit rolling window (auto-cleanup)
- `analytics.json` excluded from git (`.gitignore`)

## 📁 Project Structure

```
PUBG_TRACKER/
├── .github/workflows/
│   ├── fetch-pubg-data.yml    # Automated data collection (4x daily)
│   └── deploy-static.yml      # FTP deployment automation
├── public/
│   └── chart.js               # Chart.js library (vendored)
├── index.html                 # Main dashboard (128 KB)
├── game.html                  # 2D Runner mini game (62 KB)
├── gamebr.html                # Battle Royale mini game (70 KB)
├── analytics.html             # Analytics dashboard (static)
├── server.js                  # Express server with analytics (11 KB)
├── PUBG.JS                    # PUBG API data fetcher (21 KB)
├── package.json               # Node.js dependencies
├── data.json                  # Combined team match data
├── data_*.json                # Individual player statistics
├── last-sync.json             # Last sync timestamp
├── analytics.json             # Visitor analytics (local only, gitignored)
└── README.md                  # This file
```

## 🎨 Customization

### **Add More Players**
Edit `PUBG.JS`:
```javascript
const PLAYERS = [
  { name: 'PlayerName1', apiName: 'PlayerName1' },
  { name: 'PlayerName2', apiName: 'PlayerName2' },
  // Add more...
];
```

### **Change Sync Schedule**
Edit `.github/workflows/fetch-pubg-data.yml`:
```yaml
schedule:
  - cron: '0 20,21,22,23 * * *'  # Modify times (UTC format)
```

### **Customize Deployment**
Edit `.github/workflows/deploy-static.yml`:
- Change FTP server/credentials
- Add/remove files to deploy
- Modify `.htaccess` configuration

### **Add Memes/Records**
Edit `index.html`:
- Search for `showMemesDashboard()` function
- Search for `showTeamRecords()` function
- Add your custom content

## 🤝 Contributing

This is a personal team project, but feel free to:
- Fork for your own PUBG team tracking
- Submit bug reports via GitHub Issues
- Share improvements via Pull Requests
- Use as a template for other game trackers

## 📜 License

MIT License - Free to use, modify, and distribute

## 🎯 Credits

Created by **Kilma9** for the PUBG squad:
- Kilma9
- Mar-0
- Hyottokko
- Baron_Frajeris
- codufus
- Veru_13

**Special Thanks:**
- PUBG Corporation for the Developer API
- Chart.js team for visualization library
- GitHub Actions for free CI/CD automation
- Webzdarma.cz for free hosting

---

**Live Demo**: [kilma-pubg.wz.cz:8080](http://kilma-pubg.wz.cz:8080/)

**GitHub**: [Kilma9/PUBG_TRACKERT](https://github.com/Kilma9/PUBG_TRACKERT)

*Last Updated: October 27, 2025 - Mini Game v0.2 (Battle Royale) 🎮*
