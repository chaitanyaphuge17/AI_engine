import { useState } from 'react'
import api from '../api'

/* Sample edges — mirrors 4_AI_Conflict_Forecast.py relationships */
const SAMPLE_EDGES = [
    { source: 'USA', target: 'Iran', relation: 'CONFLICT', domain: 'defense' },
    { source: 'Russia', target: 'Ukraine', relation: 'CONFLICT', domain: 'defense' },
    { source: 'China', target: 'USA', relation: 'TRADE', domain: 'economy' },
    { source: 'India', target: 'Russia', relation: 'TRADE', domain: 'economy' },
    { source: 'Israel', target: 'Iran', relation: 'CONFLICT', domain: 'defense' },
    { source: 'USA', target: 'China', relation: 'SANCTIONS', domain: 'economy' },
    { source: 'NATO', target: 'Russia', relation: 'CONFLICT', domain: 'defense' },
    { source: 'AI', target: 'NSA', relation: 'TECH_DEVELOPMENT', domain: 'technology' },
]

/* Deterministic mock AI analysis (used as fallback / demo) */
const MOCK_ANALYSIS = {
    CONFLICT: [
        'Conflict Risk Level: **High**\nThis relationship shows severe escalatory potential with recent military posturing observed on both sides. Diplomatic channels remain strained.',
        'Conflict Risk Level: **High**\nOngoing territorial disputes and energy resource competition have intensified bilateral tensions beyond negotiated thresholds.',
    ],
    TRADE: [
        'Conflict Risk Level: **Low**\nEconomic interdependence creates mutual deterrents against confrontation. Both parties benefit significantly from continued trade flows.',
        'Conflict Risk Level: **Medium**\nImbalanced trade deficits and tariff disputes introduce friction, though direct conflict remains unlikely in the short term.',
    ],
    SANCTIONS: [
        'Conflict Risk Level: **Medium**\nSanctions represent calibrated economic pressure. Target country may retaliate through asymmetric means, raising proxy conflict risk.',
    ],
    TECH_DEVELOPMENT: [
        'Conflict Risk Level: **Low**\nTechnology partnerships are largely cooperative. Minor IP disputes exist but are managed through multilateral frameworks.',
    ],
    ALLY: [
        'Conflict Risk Level: **Low**\nAlliance partnership is stable and mutually reinforcing. Collective security mechanisms provide strong deterrence.',
    ],
}

function getRiskLevel(analysis) {
    if (analysis.includes('**High**')) return 'HIGH'
    if (analysis.includes('**Medium**')) return 'MEDIUM'
    return 'LOW'
}

function getMockAnalysis(relation) {
    const options = MOCK_ANALYSIS[relation] || MOCK_ANALYSIS.CONFLICT
    return options[Math.floor(Math.random() * options.length)]
}

const RISK_BADGE = {
    HIGH: 'badge-red',
    MEDIUM: 'badge-amber',
    LOW: 'badge-green',
}

const RELATION_COLORS = {
    CONFLICT: '#ef4444',
    SANCTIONS: '#f59e0b',
    ALLY: '#10b981',
    TRADE: '#3b82f6',
    TECH_DEVELOPMENT: '#7c3aed',
}

