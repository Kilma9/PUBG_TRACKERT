# 🤖 Automated PUBG Data Collection Setup

Your PUBG Tracker now supports **automated daily data collection** using GitHub Actions!

## 🔧 Setup Required

### 1. Add Repository Secret

Add this secret in your GitHub repository settings:

- **`PUBG_API_KEY`**: Your PUBG API key
  - Go to: Repository Settings → Secrets and variables → Actions
  - Click "New repository secret"
  - Name: `PUBG_API_KEY`
  - Value: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...` (your full API key)

## ⏰ Schedule Configuration

The workflow is currently set to run **3 times every evening**:
- **20:00 Prague time** (18:00 UTC) - 8 PM
- **21:00 Prague time** (19:00 UTC) - 9 PM  
- **22:00 Prague time** (20:00 UTC) - 10 PM

This ensures fresh data capture throughout your evening gaming sessions!

### Modify Schedule
To change the schedule, edit `.github/workflows/scheduled-data-collection.yml`:

```yaml
schedule:
  - cron: '0 18 * * *'  # 20:00 Prague time
  - cron: '0 19 * * *'  # 21:00 Prague time
  - cron: '0 20 * * *'  # 22:00 Prague time
  
# Examples for other times:
  - cron: '0 17 * * *'  # 19:00 Prague time
  - cron: '0 21 * * *'  # 23:00 Prague time
  - cron: '0 19 * * 1-5'  # 21:00 Prague time, Monday-Friday only
```

## 🎮 What It Does

### Automatic Collection:
1. **Fetches latest PUBG matches** for Kilma9
2. **Updates data.json** with new match data
3. **Creates backups** of previous data
4. **Commits changes** to your repository
5. **Deploys to webzdarma.cz** automatically

### Manual Triggering:
- Go to: Repository → Actions → "Scheduled PUBG Data Collection"
- Click "Run workflow"
- Optionally specify days to collect (default: 1)

## 📊 Benefits

### ✅ **Always Fresh Data**
- Dashboard updates automatically every evening
- No need to manually run `node PUBG.JS`
- Perfect for daily team performance tracking

### ✅ **Zero Maintenance**
- Runs in the cloud (free GitHub Actions)
- Automatic error handling and notifications
- Backup creation for data safety

### ✅ **Live Dashboard**
- http://kilma-pubg.wz.cz:8080/ always has latest stats
- Team members can check stats anytime
- Perfect for post-match analysis

## 🔍 Monitoring

### Check Workflow Status:
1. Go to your repository on GitHub
2. Click "Actions" tab
3. See "Scheduled PUBG Data Collection" runs

### Logs Include:
- ✅ Number of matches collected
- 📊 Players found in matches
- ⏰ Collection timestamp
- 🚀 Deployment status

## 🛠️ Troubleshooting

### Common Issues:

**❌ API Key Invalid**
- Check `PUBG_API_KEY` secret is correct
- Verify API key hasn't expired

**❌ No New Data**
- Normal if no matches played that day
- Check if player name is correct

**❌ Deployment Failed**
- Verify webzdarma.cz FTP credentials
- Check FTP server connectivity

## 🎯 Advanced Configuration

### Collect Multiple Days:
```yaml
# In workflow file, change the default days
days_to_collect:
  default: '3'  # Collect last 3 days
```

### Different Player:
```yaml
env:
  PLAYER_NAME: 'YourPlayerName'  # Change from Kilma9
```

### Multiple Players:
You could modify the script to collect data for all team members by adding multiple player names.

---

**🚀 Your PUBG Tracker is now fully automated!** 

Every evening, fresh match data will be automatically collected and your dashboard updated. Perfect for tracking team performance over time! 🎮✨