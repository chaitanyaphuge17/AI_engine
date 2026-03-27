import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell,
    ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { useState, useEffect } from 'react'
import api from '../api'

/* ── geopolitical influence edges (mirrors Python networkx data) ── */
const EDGES = [
    ['USA', 'Israel'], ['USA', 'Ukraine'], ['China', 'Pakistan'],
    ['Russia', 'Iran'], ['India', 'USA'], ['North Korea', 'China'],
    ['South Korea', 'USA'], ['Iran', 'Russia'], ['Pakistan', 'China'],
    ['Ukraine', 'EU'], ['USA', 'NATO'], ['UK', 'USA'],
    ['France', 'EU'], ['Germany', 'EU'], ['Saudi Arabia', 'USA'],
    ['Turkey', 'NATO'], ['Brazil', 'USA'], ['Japan', 'USA'],
]

/* simple degree-centrality computation */
function computeCentrality(edges) {
    const degree = {}
    edges.forEach(([a, b]) => {
        degree[a] = (degree[a] || 0) + 1
        degree[b] = (degree[b] || 0) + 1
    })
    const n = Object.keys(degree).length
    return Object.entries(degree)
        .map(([country, deg]) => ({
            country,
            score: parseFloat((deg / (n - 1)).toFixed(4)),
            connections: deg,
        }))
        .sort((a, b) => b.score - a.score)
}

// We now initialize state with computeCentrality(EDGES) directly.

const COLORS = [
    '#3b82f6', '#06b6d4', '#7c3aed', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#a78bfa', '#34d399', '#60a5fa',
]

const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        const d = payload[0].payload
        return (
            <div className="custom-tooltip" style={{ background: '#1e293b', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{d.country}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Influence Score: <strong style={{ color: '#3b82f6' }}>{d.score}</strong></div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Connections: <strong style={{ color: '#06b6d4' }}>{d.connections}</strong></div>
            </div>
        )
    }
    return null
}

/* Truncate + title-case long entity names for display */
function formatLabel(name, max = 14) {
    if (!name) return ''
    const cleaned = name.trim()
    if (cleaned.length <= max) return cleaned
    return cleaned.slice(0, max - 1).trim() + '…'
}

export default function InfluenceAnalytics() {
    const [data, setData] = useState(computeCentrality(EDGES))
    const [loading, setLoading] = useState(false)
    const [isLive, setIsLive] = useState(false)

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true)
            try {
                const res = await api.get('/analytics/influence', { timeout: 4000 })
                if (res.data?.data) {
                    setData(res.data.data)
                    setIsLive(true)
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
            }
            setLoading(false)
        }
        fetchAnalytics()
    }, [])

    const top5 = data.slice(0, 5)

    return (
        <div>
            <div className="page-header">
                <h2>📈 Global Influence Analytics</h2>
                <p>
                    {isLive 
                        ? 'Live country influence score computed via network degree centrality from real-time news'
                        : 'Country influence score computed via network degree centrality — higher = more connected'}
                    {isLive && (
                        <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#34d399', fontSize: 12, fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse-green 2s infinite' }} />
                            LIVE
                        </span>
                    )}
                </p>
            </div>

            {/* Loading state overlay (if needed) */}
            {loading && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 700 }}>
                    <div className="spinner-ring" style={{ marginRight: 16 }} />
                    Analyzing network centrality...
                </div>
            )}

            {/* Top cards */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {top5.slice(0, 4).map((d, i) => (
                    <div className="stat-card" key={d.country}>
                        <div className="accent-bar" style={{ background: COLORS[i] }} />
                        <div style={{ paddingLeft: 10 }}>
                            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em' }}>#{i + 1} Influence</div>
                            <div className="card-value" style={{ fontSize: 22, color: COLORS[i], marginTop: 4 }}>{d.country}</div>
                            <div className="card-sub">Score: {d.score} · {d.connections} links</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="two-col" style={{ marginBottom: 24 }}>
                {/* Bar chart — top 10 only to avoid x-axis congestion */}
                <div className="card">
                    <div className="card-title">📊 Influence Ranking — Top 10 Nations</div>
                    <div style={{ marginTop: 16 }}>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart
                                data={data.slice(0, 10).map(d => ({ ...d, label: formatLabel(d.country, 10) }))}
                                margin={{ top: 4, right: 16, left: -20, bottom: 48 }}
                            >
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                    tickLine={false}
                                />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                                    {data.slice(0, 10).map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar chart for top 6 */}
                <div className="card">
                    <div className="card-title">🕸 Influence Radar — Top 6</div>
                    <div style={{ marginTop: 16 }}>
                        <ResponsiveContainer width="100%" height={320}>
                            <RadarChart data={data.slice(0, 6)}>
                                <PolarGrid stroke="#1e3a5f" />
                                <PolarAngleAxis dataKey="country" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Radar
                                    name="Influence"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Ranking table */}
            <div className="card">
                <div className="card-title">🏆 Full Influence Ranking</div>
                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                    <table className="intel-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Country / Entity</th>
                                <th>Influence Score</th>
                                <th>Direct Connections</th>
                                <th>Tier</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, i) => {
                                const tier = i < 3 ? 'Superpower' : i < 6 ? 'Major Power' : i < 10 ? 'Regional' : 'Local'
                                const tierBadge = i < 3 ? 'badge-red' : i < 6 ? 'badge-amber' : i < 10 ? 'badge-blue' : 'badge-cyan'
                                return (
                                    <tr key={d.country}>
                                        <td style={{ color: '#475569', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{i + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: COLORS[i % COLORS.length] }} />
                                                <strong
                                                    title={d.country}
                                                    style={{
                                                        color: '#f1f5f9',
                                                        maxWidth: 200,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {d.country.length > 28
                                                        ? d.country.slice(0, 25).replace(/\s+\S*$/, '') + '…'
                                                        : d.country}
                                                </strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    flex: 1, maxWidth: 100, height: 4, borderRadius: 2,
                                                    background: '#1e3a5f', overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${(d.score / data[0].score) * 100}%`,
                                                        height: '100%',
                                                        background: COLORS[i % COLORS.length],
                                                        borderRadius: 2,
                                                    }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-mono)', color: '#f1f5f9', fontSize: 13 }}>{d.score}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', color: '#06b6d4' }}>{d.connections}</td>
                                        <td><span className={`badge ${tierBadge}`}>{tier}</span></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
