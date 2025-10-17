const axios = require('axios');

const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJiYjE4YmYzMC04YzA4LTAxM2UtZGUwMy0yNmQxYTJiMzY4ZGYiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNzYwNTQxNzY4LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6InptcmRpX2FwaV9wdWJnIn0.VxVk7vF2bR25_Z0YZa-QB8v0mEOmwDi0Lreu20d5rE0'; // Replace with your actual API key
const PLAYER_NAME = 'Kilma9';
const PLATFORM = 'steam';

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/vnd.api+json'
};

async function getPlayerId() {
  const url = `https://api.pubg.com/shards/${PLATFORM}/players?filter[playerNames]=${PLAYER_NAME}`;
  const response = await axios.get(url, { headers });
  return response.data.data[0].id;
}

async function getMatchHistory(playerId) {
  const url = `https://api.pubg.com/shards/${PLATFORM}/players/${playerId}`;
  const response = await axios.get(url, { headers });
  const matches = response.data.data.relationships.matches.data;
  return matches.map(match => match.id);
}

async function getMatchDetails(matchId) {
  const url = `https://api.pubg.com/shards/${PLATFORM}/matches/${matchId}`;
  const response = await axios.get(url, { headers });
  const match = response.data;

  const matchInfo = match.data.attributes;
  console.log(`\n📍 Match ${matchId}`);
  console.log(`- Map: ${matchInfo.mapName}`);
  console.log(`- Mode: ${matchInfo.gameMode}`);
  console.log(`- Duration: ${matchInfo.duration} seconds`);
  console.log(`- Started at: ${matchInfo.createdAt}`);

  const kilmaParticipant = match.included.find(item =>
    item.type === 'participant' &&
    item.attributes.stats.name === PLAYER_NAME
  );
  if (!kilmaParticipant) {
    console.log(`❌ Kilma9 not found in match ${matchId}`);
    return null;
  }

  const kilmaId = kilmaParticipant.id;

  const kilmaRoster = match.included.find(item =>
    item.type === 'roster' &&
    item.relationships.participants.data.some(p => p.id === kilmaId)
  );
  if (!kilmaRoster) {
    console.log(`❌ Kilma9's team not found`);
    return null;
  }

  const teamRank = kilmaRoster.attributes.stats.rank;
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

  for (const participantRef of kilmaRoster.relationships.participants.data) {
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

  return {
    date: matchInfo.createdAt,
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

(async () => {
  try {
    const playerId = await getPlayerId();
    console.log(`Player ID: ${playerId}`);

    const matchIds = await getMatchHistory(playerId);
    console.log(`Recent Match IDs:`, matchIds.slice(0, 10));

    const matchSummaries = [];

    for (const matchId of matchIds.slice(0, 10)) {
      const summary = await getMatchDetails(matchId);
      if (summary) matchSummaries.push(summary);
    }

    summarizeTeamStatsByDay(matchSummaries);

    // ✅ Save to local file
    const fs = require('fs');
    fs.writeFileSync('data.json', JSON.stringify(matchSummaries, null, 2));
    console.log('📁 Saved match summaries to data.json');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
