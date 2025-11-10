const axios = require('axios');
const fs = require('fs');

// Use environment variable for API key
const API_KEY = process.env.PUBG_API_KEY;

if (!API_KEY) {
  console.error('❌ ERROR: PUBG_API_KEY environment variable is not set!');
  process.exit(1);
}

const PLAYERS = [
  'Kilma9',
  'Mar-0', 
  'Hyottokko',
  'Baron_Frajeris',
  'codufus',
  'Veru_13'
];

const PLATFORM = process.env.PLATFORM || 'steam';

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/vnd.api+json'
};

async function getPlayerId(playerName) {
  console.log(`🔍 Looking up player: ${playerName}`);
  const url = `https://api.pubg.com/shards/${PLATFORM}/players?filter[playerNames]=${playerName}`;
  const response = await axios.get(url, { headers });
  console.log(`✅ Player found successfully`);
  
  // Add delay after API call to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return response.data.data[0].id;
}

async function getSeasons() {
  console.log(`📅 Fetching available seasons...`);
  const url = `https://api.pubg.com/shards/${PLATFORM}/seasons`;
  const response = await axios.get(url, { headers });
  const seasons = response.data.data;
  console.log(`✅ Found ${seasons.length} seasons`);
  
  // Find current season (isCurrentSeason: true)
  const currentSeason = seasons.find(s => s.attributes.isCurrentSeason);
  
  if (currentSeason) {
    console.log(`🎯 Current season: ${currentSeason.id}`);
  }
  
  return { all: seasons, current: currentSeason };
}

async function getPlayerSeasonStats(playerId, seasonId) {
  console.log(`📊 Fetching season stats for season: ${seasonId}`);
  const url = `https://api.pubg.com/shards/${PLATFORM}/players/${playerId}/seasons/${seasonId}`;
  
  try {
    const response = await axios.get(url, { headers });
    const stats = response.data.data.attributes;
    
    console.log(`✅ Season stats retrieved`);
    
    // Add delay after API call to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      gameModeStats: stats.gameModeStats,
      rankedGameModeStats: stats.rankedGameModeStats || {},
      seasonId: seasonId
    };
  } catch (error) {
    console.error(`❌ Error fetching season stats:`, error.message);
    if (error.response?.status === 404) {
      console.log(`⚠️ No stats found for this season - player may not have played`);
    }
    return null;
  }
}

async function collectCareerStats() {
  console.log(`🚀 PUBG Career Stats Collection`);
  console.log(`📊 Players: ${PLAYERS.join(', ')}\n`);
  
  const allPlayerStats = {};
  
  // Empty stats template for players with no season activity
  const emptyStats = {
    gameModeStats: {},
    rankedGameModeStats: {},
    seasonId: null
  };
  
  try {
    // Get seasons
    const { all: allSeasons, current: currentSeason } = await getSeasons();
    
    if (!currentSeason) {
      console.error('❌ No current season found!');
      return;
    }
    
    console.log(`\n🎯 Collecting stats for current season: ${currentSeason.id}\n`);
    
    // Collect stats for each player
    for (const playerName of PLAYERS) {
      console.log(`\n👤 Processing ${playerName}...`);
      
      try {
        const playerId = await getPlayerId(playerName);
        const seasonStats = await getPlayerSeasonStats(playerId, currentSeason.id);
        
        // Include player even if no season stats (with empty stats)
        allPlayerStats[playerName] = {
          playerId: playerId,
          currentSeason: currentSeason.id,
          stats: seasonStats || emptyStats
        };
        
        if (seasonStats) {
          // Log summary
          const squadFpp = seasonStats.gameModeStats['squad-fpp'];
          if (squadFpp && squadFpp.roundsPlayed > 0) {
            console.log(`📈 Squad FPP Stats:`);
            console.log(`   • Matches: ${squadFpp.roundsPlayed}`);
            console.log(`   • Wins: ${squadFpp.wins} (${(squadFpp.wins / squadFpp.roundsPlayed * 100).toFixed(1)}%)`);
            console.log(`   • Top 10s: ${squadFpp.top10s} (${(squadFpp.top10s / squadFpp.roundsPlayed * 100).toFixed(1)}%)`);
            console.log(`   • Kills: ${squadFpp.kills}`);
            console.log(`   • K/D Ratio: ${(squadFpp.kills / Math.max(squadFpp.losses, 1)).toFixed(2)}`);
            console.log(`   • Avg Damage: ${Math.round(squadFpp.damageDealt / squadFpp.roundsPlayed)}`);
          } else {
            console.log(`ℹ️ No squad-fpp matches this season`);
          }
        } else {
          console.log(`ℹ️ No season stats available - player added with empty stats`);
        }
        
        // Delay between players to respect API rate limits
        if (PLAYERS.indexOf(playerName) < PLAYERS.length - 1) {
          console.log(`⏸️ Pausing 5 seconds before next player...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${playerName}:`, error.message);
        // Still add player with empty stats even if there's an error
        allPlayerStats[playerName] = {
          playerId: 'unknown',
          currentSeason: currentSeason.id,
          stats: emptyStats,
          error: error.message
        };
        console.log(`⚠️ Player added with empty stats due to error`);
        continue;
      }
    }
    
    // Save to file
    const outputData = {
      collectedAt: new Date().toISOString(),
      currentSeason: currentSeason.id,
      seasonName: currentSeason.attributes.isOffseason ? 'Off-Season' : currentSeason.id,
      players: allPlayerStats
    };
    
    fs.writeFileSync('career_stats.json', JSON.stringify(outputData, null, 2));
    
    console.log(`\n💾 Career stats saved to career_stats.json`);
    console.log(`✅ Collection completed successfully!`);
    
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run collection
collectCareerStats();
