const axios = require('axios');

// Use environment variable for API key (set via GitHub Secrets or local .env)
const API_KEY = process.env.PUBG_API_KEY;

if (!API_KEY) {
  console.error('❌ ERROR: PUBG_API_KEY environment variable is not set!');
  console.error('');
  console.error('For local development:');
  console.error('  Set environment variable: export PUBG_API_KEY="your-api-key-here"');
  console.error('  Or create .env file with: PUBG_API_KEY=your-api-key-here');
  console.error('');
  console.error('For GitHub Actions:');
  console.error('  Add PUBG_API_KEY to repository secrets');
  console.error('  Settings → Secrets and variables → Actions → New repository secret');
  process.exit(1);
}

// Multi-player configuration
const PLAYERS = [
  'Kilma9',
  'Mar-0', 
  'Hyottokko',
  'Baron_Frajeris',
  'codufus',
  'Veru_13'
];

// Get target player from command line argument, environment variable, or default to 'Kilma9'
const TARGET_PLAYER = process.argv[2] || process.env.PLAYER_NAME || 'Kilma9';
const PLATFORM = process.env.PLATFORM || 'steam';

// Check if running in cloud environment
const IS_CLOUD = process.env.GITHUB_ACTIONS === 'true';

console.log(`🔧 Environment: ${IS_CLOUD ? 'GitHub Actions (Cloud)' : 'Local Development'}`);
console.log(`🎮 Target Player: ${TARGET_PLAYER}`);
console.log(`👥 All Players: ${PLAYERS.join(', ')}`);
console.log(`🖥️ Platform: ${PLATFORM}`);

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/vnd.api+json'
};

async function getPlayerId(playerName) {
  console.log(`🔍 Looking up player: ${playerName}`);
  const url = `https://api.pubg.com/shards/${PLATFORM}/players?filter[playerNames]=${playerName}`;
  try {
    const response = await axios.get(url, { headers });
    console.log(`✅ Player found successfully`);
    return response.data.data[0].id;
  } catch (error) {
    console.error(`❌ Error finding player:`, error.message);
    throw error;
  }
}

async function getMatchHistory(playerId) {
  console.log(`📋 Fetching match history for player ID: ${playerId}`);
  const url = `https://api.pubg.com/shards/${PLATFORM}/players/${playerId}`;
  try {
    const response = await axios.get(url, { headers });
    const matches = response.data.data.relationships.matches.data;
    console.log(`✅ Found ${matches.length} recent matches`);
    return matches.map(match => match.id);
  } catch (error) {
    console.error(`❌ Error fetching match history:`, error.message);
    throw error;
  }
}