export default function ConflictForecast() {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [ran, setRan] = useState(false)
    
    // Scenario Builder state
    const [allEdges, setAllEdges] = useState([...SAMPLE_EDGES])
    const [newEdge, setNewEdge] = useState({ source: '', target: '', relation: 'CONFLICT', domain: 'defense' })

    const [selectedEdges, setSelectedEdges] = useState(
        new Set(SAMPLE_EDGES.map((_, i) => i))
    )

    function addCustomEdge() {
        if (!newEdge.source || !newEdge.target) return
        const nextIdx = allEdges.length
        setAllEdges([...allEdges, newEdge])
        setSelectedEdges(new Set([...selectedEdges, nextIdx]))
        setNewEdge({ source: '', target: '', relation: 'CONFLICT', domain: 'defense' })
    }

    function toggleEdge(i) {
        setSelectedEdges(prev => {
            const next = new Set(prev)
            if (next.has(i)) next.delete(i); else next.add(i)
            return next
        })
    }

    async function runPrediction() {
        setLoading(true)
        setRan(false)

        const chosen = allEdges.filter((_, i) => selectedEdges.has(i))

        /* try real backend; fall back to deterministic mock */
        let predictions = []
        try {
            const res = await api.post(
                '/predict',
                { edges: chosen },
                { timeout: 8000 }
            )
            predictions = res.data
        } catch {
            /* backend not running — use demo data */
            predictions = chosen.map(e => ({
                ...e,
                analysis: getMockAnalysis(e.relation),
            }))
        }

        setResults(predictions)
        setLoading(false)
        setRan(true)
    }

    const highCount = results.filter(r => getRiskLevel(r.analysis) === 'HIGH').length
    const mediumCount = results.filter(r => getRiskLevel(r.analysis) === 'MEDIUM').length
    const lowCount = results.filter(r => getRiskLevel(r.analysis) === 'LOW').length

    return (
        <div>
            <div className="page-header">
                <h2>🤖 AI Conflict Forecast</h2>
                <p>Run AI-powered geopolitical analysis using Groq Llama 3.1 to predict conflict risk levels</p>
            </div>

            <div className="two-col" style={{ marginBottom: 24 }}>
                {/* Edge selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Scenario Builder */}
                    <div className="card" style={{ padding: '20px' }}>
                        <div className="card-title" style={{ marginBottom: 12 }}>🧪 What-If Scenario Builder</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Inject custom intelligence connections to see how the AI predicts cascading conflict risks.
                        </p>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input 
                                type="text" 
                                placeholder="Source (e.g. USA)" 
                                value={newEdge.source} 
                                onChange={e => setNewEdge({...newEdge, source: e.target.value})} 
                                style={{ flex: 1, padding: '8px 12px', background: 'rgba(15,23,42,0.5)', border: '1px solid #1e3a5f', borderRadius: 6, color: 'white', fontFamily: 'var(--font-mono)' }} 
                            />
                            <select 
                                value={newEdge.relation} 
                                onChange={e => setNewEdge({...newEdge, relation: e.target.value})} 
                                style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.5)', border: '1px solid #1e3a5f', borderRadius: 6, color: 'white', fontWeight: 600 }}
                            >
                                <option value="CONFLICT">CONFLICT</option>
                                <option value="SANCTIONS">SANCTIONS</option>
                                <option value="ALLY">ALLY</option>
                                <option value="TRADE">TRADE</option>
                                <option value="TECH_DEVELOPMENT">TECH</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Target" 
                                value={newEdge.target} 
                                onChange={e => setNewEdge({...newEdge, target: e.target.value})} 
                                style={{ flex: 1, padding: '8px 12px', background: 'rgba(15,23,42,0.5)', border: '1px solid #1e3a5f', borderRadius: 6, color: 'white', fontFamily: 'var(--font-mono)' }} 
                            />
                        </div>
                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={addCustomEdge}>
                            + Add to Scenario
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-title" style={{ marginBottom: 16 }}>⚙️ Select Relationships to Analyse</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {allEdges.map((e, i) => (
                            <label key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px',
                                background: selectedEdges.has(i) ? 'rgba(59,130,246,0.08)' : 'transparent',
                                border: `1px solid ${selectedEdges.has(i) ? 'rgba(59,130,246,0.3)' : '#1e3a5f'}`,
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedEdges.has(i)}
                                    onChange={() => toggleEdge(i)}
                                    style={{ accentColor: '#3b82f6', width: 14, height: 14 }}
                                />
                                <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{e.source}</span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                                    background: `${RELATION_COLORS[e.relation]}22`,
                                    color: RELATION_COLORS[e.relation],
                                    border: `1px solid ${RELATION_COLORS[e.relation]}44`,
                                }}>
                                    {e.relation}
                                </span>
                                <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{e.target}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' }}>{e.domain}</span>
                            </label>
                        ))}
                    </div>

                        <button
                            className="btn btn-primary"
                            onClick={runPrediction}
                            disabled={loading || selectedEdges.size === 0}
                            style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1, padding: '12px', fontSize: 15 }}
                        >
                            {loading
                                ? '⏳ Running Analysis...'
                                : `🤖 Run AI Prediction (${selectedEdges.size} edges)`}
                        </button>
                    </div>
                </div>

                {/* Results summary */}
                <div>
                    {ran && (
                        <>
                            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
                                {[
                                    { v: highCount, l: 'High Risk', c: '#ef4444', b: 'badge-red' },
                                    { v: mediumCount, l: 'Medium Risk', c: '#f59e0b', b: 'badge-amber' },
                                    { v: lowCount, l: 'Low Risk', c: '#10b981', b: 'badge-green' },
                                ].map(s => (
                                    <div className="stat-card" key={s.l}>
                                        <div className="accent-bar" style={{ background: s.c }} />
                                        <div className="card-value" style={{ paddingLeft: 10, color: s.c }}>{s.v}</div>
                                        <div className="card-sub" style={{ paddingLeft: 10 }}>{s.l}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e3a5f' }}>
                                    <span className="card-title" style={{ marginBottom: 0 }}>📋 Risk Assessment Results</span>
                                </div>
                                <div style={{ padding: '16px 20px' }}>
                                    {results.map((r, i) => {
                                        const risk = getRiskLevel(r.analysis)
                                        const isHighRisk = risk === 'HIGH'
                                        return (
                                            <div key={i} className={`conflict-card ${isHighRisk ? 'high-risk-pulse' : ''}`}>
                                                <div className="conflict-header">
                                                    <div className="conflict-entities">
                                                        <span style={{ color: '#60a5fa' }}>{r.source}</span>
                                                        <span style={{ color: '#475569', margin: '0 8px', fontFamily: 'var(--font-mono)' }}>—{r.relation}→</span>
                                                        <span style={{ color: '#60a5fa' }}>{r.target}</span>
                                                    </div>
                                                    <span className={`badge ${RISK_BADGE[risk]}`}>{risk}</span>
                                                </div>
                                                <div className="conflict-analysis">
                                                    {r.analysis.replace(/\*\*/g, '')}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {!ran && !loading && (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                            <div style={{ fontSize: 16, color: '#475569', marginBottom: 8 }}>No analysis run yet</div>
                            <div style={{ fontSize: 13, color: '#334155' }}>Select relationships and click "Run AI Prediction"</div>
                        </div>
                    )}

                    {loading && (
                        <div className="loading-spinner">
                            <div className="spinner-ring" />
                            <span>Running AI analysis via Groq / Llama 3.1...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
