import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import IntelligenceGraph from './pages/IntelligenceGraph'
import InfluenceAnalytics from './pages/InfluenceAnalytics'
import ConflictForecast from './pages/ConflictForecast'
import IntelligenceFeed from './pages/IntelligenceFeed'
import GeospatialMap from './pages/GeospatialMap'

import { useState } from 'react'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Mobile Header */}
        <div className="mobile-header">
          <div className="brand" onClick={() => setIsSidebarOpen(false)}>
            <div className="brand-dot" />
            <span>GLOBAL INTEL</span>
          </div>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Overlay for mobile drawer */}
        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/graph" element={<IntelligenceGraph />} />
            <Route path="/analytics" element={<InfluenceAnalytics />} />
            <Route path="/forecast" element={<ConflictForecast />} />
            <Route path="/feed" element={<IntelligenceFeed />} />
            <Route path="/map" element={<GeospatialMap />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
