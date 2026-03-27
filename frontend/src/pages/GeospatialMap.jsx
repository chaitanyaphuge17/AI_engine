import { useState, useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'
import api from '../api'

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

const SAMPLE_EDGES = [
    { source: 'USA', target: 'Iran', label: 'CONFLICT' },
    { source: 'Russia', target: 'India', label: 'SANCTIONS' },
    { source: 'Russia', target: 'Iran', label: 'CONFLICT' },
    { source: 'Russia', target: 'Israel', label: 'CONFLICT' },
    { source: 'India', target: 'Iran', label: 'CONFLICT' },
    { source: 'Israel', target: 'Iran', label: 'TECH_DEVELOPMENT' },
    { source: 'UK', target: 'Israel', label: 'CONFLICT' },
    { source: 'UK', target: 'Ukraine', label: 'CONFLICT' },
    { source: 'Canada', target: 'Mexico', label: 'TRADE' },
    { source: 'China', target: 'Taiwan', label: 'CONFLICT' },
    { source: 'USA', target: 'Taiwan', label: 'ALLY' },
    { source: 'Russia', target: 'NorthKorea', label: 'TRADE' },
    { source: 'Japan', target: 'USA', label: 'ALLY' },
]

const RELATION_COLORS = {
    CONFLICT: '#ef4444',
    SANCTIONS: '#f59e0b',
    ALLY: '#10b981',
    TRADE: '#3b82f6',
    TECH_DEVELOPMENT: '#7c3aed',
}

export default function GeospatialMap() {
    const globeEl = useRef()
    const containerRef = useRef()
    const [arcsData, setArcsData] = useState([])
    const [pointsData, setPointsData] = useState([])
    const [dim, setDim] = useState({ width: 800, height: 700 })
    const [selected, setSelected] = useState(null)
    const [isLive, setIsLive] = useState(false)

    useEffect(() => {
        // Handle resizing dynamically
        if (containerRef.current) {
            setDim({ 
                width: containerRef.current.clientWidth, 
                height: containerRef.current.clientHeight 
            })
        }
        
        const handleResize = () => {
            if (containerRef.current) {
                setDim({ 
                    width: containerRef.current.clientWidth, 
                    height: containerRef.current.clientHeight 
                })
            }
        }
        window.addEventListener('resize', handleResize)
        
        // Data setup
        async function fetchGraph() {
            let edgesToUse = SAMPLE_EDGES
            try {
                const res = await api.get('/graph', { timeout: 4000 })
                if (res.data?.edges?.length) {
                    edgesToUse = res.data.edges.map(e => ({
                        source: e.source,
                        target: e.target,
                        label: e.type || e.label || 'RELATION'
                    }))
                    setIsLive(true)
                }
            } catch {
                // Keep static SAMPLE_EDGES on failure
            }

            const points = Object.entries(COUNTRIES).map(([name, coords]) => ({
                name,
                lat: coords.lat,
                lng: coords.lng,
                size: 0.5,
                color: '#3b82f6'
            }))
            
            const arcs = edgesToUse.filter(e => COUNTRIES[e.source] && COUNTRIES[e.target]).map(e => ({
                startLat: COUNTRIES[e.source].lat,
                startLng: COUNTRIES[e.source].lng,
                endLat: COUNTRIES[e.target].lat,
                endLng: COUNTRIES[e.target].lng,
                color: RELATION_COLORS[e.label] || '#475569',
                label: e.label,
                source: e.source,
                target: e.target
            }))
            
            setPointsData(points)
            setArcsData(arcs)
        }
        
        fetchGraph()

        // Setup auto-rotation
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
            globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });
        }
        
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div>
            <div className="page-header">
                <h2>🌍 Geospatial Map View</h2>
                <p>
                    {isLive 
                        ? 'Live interactive 3D globe visualizing geopolitical connections from real-time news data'
                        : 'Interactive 3D globe visualizing intelligence arcs and geopolitical connections'}
                    {isLive && (
                        <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#34d399', fontSize: 12, fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse-green 2s infinite' }} />
                            LIVE
                        </span>
                    )}
                </p>
            </div>
            
            <div className="card" ref={containerRef} style={{ padding: 0, height: '700px', width: '100%', position: 'relative', overflow: 'hidden' }}>
               <Globe
                    ref={globeEl}
                    width={dim.width}
                    height={dim.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    arcsData={arcsData}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={0.2}
                    arcDashAnimateTime={2000}
                    arcsTransitionDuration={1000}
                    arcStroke={2}
                    pointsData={pointsData}
                    pointColor="color"
                    pointAltitude={0.01}
                    pointRadius="size"
                    pointsMerge={true}
                    labelsData={pointsData}
                    labelLat="lat"
                    labelLng="lng"
                    labelText="name"
                    labelSize={1.5}
                    labelDotRadius={0.5}
                    labelColor={() => 'rgba(255, 255, 255, 0.8)'}
                    labelResolution={2}
                    backgroundColor="rgba(0,0,0,0)"
                    onPointClick={(pt) => {
                        const node = { id: pt.name, label: pt.name, group: 'country' }
                        const edges = arcsData.filter(e => e.source === pt.name || e.target === pt.name)
                        setSelected({ node, edges })
                    }}
                    onLabelClick={(pt) => {
                        const node = { id: pt.name, label: pt.name, group: 'country' }
                        const edges = arcsData.filter(e => e.source === pt.name || e.target === pt.name)
                        setSelected({ node, edges })
                    }}
                />
                
                {/* Legend overlay */}
                <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(15,23,42,0.8)', padding: 16, borderRadius: 8, backdropFilter: 'blur(8px)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em' }}>Relation Heatmap</div>
                    {Object.entries(RELATION_COLORS).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: v, boxShadow: `0 0 8px ${v}` }} />
                            <span style={{ fontSize: 13, color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{k}</span>
                        </div>
                    ))}
                </div>

                {/* Node detail panel */}
                {selected && (
                    <div className="card" style={{ position: 'absolute', top: 20, right: 20, width: 320, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)' }}>
                        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span>🔍 Entity Detail — {selected.node.label}</span>
                            <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }} onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="mt-4">
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                                <strong style={{ color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{selected.edges.length}</strong> connected relationships shown
                            </div>
                            <div className="mt-4" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Edge breakdown</div>
                                {['CONFLICT', 'ALLY', 'TRADE', 'SANCTIONS', 'TECH_DEVELOPMENT'].map(rel => {
                                    const cnt = selected.edges.filter(e => e.label === rel).length
                                    if (!cnt) return null
                                    return (
                                        <div key={rel} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e3a5f' }}>
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{rel}</span>
                                            <span style={{ fontSize: 13, color: RELATION_COLORS[rel], fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{cnt}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
