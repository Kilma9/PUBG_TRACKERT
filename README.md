# PUBG Tracker Dashboard

A Node.js application that fetches PUBG match statistics via the official PUBG API and displays them in an interactive web dashboard. The app tracks kills, damage, headshots, and weapon usage for teams across multiple matches, organizing data by date with beautiful Chart.js visualizations.

## Features
- **Real-time PUBG API Integration**: Fetches recent match data for any Steam player
- **Daily Statistics Grouping**: Organizes matches by date with team performance summaries  
- **Interactive Charts**: Bar charts showing kills, damage, and headshots per player per day
- **Team Performance Tracking**: Aggregates stats across all team members in each match
- **Weapon Kill Analysis**: Tracks weapon-specific kill counts from telemetry data
- **Responsive Design**: Charts adapt to different screen sizes for optimal viewing
- **Local Data Storage**: Saves match data to `data.json` for offline viewing and faster loading
- **Express Server**: Serves the dashboard locally with static file handling

## Tech Stack
- **Backend**: Node.js with Express for serving files and API data
- **Frontend**: HTML5, CSS3, vanilla JavaScript with Chart.js for visualizations
- **Data Source**: Official PUBG Developer API with telemetry integration
- **Storage**: Local JSON file storage for match history and statistics

## Quick Start
1. Clone the repository and run `npm install` to install dependencies
2. Update the `PLAYER_NAME` variable in `PUBG.JS` to your Steam username
3. Replace the `API_KEY` in `PUBG.JS` with your PUBG Developer API key
4. Run `node PUBG.JS` to fetch recent match data, then `npm start` to launch the dashboard
5. Open `http://localhost:3000` to view your personalized PUBG statistics dashboard
