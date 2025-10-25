# PUBG Tracker - Data Management Guide

## 🔄 Data Collection Modes

The system now operates in two modes:

### 1. **Initial/Full Collection** (30 days)
- Runs when no existing data is found
- Collects up to 100 matches per player (within 30 days)
- Takes ~5-10 minutes for all 6 players

### 2. **Incremental Collection** (lightweight)
- Runs when existing data is found
- Only collects NEW matches since last collection
- Stops when it reaches already-collected matches
- Takes ~1-2 minutes for all 6 players
- Processes max 20 new matches per run

## 🚀 Quick Start Scripts

### Full Data Refresh (30 days)
```powershell
.\full-refresh.bat
```
This will:
1. Archive all existing data to `backups_archive/`
2. Delete current data files
3. Collect fresh data from last 30 days for all 6 players

### Quick Incremental Update (single player)
```powershell
.\quick-update.bat
```
- Prompts for player name (defaults to Kilma9)
- Only collects NEW matches
- Fast and lightweight

### Manual Collection
```powershell
# Collect for specific player
node PUBG.JS Kilma9
node PUBG.JS Mar-0

# Collect for all players (local development)
node PUBG.JS
```

## 📊 Data Files

### Active Data Files (30-day rolling window)
- `data.json` - Kilma9's matches
- `data_Mar-0.json` - Mar-0's matches
- `data_Hyottokko.json` - Hyottokko's matches
- `data_Baron_Frajeris.json` - Baron_Frajeris's matches
- `data_codufus.json` - codufus's matches
- `data_Veru_13.json` - Veru_13's matches

### Archives
- `backups_archive/` - Old data backups (created during flush)
- `data_backup_*.json` - Timestamped backups (created on new data)

## ⚙️ GitHub Actions (Automated)

### Current Schedule
- **8 PM Prague time** (18:00 UTC)
- **9 PM Prague time** (19:00 UTC)
- **10 PM Prague time** (20:00 UTC)

### What Happens
1. Checks for NEW matches only (incremental)
2. Updates data files
3. Commits to repository
4. Deploys to webzdarma.cz

### Manual Trigger
Go to: [GitHub Actions](https://github.com/Kilma9/PUBG_TRACKERT/actions)
- Click "Scheduled PUBG Data Collection"
- Click "Run workflow"

## 🎯 Best Practices

### When to Use Full Refresh
- Starting fresh
- After being offline for multiple days
- Data corruption or errors
- Want to change rolling window period

### When to Use Incremental
- Daily updates
- Testing after playing matches
- Checking latest stats
- Automated scheduled runs

## 🔧 Configuration

### Collection Limits (in PUBG.JS)
```javascript
// Initial collection: 100 matches max
if (isInitialCollection && processedCount >= 100)

// Incremental: 20 matches max
if (!isInitialCollection && processedCount >= 20)
```

### Rolling Window
- Default: **30 days**
- Adjustable in PUBG.JS: `thirtyDaysAgo.setDate(...)` 

### API Rate Limiting
- 30-second delay between players
- 2-second pause every 5 matches
- Automatic retry on rate limit (429)

## 📈 Efficiency Gains

### Before (Full Collection Every Time)
- Time: ~10 minutes
- API calls: ~600-1200 per run
- Data processed: All matches

### After (Incremental)
- Time: ~1-2 minutes
- API calls: ~60-120 per run
- Data processed: Only new matches
- **Savings: ~80-90% reduction**

## 🛠️ Troubleshooting

### "No new matches found"
✅ This is normal if you haven't played since last collection

### Rate limit errors (429)
- Wait 1-2 minutes
- Script will auto-retry
- Use manual collection for single players

### Missing player data
```powershell
# Re-collect for specific player
node PUBG.JS PlayerName
```

### Want to reset everything
```powershell
# Full flush and refresh
.\full-refresh.bat
```

## 📅 Data Retention

- **Active data**: Last 30 days
- **Older matches**: Auto-removed from active files
- **Backups**: Kept in `backups_archive/` indefinitely
- **Can change retention**: Edit `thirtyDaysAgo.setDate()` in PUBG.JS

## 🔍 Monitoring

Check collection status:
```powershell
# View latest match for each player
node -e "console.log(require('./data.json')[0].date)"
node -e "console.log(require('./data_Mar-0.json')[0].date)"

# Count matches per player
node -e "console.log('Kilma9:', require('./data.json').length)"
```

---

**Last Updated**: 2025-10-25
**System Version**: 2.0 (Incremental Collection)
