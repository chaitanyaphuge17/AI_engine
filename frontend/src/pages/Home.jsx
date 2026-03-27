import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import api from '../api'
import Globe from 'react-globe.gl'

const COUNTRIES = {
    'USA': { lat: 39.8283, lng: -98.5795 },
    'Iran': { lat: 32.4279, lng: 53.6880 },
    'Russia': { lat: 61.5240, lng: 105.3188 },
    'India': { lat: 20.5937, lng: 78.9629 },
    'China': { lat: 35.8617, lng: 104.1954 },
    'Israel': { lat: 31.0461, lng: 34.8516 },
    'UK': { lat: 55.3781, lng: -3.4360 },
    'Ukraine': { lat: 48.3794, lng: 31.1656 },
    'France': { lat: 46.2276, lng: 2.2137 },
    'Canada': { lat: 56.1304, lng: -106.3468 },
    'Mexico': { lat: 23.6345, lng: -102.5528 },
    'Australia': { lat: -25.2744, lng: 133.7751 },
    'UAE': { lat: 23.4241, lng: 53.8478 },
    'Japan': { lat: 36.2048, lng: 138.2529 },
    'Taiwan': { lat: 23.6978, lng: 120.9605 },
    'NorthKorea': { lat: 40.3399, lng: 127.5101 },
}

const RELATION_META = {
    CONFLICT: { color: '#ef4444', icon: '⚔️' },
    SANCTIONS: { color: '#f59e0b', icon: '🚫' },
    ALLY: { color: '#10b981', icon: '🤝' },
    TRADE: { color: '#3b82f6', icon: '💱' },
    TECH_DEVELOPMENT: { color: '#7c3aed', icon: '🔬' },
}

const features = [
    {
        path: '/graph',
        icon: '🕸',
        iconBg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        title: 'Intelligence Graph',
        desc: 'Interactive knowledge graph visualizing geopolitical entities and their relationships extracted from live news.',
    },
    {
        path: '/analytics',
        icon: '📈',
        iconBg: 'linear-gradient(135deg,#06b6d4,#0891b2)',
        title: 'Influence Analytics',
        desc: 'Quantify global power by computing network centrality scores across countries and alliances.',
    },
    {
        path: '/forecast',
        icon: '🤖',
        iconBg: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
        title: 'AI Conflict Forecast',
        desc: 'Run AI-powered geopolitical analysis to predict conflict risk levels for key relationships.',
    },
    {
        path: '/feed',
        icon: '📰',
        iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
        title: 'Intelligence Feed',
        desc: 'Real-time stream of geopolitical relationships inferred from global news by AI entity extraction.',
    },
]

const initialPoints = Object.entries(COUNTRIES).map(([name, coords]) => ({
    name: name, lat: coords.lat, lng: coords.lng, size: 0.3, color: '#475569'
}))