async function getMatchDetails(matchId, targetPlayerName) {
  const url = `https://api.pubg.com/shards/${PLATFORM}/matches/${matchId}`;
  const response = await axios.get(url, { headers });
  const match = response.data;

  const matchInfo = match.data.attributes;
  console.log(`\n📍 Match ${matchId}`);
  console.log(`- Map: ${matchInfo.mapName}`);
  console.log(`- Mode: ${matchInfo.gameMode}`);
  console.log(`- Duration: ${matchInfo.duration} seconds`);
  console.log(`- Started at: ${matchInfo.createdAt}`);

  const playerParticipant = match.included.find(item =>
    item.type === 'participant' &&
    item.attributes.stats.name === targetPlayerName
  );
  if (!playerParticipant) {
    console.log(`❌ ${targetPlayerName} not found in match ${matchId}`);
    return null;
  }

  const playerId = playerParticipant.id;

  const playerRoster = match.included.find(item =>
    item.type === 'roster' &&
    item.relationships.participants.data.some(p => p.id === playerId)
  );
  if (!playerRoster) {
    console.log(`❌ ${targetPlayerName}'s team not found`);
    return null;
  }

  const teamRank = playerRoster.attributes.stats.rank;
  console.log(`🏅 Team Placement: ${teamRank}`);
  console.log(`👥 Team Members:`);

  const telemetryAsset = match.included.find(item => item.type === 'asset');
  const telemetryUrl = telemetryAsset?.attributes.URL;
  let telemetryData = [];

  if (telemetryUrl) {
    try {
      const telemetryResponse = await axios.get(telemetryUrl);
      telemetryData = telemetryResponse.data;
      console.log(`📡 Telemetry data loaded: ${telemetryData.length} events`);
      
      // Debug: Show available event types
      const eventTypes = [...new Set(telemetryData.map(event => event._T))];
      console.log(`📊 Available event types:`, eventTypes.slice(0, 10).join(', '), eventTypes.length > 10 ? '...' : '');
    } catch (error) {
      console.log(`⚠️ Failed to fetch telemetry for match ${matchId}:`, error.message);
    }
  } else {
    console.log(`⚠️ No telemetry URL found for match ${matchId}`);
  }

  const teamSummary = [];

  for (const participantRef of playerRoster.relationships.participants.data) {
    const teammate = match.included.find(item =>
      item.type === 'participant' && item.id === participantRef.id
    );
    if (teammate) {
      const stats = teammate.attributes.stats;
      console.log(`- ${stats.name}: ${stats.kills} kills (${stats.headshotKills} headshots), ${stats.damageDealt} dmg, ${stats.heals} heals, ${stats.revives} revives, ${stats.assists} assists, place ${stats.winPlace}, survived ${stats.timeSurvived}s`);

      // Enhanced weapon statistics collection
      const weaponKills = {};
      const weaponDamage = {};
      const weaponStats = {
        totalShots: 0,
        totalHits: 0,
        longestKill: 0,
        vehicleDestroys: 0
      };

      // Collect kill events with detailed weapon info
      const killEvents = telemetryData.filter(event =>
        event._T === 'LogPlayerKill' &&
        event.killer &&
        event.killer.name &&
        event.killer.name.toLowerCase() === stats.name.toLowerCase()
      );
      
      console.log(`🎯 Found ${killEvents.length} kill events for ${stats.name}`);
      
      // If no telemetry data, try to extract basic weapon info from API stats
      if (telemetryData.length === 0 && stats.kills > 0) {
        console.log(`⚠️ No telemetry data, using fallback weapon detection`);
        // Fallback: assume primary weapons for kills when no telemetry
        weaponKills['Unknown Weapon'] = stats.kills;
      }

      // Collect damage events for weapon damage tracking
      const damageEvents = telemetryData.filter(event =>
        event._T === 'LogPlayerTakeDamage' &&
        event.attacker &&
        event.attacker.name &&
        event.attacker.name.toLowerCase() === stats.name.toLowerCase()
      );

      // Collect weapon fire events for accuracy stats
      const weaponFireEvents = telemetryData.filter(event =>
        (event._T === 'LogWeaponFireCount' || event._T === 'LogPlayerAttack') &&
        event.character &&
        event.character.name &&
        event.character.name.toLowerCase() === stats.name.toLowerCase()
      );

      // Process kill events
      for (const kill of killEvents) {
        console.log(`🔫 Kill event:`, {
          damageCauserName: kill.damageCauserName,
          damageTypeCategory: kill.damageTypeCategory,
          distance: kill.distance
        });
        
        let weapon = kill.damageCauserName || kill.damageTypeCategory || 'Unknown';
        
        // Clean up weapon names
        const originalWeapon = weapon;
        weapon = weapon.replace(/^Weapon_|^Item_/, '').replace(/_C$/, '');
        weapon = weapon.replace(/([A-Z])/g, ' $1').trim();
        
        console.log(`🔧 Weapon name: "${originalWeapon}" -> "${weapon}"`);
        
        if (!weaponKills[weapon]) weaponKills[weapon] = 0;
        weaponKills[weapon]++;

        // Track longest kill distance
        if (kill.distance && kill.distance > weaponStats.longestKill) {
          weaponStats.longestKill = Math.round(kill.distance);
        }
      }

      // Process damage events for weapon damage stats
      for (const damage of damageEvents) {
        let weapon = damage.damageCauserName || damage.damageTypeCategory || 'Unknown';
        weapon = weapon.replace(/^Weapon_|^Item_/, '').replace(/_C$/, '');
        weapon = weapon.replace(/([A-Z])/g, ' $1').trim();
        
        if (!weaponDamage[weapon]) weaponDamage[weapon] = 0;
        weaponDamage[weapon] += damage.damage || 0;
      }

      // Count total shots/hits for accuracy (approximation)
      weaponStats.totalShots = weaponFireEvents.length;
      weaponStats.totalHits = damageEvents.length;

      // Vehicle destroy tracking
      const vehicleDestroys = telemetryData.filter(event =>
        event._T === 'LogVehicleDestroy' &&
        event.attacker &&
        event.attacker.name &&
        event.attacker.name.toLowerCase() === stats.name.toLowerCase()
      );
      weaponStats.vehicleDestroys = vehicleDestroys.length;

      // Enhanced logging with more weapon details
      if (killEvents.length > 0 || Object.keys(weaponDamage).length > 0) {
        console.log(`  🔫 Weapon Statistics:`);
        
        if (Object.keys(weaponKills).length > 0) {
          console.log(`    Kills by weapon:`);
          Object.entries(weaponKills).forEach(([weapon, count]) => {
            console.log(`      - ${weapon}: ${count} kills`);
          });
        }
        
        if (Object.keys(weaponDamage).length > 0) {
          console.log(`    Damage by weapon:`);
          Object.entries(weaponDamage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Top 5 weapons by damage
            .forEach(([weapon, damage]) => {
              console.log(`      - ${weapon}: ${Math.round(damage)} dmg`);
            });
        }
        
        if (weaponStats.longestKill > 0) {
          console.log(`    Longest kill: ${weaponStats.longestKill}m`);
        }
        
        if (weaponStats.totalShots > 0) {
          const accuracy = ((weaponStats.totalHits / weaponStats.totalShots) * 100).toFixed(1);
          console.log(`    Estimated accuracy: ${accuracy}% (${weaponStats.totalHits}/${weaponStats.totalShots})`);
        }
        
        if (weaponStats.vehicleDestroys > 0) {
          console.log(`    Vehicle destroys: ${weaponStats.vehicleDestroys}`);
        }
      }

      teamSummary.push({
        name: stats.name,
        kills: stats.kills,
        damage: stats.damageDealt,
        headshots: stats.headshotKills,
        weapons: weaponKills,
        weaponDamage: weaponDamage,
        weaponKills: weaponKills, // Explicitly add weaponKills for clarity
        weaponStats: weaponStats,
        // Additional stats from PUBG API
        assists: stats.assists || 0,
        boosts: stats.boosts || 0,
        heals: stats.heals || 0,
        revives: stats.revives || 0,
        teamKills: stats.teamKills || 0,
        timeSurvived: stats.timeSurvived || 0,
        walkDistance: stats.walkDistance || 0,
        rideDistance: stats.rideDistance || 0,
        swimDistance: stats.swimDistance || 0
      });
    }
  }

  // Parse game mode to determine type and perspective
  const gameMode = matchInfo.gameMode;
  const isRanked = gameMode.includes('ranked');
  
  // Enhanced arcade mode detection - check for various arcade mode patterns
  const isArcade = gameMode.includes('arcade') || 
                   gameMode.includes('event') || 
                   gameMode.includes('custom') ||
                   gameMode.includes('war-') || 
                   gameMode.includes('zombie') || 
                   gameMode.includes('tdm') || 
                   gameMode.includes('conquest') || 
                   gameMode.includes('training') || 
                   gameMode.includes('lab-') ||
                   gameMode.includes('esports') ||
                   gameMode.startsWith('arcade') ||
                   gameMode.includes('mini-') ||
                   gameMode.includes('fantasy');
                   
  const isNormal = !isRanked && !isArcade;
  
  // Debug: Log the game mode for analysis
  console.log(`🎮 Game Mode Analysis: "${gameMode}" -> Type: ${isRanked ? 'ranked' : isArcade ? 'arcade' : 'normal'}`);
  
  // Determine team size
  let teamSize = 'solo';
  if (gameMode.includes('duo')) teamSize = 'duo';
  else if (gameMode.includes('squad')) teamSize = 'squad';
  
  // Determine perspective
  const perspective = gameMode.includes('-fpp') ? 'fpp' : 'tpp';
  
  return {
    date: matchInfo.createdAt,
    gameMode: gameMode,
    gameType: isRanked ? 'ranked' : isArcade ? 'arcade' : 'normal',
    teamSize: teamSize,
    perspective: perspective,
    mapName: matchInfo.mapName,
    duration: matchInfo.duration,
    placement: teamRank,
    team: teamSummary
  };
}

function summarizeTeamStatsByDay(matchSummaries) {
  const dailyStats = {};

  for (const summary of matchSummaries) {
    const date = summary.date.split('T')[0];
    if (!dailyStats[date]) dailyStats[date] = {};

    for (const player of summary.team) {
      if (!dailyStats[date][player.name]) {
        dailyStats[date][player.name] = {
          kills: 0,
          damage: 0,
          headshots: 0,
          weapons: {},
          weaponDamage: {},
          weaponKills: {}, // Add weaponKills tracking
          assists: 0,
          boosts: 0,
          heals: 0,
          revives: 0,
          totalDistance: 0,
          longestKill: 0,
          vehicleDestroys: 0,
          matches: 0
        };
      }

      dailyStats[date][player.name].kills += player.kills;
      dailyStats[date][player.name].damage += player.damage;
      dailyStats[date][player.name].headshots += player.headshots;
      dailyStats[date][player.name].assists += player.assists || 0;
      dailyStats[date][player.name].boosts += player.boosts || 0;
      dailyStats[date][player.name].heals += player.heals || 0;
      dailyStats[date][player.name].revives += player.revives || 0;
      dailyStats[date][player.name].totalDistance += (player.walkDistance + player.rideDistance + player.swimDistance) || 0;
      dailyStats[date][player.name].matches += 1;

      // Track longest kill
      if (player.weaponStats && player.weaponStats.longestKill > dailyStats[date][player.name].longestKill) {
        dailyStats[date][player.name].longestKill = player.weaponStats.longestKill;
      }

      // Aggregate vehicle destroys
      if (player.weaponStats) {
        dailyStats[date][player.name].vehicleDestroys += player.weaponStats.vehicleDestroys || 0;
      }

      // Aggregate weapon kills
      for (const [weapon, count] of Object.entries(player.weapons || {})) {
        if (!dailyStats[date][player.name].weapons[weapon]) {
          dailyStats[date][player.name].weapons[weapon] = 0;
        }
        dailyStats[date][player.name].weapons[weapon] += count;
      }
      
      // Aggregate weaponKills (same as weapons for backward compatibility)
      for (const [weapon, count] of Object.entries(player.weaponKills || player.weapons || {})) {
        if (!dailyStats[date][player.name].weaponKills[weapon]) {
          dailyStats[date][player.name].weaponKills[weapon] = 0;
        }
        dailyStats[date][player.name].weaponKills[weapon] += count;
      }

      // Aggregate weapon damage
      for (const [weapon, damage] of Object.entries(player.weaponDamage || {})) {
        if (!dailyStats[date][player.name].weaponDamage[weapon]) {
          dailyStats[date][player.name].weaponDamage[weapon] = 0;
        }
        dailyStats[date][player.name].weaponDamage[weapon] += damage;
      }
    }
  }

  for (const [date, players] of Object.entries(dailyStats)) {
    console.log(`\n📅 Full Summary for ${date}`);

    const killTable = Object.entries(players)
      .map(([name, stats]) => ({ name, kills: stats.kills }))
      .sort((a, b) => b.kills - a.kills);

    const damageTable = Object.entries(players)
      .map(([name, stats]) => ({ name, damage: stats.damage }))
      .sort((a, b) => b.damage - a.damage);

    console.log(`\n🥇 Kill Standings:`);
    killTable.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} — ${p.kills} kills`);
    });

    console.log(`\n💥 Damage Standings:`);
    damageTable.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} — ${p.damage} dmg`);
    });

    console.log(`\n🎯 Headshot Totals:`);
    Object.entries(players).forEach(([name, stats]) => {
      console.log(`- ${name}: ${stats.headshots} headshots`);
    });

    console.log(`\n🔫 Weapon Kill Breakdown:`);
    Object.entries(players).forEach(([name, stats]) => {
      console.log(`- ${name}:`);
      const sortedWeapons = Object.entries(stats.weapons).sort((a, b) => b[1] - a[1]);
      if (sortedWeapons.length === 0) {
        console.log(`    • No weapon kills recorded`);
      } else {
        sortedWeapons.forEach(([weapon, count]) => {
          console.log(`    • ${weapon}: ${count} kills`);
        });
      }
    });

    console.log(`\n💥 Weapon Damage Breakdown:`);
    Object.entries(players).forEach(([name, stats]) => {
      console.log(`- ${name}:`);
      const sortedWeaponDamage = Object.entries(stats.weaponDamage).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (sortedWeaponDamage.length === 0) {
        console.log(`    • No weapon damage recorded`);
      } else {
        sortedWeaponDamage.forEach(([weapon, damage]) => {
          console.log(`    • ${weapon}: ${Math.round(damage)} damage`);
        });
      }
    });

    console.log(`\n🎯 Additional Stats:`);
    Object.entries(players).forEach(([name, stats]) => {
      console.log(`- ${name}:`);
      console.log(`    • Assists: ${stats.assists}, Heals: ${stats.heals}, Revives: ${stats.revives}`);
      console.log(`    • Distance: ${Math.round(stats.totalDistance)}m, Longest kill: ${stats.longestKill}m`);
      if (stats.vehicleDestroys > 0) {
        console.log(`    • Vehicle destroys: ${stats.vehicleDestroys}`);
      }
      console.log(`    • Matches played: ${stats.matches}`);
    });
  }
}

