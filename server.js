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

app.listen(3000, () => {
  console.log('🌐 Dashboard running at http://localhost:3000');
  console.log('📊 Serving individual player data files');
});
