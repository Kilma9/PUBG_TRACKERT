import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data - will be replaced with real API call
  const mockVideos = [
    {
      id: 1,
      date: '2025-11-16T18:30:00Z',
      killer: 'PlayerX_TTV',
      weapon: 'M416',
      map: 'Erangel',
      thumbnail: 'https://via.placeholder.com/320x180/1a1a2e/ff6b6b?text=Death+Cam',
      videoUrl: '#',
      isNew: true
    },
    {
      id: 2,
      date: '2025-11-15T20:15:00Z',
      killer: 'SnipeMaster',
      weapon: 'Kar98k',
      map: 'Miramar',
      thumbnail: 'https://via.placeholder.com/320x180/1a1a2e/ffd93d?text=Death+Cam',
      videoUrl: '#',
      isNew: false
    },
    {
      id: 3,
      date: '2025-11-14T19:45:00Z',
      killer: 'RusherPro',
      weapon: 'AKM',
      map: 'Vikendi',
      thumbnail: 'https://via.placeholder.com/320x180/1a1a2e/4ecdc4?text=Death+Cam',
      videoUrl: '#',
      isNew: false
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setVideos(mockVideos)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredVideos = videos.filter(video => {
    const matchesFilter = filter === 'all' || 
      (filter === 'new' && video.isNew) ||
      (filter === 'map' && video.map.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSearch = video.killer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.weapon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.map.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && (searchTerm === '' || matchesSearch)
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading death cams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎥 PUBG Death Cam Gallery</h1>
        <p className="subtitle">Watch your glorious defeats • KILMA9</p>
      </header>

      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by killer, weapon, or map..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All Videos ({videos.length})
          </button>
          <button 
            className={filter === 'new' ? 'active' : ''} 
            onClick={() => setFilter('new')}
          >
            🆕 New ({videos.filter(v => v.isNew).length})
          </button>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="no-results">
          <p>No videos found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="video-grid">
          {filteredVideos.map(video => (
            <div key={video.id} className="video-card">
              {video.isNew && <span className="new-badge">NEW</span>}
              
              <div className="video-thumbnail">
                <img src={video.thumbnail} alt={`Death by ${video.killer}`} />
                <div className="play-overlay">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <div className="video-info">
                <div className="video-meta">
                  <span className="date">📅 {formatDate(video.date)}</span>
                  <span className="map">🗺️ {video.map}</span>
                </div>
                
                <div className="killer-info">
                  <p className="killer">💀 Killed by: <strong>{video.killer}</strong></p>
                  <p className="weapon">🔫 Weapon: <strong>{video.weapon}</strong></p>
                </div>
                
                <button className="watch-btn">
                  Watch Death Cam
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="footer">
        <p>Videos powered by <a href="https://pubg.report" target="_blank" rel="noopener noreferrer">PUBG.report</a></p>
      </footer>
    </div>
  )
}

export default App