// Function to collect data for a specific player
async function collectPlayerData(playerName) {
  try {
    console.log(`\n🎮 Starting PUBG data collection for ${playerName}`);
    console.log(`📊 Mode: Incremental data collection with full history preservation`);
    
    const playerId = await getPlayerId(playerName);
    console.log(`👤 Player ID: ${playerId}`);

    // Load existing data to find the latest match timestamp
    const fs = require('fs');
    let existingMatches = [];
    let latestMatchDate = null;
    
    const dataFile = playerName === 'Kilma9' ? 'data.json' : `data_${playerName}.json`;
    
    if (fs.existsSync(dataFile)) {
      try {
        existingMatches = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        console.log(`📂 Loaded ${existingMatches.length} existing matches from ${dataFile}`);
        
        if (existingMatches.length > 0) {
          // Find the most recent match date
          latestMatchDate = new Date(existingMatches[0].date);
          console.log(`📅 Latest existing match: ${latestMatchDate.toISOString()}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not load existing data.json: ${error.message}`);
        console.log(`📥 Starting fresh data collection...`);
      }
    } else {
      console.log(`📋 No existing data.json found, starting fresh collection`);
    }

    const matchIds = await getMatchHistory(playerId);
    console.log(`📋 Total available matches from API: ${matchIds.length}`);

    const newMatches = [];
    const seasonStartDate = new Date('2025-09-01T00:00:00Z');
    
    // Determine collection mode
    const isInitialCollection = existingMatches.length === 0;
    const collectionMode = isInitialCollection ? 'FULL (since Sept 1, 2025)' : 'INCREMENTAL (new matches only)';
    
    console.log(`📅 Collection Mode: ${collectionMode}`);
    console.log(`📅 Looking for matches since: ${latestMatchDate ? latestMatchDate.toISOString() : 'September 1, 2025'}`);
    console.log(`📅 Season start cutoff: ${seasonStartDate.toISOString()}`);
    
    let processedCount = 0;
    let newMatchesCount = 0;
    
    // Process matches - only new ones if we have existing data
    for (const matchId of matchIds) {
      console.log(`\n🔄 Processing match ${processedCount + 1}/${matchIds.length}...`);
      
      try {
        const summary = await getMatchDetails(matchId, playerName);
        
        if (summary) {
          const matchDate = new Date(summary.date);
          
          // Skip if this match already exists (but continue checking remaining matches)
          if (latestMatchDate && matchDate <= latestMatchDate) {
            console.log(`⏭️ Match already exists (${matchDate.toISOString().split('T')[0]}), skipping this match...`);
            continue; // Skip this match but keep processing - API order may not be perfectly chronological
          }
          
          // Check if match is since September 1, 2025
          if (matchDate >= seasonStartDate) {
            // Filter for Squad FPP only
            if (summary.gameMode === 'squad-fpp') {
              newMatches.push(summary);
              newMatchesCount++;
              console.log(`✅ New match added (${newMatchesCount} total new matches, ${matchDate.toISOString().split('T')[0]})`);
            } else {
              console.log(`⏭️ Skipping non-Squad FPP match (${summary.gameMode})...`);
            }
          } else {
            console.log(`⏰ Match too old (${matchDate.toISOString().split('T')[0]}), stopping collection`);
            break; // Stop processing older matches
          }
        } else {
          console.log(`❌ Failed to process match or player not found`);
        }
        
        processedCount++;
        
        // Add delay to respect API rate limits (avoid hitting rate limits)
        if (processedCount % 5 === 0) {
          console.log(`⏸️ Taking a short break to respect API limits...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause every 5 matches
        }
        
        // Safety limit to avoid processing too many matches
        if (isInitialCollection && processedCount >= 100) {
          console.log(`⚠️ Reached safety limit of 100 matches for initial collection`);
          break;
        } else if (!isInitialCollection && processedCount >= 20) {
          console.log(`⚠️ Reached safety limit of 20 matches for incremental collection`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ Error processing match ${matchId}:`, error.message);
        // Continue with next match instead of stopping
        processedCount++;
        continue;
      }
    }

    console.log(`\n📊 Collection Summary:`);
    console.log(`   • Total matches processed: ${processedCount}`);
    console.log(`   • New matches found: ${newMatchesCount}`);
    console.log(`   • Existing matches preserved: ${existingMatches.length}`);

    // Merge new matches with existing ones (new matches first, then existing)
    const allMatches = [...newMatches, ...existingMatches];
    
    // Remove matches older than September 1, 2025 from the combined dataset
    const seasonMatches = allMatches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= seasonStartDate;
    });

    console.log(`   • Total matches after merge: ${allMatches.length}`);
    console.log(`   • Matches since Sept 1, 2025: ${seasonMatches.length}`);
    console.log(`   • Date range: ${allMatches.length > 0 ? 
      `${new Date(allMatches[allMatches.length - 1].date).toISOString().split('T')[0]} to ${new Date(allMatches[0].date).toISOString().split('T')[0]}` : 
      'No matches found'}`);

    if (newMatchesCount > 0 || existingMatches.length > 0) {
      if (newMatchesCount > 0) {
        console.log(`\n📈 Generating daily summaries for all ${seasonMatches.length} matches...`);
        summarizeTeamStatsByDay(seasonMatches);
      } else {
        console.log(`\n📋 No new matches found, keeping existing data intact`);
      }

      // ✅ Save to local file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      
      // Save main data file (since September 1, 2025)
      fs.writeFileSync(dataFile, JSON.stringify(seasonMatches, null, 2));
      
      console.log(`\n💾 File saved:`);
      console.log(`   • ${dataFile} (${seasonMatches.length} matches - since Sept 1, 2025)`);
      
      // Generate summary statistics
      const uniqueDays = [...new Set(seasonMatches.map(m => m.date.split('T')[0]))];
      const totalKills = seasonMatches.reduce((sum, match) => 
        sum + match.team.reduce((teamSum, player) => teamSum + (player.kills || 0), 0), 0);
      const totalDamage = seasonMatches.reduce((sum, match) => 
        sum + match.team.reduce((teamSum, player) => teamSum + (player.damage || 0), 0), 0);
      
      console.log(`\n🎯 Season Performance Summary (since Sept 1, 2025):`);
      console.log(`   • Days with matches: ${uniqueDays.length}`);
      console.log(`   • Total team kills: ${totalKills}`);
      console.log(`   • Total team damage: ${Math.round(totalDamage).toLocaleString()}`);
      console.log(`   • Average matches per day: ${(seasonMatches.length / uniqueDays.length).toFixed(1)}`);
      console.log(`\n🚀 Efficiency Gains:`);
      console.log(`   • API calls saved: ~${existingMatches.length * 2} (skipped existing matches)`);
      console.log(`   • Processing time saved: ~${Math.round(existingMatches.length * 0.5)}s`);
      
    } else {
      console.log(`\n⚠️ No matches found since September 1, 2025`);
    }
    
  } catch (error) {
    console.error(`\n💥 Fatal Error for ${playerName}:`, error.response?.data || error.message);
    if (error.response?.status === 429) {
      console.error('🚫 Rate limit exceeded. Please wait a few minutes before trying again.');
    } else if (error.response?.status === 401) {
      console.error('🔑 Authentication failed. Please check your API key.');
    }
    throw error;
  }
}