export default function Home() {
    const navigate = useNavigate()
    const globeEl = useRef()
    const [nodeCount, setNodeCount] = useState('50+')
    const [edgeCount, setEdgeCount] = useState('200+')
    const [arcsData, setArcsData] = useState([])
    const [pointsData] = useState(initialPoints)
    const [newsFeed, setNewsFeed] = useState([])

    useEffect(() => {
        async function fetchHomeData() {
            try {
                // Fetch graph edges for 3D globe background
                const graphRes = await api.get('/graph', { timeout: 3000 })
                if (graphRes.data?.nodes && graphRes.data?.edges) {
                    setNodeCount(graphRes.data.nodes.length)
                    setEdgeCount(graphRes.data.edges.length)
                    
                    const conflictEdges = graphRes.data.edges.filter(e => 
                        e.type === 'CONFLICT' || e.type === 'SANCTIONS'
                    )
                    
                    const arcs = conflictEdges.filter(e => COUNTRIES[e.source] && COUNTRIES[e.target]).map(e => ({
                        startLat: COUNTRIES[e.source].lat,
                        startLng: COUNTRIES[e.source].lng,
                        endLat: COUNTRIES[e.target].lat,
                        endLng: COUNTRIES[e.target].lng,
                        color: e.type === 'CONFLICT' ? '#ef4444' : '#f59e0b',
                    }))
                    setArcsData(arcs)
                }

                // Fetch live news feed for ticker
                const feedRes = await api.get('/feed', { timeout: 3000 })
                if (feedRes.data?.feed?.length) {
                    // Double the feed so ticker can loop seamlessly if short
                    const topFeed = feedRes.data.feed.slice(0, 15)
                    setNewsFeed([...topFeed, ...topFeed])
                }
            } catch (error) {
                console.error('Failed to fetch home data:', error);
            }
        }
        
        fetchHomeData()
        
        // Setup Globe rotation
        setTimeout(() => {
            if (globeEl.current) {
                globeEl.current.controls().autoRotate = true;
                globeEl.current.controls().autoRotateSpeed = 0.8;
                globeEl.current.controls().enableZoom = false;
            }
        }, 100)
    }, [])

    const dynamicStats = [
        { value: nodeCount, label: 'Entities Tracked', color: '#3b82f6' },
        { value: edgeCount, label: 'Graph Edges', color: '#06b6d4' },
        { value: 'Live', label: 'News Pipeline', color: '#10b981' },
        { value: 'AI', label: 'Gemini + Groq', color: '#7c3aed' },
    ]

    return (
        <div className="home-layout">
            {/* 3D Background */}
            <div className="home-background-3d">
                <Globe
                    ref={globeEl}
                    width={900}
                    height={900}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    showAtmosphere={true}
                    atmosphereColor="#3b82f6"
                    atmosphereAltitude={0.15}
                    backgroundColor="rgba(0,0,0,0)"
                    arcsData={arcsData}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={0.2}
                    arcDashAnimateTime={2500}
                    arcStroke={1.5}
                    pointsData={pointsData}
                    pointColor="color"
                    pointRadius="size"
                />
            </div>

            <div style={{ position: 'relative', zIndex: 10 }}>
                {/* Hero */}
                <div className="home-hero">
                    <h2>Global Ontology<br />Intelligence Engine</h2>
                    <p style={{ margin: '0 0 32px 0' }}>
                        AI-powered strategic intelligence platform that collects global news, extracts
                        geopolitical entities, and maps them onto a dynamic knowledge graph for decision-making.
                    </p>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-primary" onClick={() => navigate('/graph')}>
                            🕸 Open Knowledge Graph
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate('/feed')}>
                            📰 Intelligence Feed
                        </button>
                    </div>
                </div>

                {/* News Ticker */}
                {newsFeed.length > 0 && (
                    <div className="news-ticker-container">
                        <div className="news-ticker-content">
                            {newsFeed.map((item, i) => {
                                const meta = RELATION_META[item.relation] || { color: '#94a3b8', icon: '•' }
                                return (
                                    <div key={i} className="news-ticker-item">
                                        <span style={{ color: meta.color }}>{meta.icon}</span>
                                        <strong>{item.source}</strong>
                                        <span style={{ fontSize: 11, color: meta.color, fontFamily: 'var(--font-mono)' }}>{item.relation}</span>
                                        <span style={{ color: '#475569' }}>→</span>
                                        <strong>{item.target}</strong>
                                        <span className="badge badge-cyan" style={{ marginLeft: 8 }}>{item.domain}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Stats row */}
                <div className="stats-grid">
                    {dynamicStats.map(s => (
                        <div className="stat-card" key={s.label}>
                            <div className="accent-bar" style={{ background: s.color }} />
                            <div className="card-value" style={{ paddingLeft: 10, color: s.color }}>{s.value}</div>
                            <div className="card-sub" style={{ paddingLeft: 10 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Feature cards */}
                <div className="home-features">
                    {features.map(f => (
                        <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
                            <div className="feature-icon" style={{ background: f.iconBg }}>
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                            <div style={{ marginTop: 16, color: '#3b82f6', fontSize: 12, fontWeight: 600 }}>
                                Open module →
                            </div>
                        </div>
                    ))}
                </div>
                        {/* Simplified Technology Stack layout for maximum stability */}
                <div className="two-col mt-8" style={{ position: 'relative', zIndex: 100 }}>
                    {/* Backend Architecture */}
                    <div className="card" style={{ border: '1px solid rgba(245, 158, 11, 0.4)', padding: '24px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>
                            ⚡ Backend Architecture
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>FastAPI</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>Uvicorn</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>Python 3.14</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>Groq API</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>Llama 3.1</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>Neo4j</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '5px 12px' }}>NetworkX</span>
                        </div>
                    </div>

                    {/* Frontend Architecture */}
                    <div className="card" style={{ border: '1px solid rgba(236, 72, 153, 0.4)', padding: '24px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>
                            ⚛️ Frontend Architecture
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: '5px 12px' }}>React 19</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: '5px 12px' }}>Vite 8</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: '5px 12px' }}>Router v7</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: '5px 12px' }}>Recharts 3</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: '5px 12px' }}>Three.js</span>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#f1f5f9', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: '5px 12px' }}>Globe.gl</span>
                        </div>
                    </div>
                </div>

                <div style={{ height: 100 }} />
            </div>
        </div>
    )
}
