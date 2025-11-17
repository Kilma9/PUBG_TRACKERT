const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load analytics data
let analytics = { visits: [], summary: {} };
const analyticsPath = path.join(__dirname, 'analytics.json');

if (fs.existsSync(analyticsPath)) {
  try {
    analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
  } catch (err) {
    console.error('Error loading analytics:', err);
    analytics = { visits: [], summary: {} };
  }
}

// Analytics middleware - track all page requests
app.use((req, res, next) => {
  // Skip tracking for static assets and analytics endpoint
  if (req.path.match(/\.(css|js|png|jpg|ico|json)$/) || req.path === '/analytics') {
    return next();
  }
  
  // Anonymize IP (remove last octet for privacy)
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const ipParts = ip.split(':').pop().split('.'); // Handle IPv6 ::ffff:192.168.1.1
  const anonymizedIP = ipParts.length === 4 
    ? ipParts.slice(0, 3).join('.') + '.xxx'
    : 'xxx.xxx.xxx.xxx';
  
  // Generate session ID (hash of IP + user agent)
  const userAgent = req.get('user-agent') || 'unknown';
  const sessionId = crypto.createHash('md5')
    .update(ip + userAgent)
    .digest('hex')
    .substring(0, 12);
  
  // Record visit
  const visit = {
    timestamp: new Date().toISOString(),
    page: req.path,
    ip: anonymizedIP,
    userAgent: userAgent.substring(0, 100), // Limit length
    referrer: req.get('referrer') || 'direct',
    sessionId: sessionId
  };
  
  analytics.visits.push(visit);
  
  // Limit to last 10,000 visits (rolling window)
  if (analytics.visits.length > 10000) {
    analytics.visits = analytics.visits.slice(-10000);
  }
  
  // Save asynchronously (don't block response)
  fs.writeFile(analyticsPath, JSON.stringify(analytics, null, 2), (err) => {
    if (err) console.error('Analytics write error:', err);
  });
  
  next();
});

app.use(express.static('public'));
app.use('/videos', express.static(path.join(__dirname, 'pubg-react', 'dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve game page
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'game.html'));
});

// Serve Battle Royale game page
app.get('/gamebr.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'gamebr.html'));
});

// Serve Balatro demo page
app.get('/balatro-demo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'balatro-demo.html'));
});

// Serve React Video Gallery
app.get('/videos', (req, res) => {
  res.sendFile(path.join(__dirname, 'pubg-react', 'dist', 'index.html'));
});

// Serve main data file
app.get('/data.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data.json'));
});

// Serve individual player data files using parameter syntax
app.get('/data_:playerName.json', (req, res) => {
  const fileName = `data_${req.params.playerName}.json`;
  res.sendFile(path.join(__dirname, fileName), (err) => {
    if (err) {
      res.status(404).json({ error: 'Player data file not found' });
    }
  });
});

// Serve any JSON file in the root directory (for flexibility)
app.get('/:filename.json', (req, res) => {
  const fileName = `${req.params.filename}.json`;
  res.sendFile(path.join(__dirname, fileName), (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Analytics dashboard endpoint
app.get('/analytics', (req, res) => {
  // Process data for visualization
  const last7Days = analytics.visits.filter(v => {
    const visitDate = new Date(v.timestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return visitDate > weekAgo;
  });
  
  // Daily visits chart data
  const dailyData = {};
  last7Days.forEach(v => {
    const day = v.timestamp.split('T')[0];
    dailyData[day] = (dailyData[day] || 0) + 1;
  });
  
  // Page popularity
  const pageData = {};
  last7Days.forEach(v => {
    pageData[v.page] = (pageData[v.page] || 0) + 1;
  });
  
  // Unique visitors
  const uniqueIPs = new Set(last7Days.map(v => v.ip)).size;
  
  // Referrer data
  const referrerData = {};
  last7Days.forEach(v => {
    const ref = v.referrer === 'direct' ? 'Direct' : new URL(v.referrer).hostname || v.referrer;
    referrerData[ref] = (referrerData[ref] || 0) + 1;
  });
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Dashboard - PUBG Tracker</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
          color: white; 
          padding: 20px;
          min-height: 100vh;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding: 30px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        .header h1 { 
          font-size: 36px; 
          margin-bottom: 10px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .stats { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px; 
          margin: 30px 0;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        .stat-card { 
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          padding: 25px; 
          border-radius: 12px; 
          text-align: center;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.5);
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .stat-value { 
          font-size: 42px; 
          font-weight: bold;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .chart-container { 
          background: white; 
          padding: 30px; 
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .chart-title {
          color: #333;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
        }
        .back-btn {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 30px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }
        .back-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 PUBG Tracker Analytics Dashboard</h1>
        <p style="font-size: 16px; opacity: 0.9; margin-top: 10px;">Real-time visitor statistics and insights</p>
        <a href="/" class="back-btn">🏠 Back to Dashboard</a>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Total Visits (7 days)</div>
          <div class="stat-value">${last7Days.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unique Visitors</div>
          <div class="stat-value">${uniqueIPs}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average per Day</div>
          <div class="stat-value">${Math.round(last7Days.length / 7)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">All Time Visits</div>
          <div class="stat-value">${analytics.visits.length}</div>
        </div>
      </div>
      
      <div class="charts">
        <div class="chart-container">
          <div class="chart-title">📈 Daily Traffic (Last 7 Days)</div>
          <canvas id="dailyChart"></canvas>
        </div>
        
        <div class="chart-container">
          <div class="chart-title">📄 Page Popularity</div>
          <canvas id="pageChart"></canvas>
        </div>
        
        <div class="chart-container">
          <div class="chart-title">🌐 Traffic Sources</div>
          <canvas id="referrerChart"></canvas>
        </div>
      </div>
      
      <script>
        // Daily visits chart
        new Chart(document.getElementById('dailyChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(Object.keys(dailyData).sort())},
            datasets: [{
              label: 'Daily Visits',
              data: ${JSON.stringify(Object.keys(dailyData).sort().map(k => dailyData[k]))},
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              tension: 0.4,
              fill: true,
              borderWidth: 3,
              pointRadius: 5,
              pointBackgroundColor: '#6366f1',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
        
        // Page popularity chart
        new Chart(document.getElementById('pageChart'), {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(Object.keys(pageData))},
            datasets: [{
              label: 'Page Views',
              data: ${JSON.stringify(Object.values(pageData))},
              backgroundColor: [
                '#ff6b6b',
                '#4CAF50',
                '#6366f1',
                '#ff1493',
                '#ffd93d',
                '#8b5cf6'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
        
        // Referrer chart
        new Chart(document.getElementById('referrerChart'), {
          type: 'doughnut',
          data: {
            labels: ${JSON.stringify(Object.keys(referrerData))},
            datasets: [{
              data: ${JSON.stringify(Object.values(referrerData))},
              backgroundColor: [
                '#6366f1',
                '#8b5cf6',
                '#d946ef',
                '#ff6b6b',
                '#4CAF50',
                '#ffd93d'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#333' }
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('🌐 Dashboard running at http://localhost:3000');
  console.log('📊 Analytics available at http://localhost:3000/analytics');
  console.log('📈 Tracking enabled - data saved to analytics.json');
});