// Main execution
(async () => {
  try {
    console.log(`🚀 PUBG Multi-Player Data Collection System`);
    console.log(`📊 Available players: ${PLAYERS.join(', ')}`);
    
    // Check if a specific player was requested (command line arg or environment variable)
    const isSpecificPlayerMode = process.argv[2] || process.env.PLAYER_NAME;
    
    if (isSpecificPlayerMode) {
      if (PLAYERS.includes(TARGET_PLAYER)) {
        console.log(`🎯 Collecting data for specific player: ${TARGET_PLAYER}`);
        await collectPlayerData(TARGET_PLAYER);
      } else {
        console.error(`❌ Player "${TARGET_PLAYER}" not found in player list!`);
        console.log(`📋 Available players: ${PLAYERS.join(', ')}`);
        process.exit(1);
      }
    } else {
      // Collect data for all players (local development default)
      console.log(`\n🔄 Collecting data for all players...`);
      console.log(`⚠️  WARNING: Collecting all players locally may hit rate limits!`);
      console.log(`💡 TIP: Run "node PUBG.js PlayerName" to collect for single player`);
      console.log(`📋 Available players: ${PLAYERS.join(', ')}\n`);
      
      for (const player of PLAYERS) {
        let attempts = 0;
        const maxAttempts = 2;
        
        while (attempts < maxAttempts) {
          try {
            await collectPlayerData(player);
            break; // Success, exit retry loop
            
          } catch (error) {
            attempts++;
            console.error(`❌ Failed to collect data for ${player} (attempt ${attempts}/${maxAttempts}):`, error.message);
            
            if (error.response?.status === 429 && attempts < maxAttempts) {
              console.log(`⏳ Rate limit hit, waiting 60 seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, 60000));
            } else {
              console.log(`🔄 Continuing with next player...`);
              break; // Give up and continue to next player
            }
          }
        }
        
        // Add delay between players to respect API limits
        if (PLAYERS.indexOf(player) < PLAYERS.length - 1) {
          console.log(`\n⏸️ Pausing 30 seconds before next player to avoid rate limits...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }
    
    console.log(`\n✅ Data collection completed successfully!`);
    
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
})();
