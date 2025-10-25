const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve main data file
app.get('/data.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data.json'));
});

// Serve individual player data files
app.get('/data_*.json', (req, res) => {
  const fileName = req.path.substring(1); // Remove leading slash
  res.sendFile(path.join(__dirname, fileName));
});

// Serve any JSON file in the root directory (for flexibility)
app.get('/*.json', (req, res) => {
  const fileName = req.path.substring(1); // Remove leading slash
  res.sendFile(path.join(__dirname, fileName));
});

app.listen(3000, () => {
  console.log('🌐 Dashboard running at http://localhost:3000');
  console.log('📊 Serving individual player data files');
});
