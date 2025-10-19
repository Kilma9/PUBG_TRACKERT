const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    PUBG_API_KEY: process.env.PUBG_API_KEY,
    PLAYER_NAME: 'Kilma9', // Your PUBG username
    PLATFORM: 'steam',
    REGION: 'pc-eu',
    CHECK_RECENT_HOURS: 2, // Check matches from last 2 hours
    STATE_FILE: 'last-notified-match.json',
    LOG_FILE: 'discord-notification-log.md'
};

// PUBG API endpoints
const PUBG_API_BASE = 'https://api.pubg.com';

class DiscordNotifier {
    constructor() {
        this.lastNotifiedState = this.loadState();
        this.newMatches = [];
        this.logEntries = [];
    }

    // Load the last notification state
    loadState() {
        try {
            if (fs.existsSync(CONFIG.STATE_FILE)) {
                const data = fs.readFileSync(CONFIG.STATE_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.log('⚠️ Could not load state file, starting fresh');
        }
        return {
            lastNotifiedMatchId: null,
            lastNotifiedTime: null,
            totalNotificationsSent: 0
        };
    }

    // Save the notification state
    saveState() {
        try {
            fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(this.lastNotifiedState, null, 2));
            console.log('💾 Notification state saved');
        } catch (error) {
            console.error('❌ Failed to save state:', error.message);
        }
    }

    // Get player ID from PUBG API
    async getPlayerId() {
        try {
            console.log(`🔍 Looking up player: ${CONFIG.PLAYER_NAME}`);
            
            const response = await axios.get(
                `${PUBG_API_BASE}/shards/${CONFIG.PLATFORM}/players`,
                {
                    params: { 'filter[playerNames]': CONFIG.PLAYER_NAME },
                    headers: {
                        'Authorization': `Bearer ${CONFIG.PUBG_API_KEY}`,
                        'Accept': 'application/vnd.api+json'
                    }
                }
            );

            if (response.data.data && response.data.data.length > 0) {
                const playerId = response.data.data[0].id;
                console.log(`✅ Found player ID: ${playerId}`);
                return playerId;
            } else {
                throw new Error('Player not found');
            }
        } catch (error) {
            console.error('❌ Failed to get player ID:', error.message);
            throw error;
        }
    }

    // Get recent matches for the player
    async getRecentMatches(playerId) {
        try {
            console.log('🎮 Fetching recent matches...');
            
            const response = await axios.get(
                `${PUBG_API_BASE}/shards/${CONFIG.PLATFORM}/players/${playerId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.PUBG_API_KEY}`,
                        'Accept': 'application/vnd.api+json'
                    }
                }
            );

            const matches = response.data.data.relationships.matches.data || [];
            console.log(`📊 Found ${matches.length} recent matches`);
            
            return matches.map(match => match.id);
        } catch (error) {
            console.error('❌ Failed to get matches:', error.message);
            throw error;
        }
    }

    // Get detailed match information
    async getMatchDetails(matchId) {
        try {
            const response = await axios.get(
                `${PUBG_API_BASE}/shards/${CONFIG.PLATFORM}/matches/${matchId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.PUBG_API_KEY}`,
                        'Accept': 'application/vnd.api+json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(`❌ Failed to get match details for ${matchId}:`, error.message);
            return null;
        }
    }

    // Process match data to extract player stats
    processMatchData(matchData) {
        const participants = matchData.included.filter(item => item.type === 'participant');
        const playerStats = participants.find(p => 
            p.attributes.stats.name === CONFIG.PLAYER_NAME
        );

        if (!playerStats) {
            console.log('⚠️ Player not found in match data');
            return null;
        }

        const stats = playerStats.attributes.stats;
        const matchInfo = matchData.data.attributes;

        // Find teammates
        const teammates = participants
            .filter(p => p.attributes.stats.teamId === stats.teamId && p.attributes.stats.name !== CONFIG.PLAYER_NAME)
            .map(p => p.attributes.stats.name);

        return {
            matchId: matchData.data.id,
            createdAt: matchInfo.createdAt,
            gameMode: matchInfo.gameMode,
            mapName: matchInfo.mapName,
            duration: matchInfo.duration,
            player: {
                name: stats.name,
                kills: stats.kills,
                damage: Math.round(stats.damageDealt),
                placement: stats.winPlace,
                survival: Math.round(stats.timeSurvived / 60), // Convert to minutes
                distance: Math.round(stats.walkDistance + stats.rideDistance),
                heals: stats.heals,
                boosts: stats.boosts,
                revives: stats.revives,
                teammates: teammates
            }
        };
    }

    // Create Discord embed for match notification
    createDiscordEmbed(matchStats) {
        const placementEmoji = this.getPlacementEmoji(matchStats.player.placement);
        const killsEmoji = matchStats.player.kills >= 5 ? '🔥' : matchStats.player.kills >= 3 ? '💀' : '🎯';
        
        // Determine embed color based on performance
        let color = 0x95a5a6; // Gray default
        if (matchStats.player.placement <= 3) color = 0xf1c40f; // Gold for top 3
        else if (matchStats.player.placement <= 10) color = 0xe67e22; // Orange for top 10
        else if (matchStats.player.kills >= 5) color = 0xe74c3c; // Red for high kills
        
        const matchTime = new Date(matchStats.createdAt).toLocaleString('en-GB', {
            timeZone: 'Europe/Prague',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create a cleaner, more reliable embed format
        const embed = {
            title: `🎮 New PUBG Match - ${matchStats.player.name}`,
            description: `${placementEmoji} **Placement:** #${matchStats.player.placement} | ${killsEmoji} **Kills:** ${matchStats.player.kills}`,
            color: color,
            fields: [
                {
                    name: '�️ Map',
                    value: matchStats.mapName || 'Unknown',
                    inline: true
                },
                {
                    name: '🎯 Damage',
                    value: `${matchStats.player.damage}`,
                    inline: true
                },
                {
                    name: '⏱️ Survival',
                    value: `${matchStats.player.survival}min`,
                    inline: true
                },
                {
                    name: '� Match Time',
                    value: matchTime,
                    inline: false
                }
            ],
            footer: {
                text: `PUBG Tracker | Match ${matchStats.matchId.substring(0, 8)}`
            },
            timestamp: matchStats.createdAt
        };

        // Add squad info if available
        if (matchStats.player.teammates && matchStats.player.teammates.length > 0) {
            embed.fields.push({
                name: '🤝 Squad',
                value: `${matchStats.player.name}, ${matchStats.player.teammates.join(', ')}`,
                inline: false
            });
        }

        return { embeds: [embed] };
    }

    getPlacementEmoji(placement) {
        if (placement === 1) return '🥇';
        if (placement === 2) return '🥈';
        if (placement === 3) return '🥉';
        if (placement <= 10) return '🏆';
        if (placement <= 20) return '📈';
        return '📊';
    }

    // Send notification to Discord
    async sendDiscordNotification(matchStats) {
        try {
            if (!CONFIG.DISCORD_WEBHOOK_URL) {
                throw new Error('Discord webhook URL not configured');
            }

            const embed = this.createDiscordEmbed(matchStats);
            
            console.log(`🔔 Sending Discord notification for match ${matchStats.matchId.substring(0, 8)}...`);
            
            const response = await axios.post(CONFIG.DISCORD_WEBHOOK_URL, embed, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            if (response.status === 204 || response.status === 200) {
                console.log('✅ Discord notification sent successfully');
                this.lastNotifiedState.totalNotificationsSent++;
                return true;
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to send Discord notification:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            }
            return false;
        }
    }

    // Log notification activity
    addLogEntry(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `**${timestamp}** - ${message}`;
        this.logEntries.push(logEntry);
        console.log(message);
    }

    // Save log file
    saveLog() {
        try {
            let logContent = '# Discord Notification Log\n\n';
            
            if (fs.existsSync(CONFIG.LOG_FILE)) {
                const existingLog = fs.readFileSync(CONFIG.LOG_FILE, 'utf8');
                // Keep only recent entries (last 50)
                const lines = existingLog.split('\n');
                const recentLines = lines.slice(-100); // Keep last 100 lines
                logContent = recentLines.join('\n') + '\n\n';
            }
            
            // Add new entries
            this.logEntries.forEach(entry => {
                logContent += entry + '\n';
            });
            
            logContent += `\n---\n**Total notifications sent:** ${this.lastNotifiedState.totalNotificationsSent}\n`;
            logContent += `**Last check:** ${new Date().toISOString()}\n`;
            
            fs.writeFileSync(CONFIG.LOG_FILE, logContent);
            console.log('📝 Log file updated');
        } catch (error) {
            console.error('❌ Failed to save log:', error.message);
        }
    }

    // Main execution function
    async run() {
        try {
            console.log('🚀 Starting Discord notification check...');
            this.addLogEntry('🔍 Discord notification check started');

            // Get player ID
            const playerId = await this.getPlayerId();
            
            // Get recent matches
            const recentMatchIds = await this.getRecentMatches(playerId);
            
            if (recentMatchIds.length === 0) {
                this.addLogEntry('📭 No recent matches found');
                return;
            }

            // Check for new matches
            let newMatchFound = false;
            
            for (const matchId of recentMatchIds) {
                // If this is the last notified match, stop checking (we've seen this before)
                if (this.lastNotifiedState.lastNotifiedMatchId === matchId) {
                    console.log(`✅ Reached previously notified match: ${matchId.substring(0, 8)}...`);
                    break;
                }
                
                // Get match details
                const matchData = await this.getMatchDetails(matchId);
                if (!matchData) continue;
                
                // Process match data
                const matchStats = this.processMatchData(matchData);
                if (!matchStats) continue;
                
                console.log(`🎮 New match found: ${matchStats.player.kills} kills, #${matchStats.player.placement} placement`);
                
                // Send Discord notification
                const notificationSent = await this.sendDiscordNotification(matchStats);
                
                if (notificationSent) {
                    this.addLogEntry(`🔔 Notification sent: ${matchStats.player.kills} kills, #${matchStats.player.placement} placement on ${matchStats.mapName}`);
                    
                    // Update state to this match
                    this.lastNotifiedState.lastNotifiedMatchId = matchId;
                    this.lastNotifiedState.lastNotifiedTime = new Date().toISOString();
                    newMatchFound = true;
                    
                    // Only notify for the most recent new match to avoid spam
                    break;
                } else {
                    this.addLogEntry(`❌ Failed to send notification for match ${matchId.substring(0, 8)}`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!newMatchFound) {
                this.addLogEntry('📭 No new matches to notify about');
            }
            
        } catch (error) {
            console.error('💥 Discord notification check failed:', error.message);
            this.addLogEntry(`💥 Error: ${error.message}`);
        } finally {
            // Save state and logs
            this.saveState();
            this.saveLog();
            console.log('✅ Discord notification check completed');
        }
    }
}

// Run the notifier
if (require.main === module) {
    const notifier = new DiscordNotifier();
    notifier.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = DiscordNotifier;