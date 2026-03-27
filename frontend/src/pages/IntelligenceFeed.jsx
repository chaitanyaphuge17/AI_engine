import { useState, useEffect } from 'react'
import api from '../api'

/* Static feed data — mirrors 5_Intelligence_Feed.py query results */
const STATIC_FEED = [
    { source: 'USA', relation: 'CONFLICT', target: 'Iran', domain: 'defense', ts: '2 min ago' },
    { source: 'Russia', relation: 'CONFLICT', target: 'Ukraine', domain: 'defense', ts: '5 min ago' },
    { source: 'China', relation: 'TECH_DEVELOPMENT', target: 'UN', domain: 'technology', ts: '9 min ago' },
    { source: 'India', relation: 'TRADE', target: 'Russia', domain: 'economy', ts: '13 min ago' },
    { source: 'Israel', relation: 'CONFLICT', target: 'Iran', domain: 'defense', ts: '17 min ago' },
    { source: 'Iran', relation: 'TECH_DEVELOPMENT', target: 'UAE', domain: 'technology', ts: '20 min ago' },
    { source: 'USA', relation: 'SANCTIONS', target: 'China', domain: 'economy', ts: '24 min ago' },
    { source: 'NATO', relation: 'ALLY', target: 'UN', domain: 'defense', ts: '28 min ago' },
    { source: 'Australia', relation: 'SANCTIONS', target: 'UN', domain: 'economy', ts: '31 min ago' },
    { source: 'Intel', relation: 'TECH_DEVELOPMENT', target: 'EU', domain: 'technology', ts: '35 min ago' },
    { source: 'NSA', relation: 'ALLY', target: 'AI', domain: 'technology', ts: '39 min ago' },
    { source: 'Meta', relation: 'TRADE', target: 'UN', domain: 'economy', ts: '43 min ago' },
    { source: 'Apple', relation: 'TECH_DEVELOPMENT', target: 'UN', domain: 'technology', ts: '47 min ago' },
    { source: 'UK', relation: 'CONFLICT', target: 'Ukraine', domain: 'defense', ts: '51 min ago' },
    { source: 'France', relation: 'CONFLICT', target: 'Middle East', domain: 'defense', ts: '55 min ago' },
    { source: 'Canada', relation: 'TRADE', target: 'Mexico', domain: 'economy', ts: '1 hr ago' },
    { source: 'WHO', relation: 'ALLY', target: 'AI', domain: 'technology', ts: '1 hr ago' },
    { source: 'Donald Trump', relation: 'CONFLICT', target: 'Iran', domain: 'defense', ts: '1 hr ago' },
]

const RELATION_META = {
    CONFLICT: { color: '#ef4444', icon: '⚔️', dotColor: '#ef4444' },
    SANCTIONS: { color: '#f59e0b', icon: '🚫', dotColor: '#f59e0b' },
    ALLY: { color: '#10b981', icon: '🤝', dotColor: '#10b981' },
    TRADE: { color: '#3b82f6', icon: '💱', dotColor: '#3b82f6' },
    TECH_DEVELOPMENT: { color: '#7c3aed', icon: '🔬', dotColor: '#7c3aed' },
}

const DOMAIN_BADGE = {
    defense: 'badge-red',
    economy: 'badge-blue',
    technology: 'badge-violet',
}

function countByRelation(feed) {
    const map = {}
    feed.forEach(f => { map[f.relation] = (map[f.relation] || 0) + 1 })
    return map
}

export default function IntelligenceFeed() {
    const [feed, setFeed] = useState(STATIC_FEED)
    const [filter, setFilter] = useState('all')
    const [domain, setDomain] = useState('all')
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [livePulse, setLivePulse] = useState(false)

    /* Try live backend; fall back to static */
    const fetchFeed = async () => {
        setLoading(true)
        try {
            const res = await api.get('/feed', { timeout: 4000 })
            if (res.data?.feed?.length) {
                setFeed(res.data.feed)
                setLivePulse(true)
            }
        } catch {
            /* use static data silently */
        }
        setLoading(false)
    }

    useEffect(() => {
        Promise.resolve().then(fetchFeed)
    }, [])

    const triggerRefresh = async () => {
        setLoading(true)
        try {
            await api.post('/pipeline/run', {}, { timeout: 5000 })
            // Wait for background job to finish some fetching before calling feed again
            setTimeout(fetchFeed, 6000)
        } catch (e) {
            console.error('Failed to trigger pipeline', e)
            setLoading(false)
        }
    }

    const relations = ['all', ...Object.keys(RELATION_META)]
    const domains = ['all', 'defense', 'economy', 'technology']

    const filtered = feed.filter(item => {
        const matchRel = filter === 'all' || item.relation === filter
        const matchDomain = domain === 'all' || item.domain === domain
        const matchQuery = !query ||
            item.source.toLowerCase().includes(query.toLowerCase()) ||
            item.target.toLowerCase().includes(query.toLowerCase())
        return matchRel && matchDomain && matchQuery
    })

    const counts = countByRelation(feed)

    return (
        <div>
            <div className="page-header">
                <h2>📰 Intelligence Feed</h2>
                <p>
                    {livePulse
                        ? 'Live feed from Neo4j — real-time geopolitical relationship stream'
                        : 'Demo feed — connect your FastAPI backend on port 8000 for live data'}
                    {livePulse && (
                        <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#34d399', fontSize: 12, fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse-green 2s infinite' }} />
                            LIVE
                        </span>
                    )}
                </p>
            </div>

            {/* Summary stats */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {Object.entries(RELATION_META).map(([rel, meta]) => (
                    <div className="stat-card" key={rel} style={{ cursor: 'pointer' }} onClick={() => setFilter(rel === filter ? 'all' : rel)}>
                        <div className="accent-bar" style={{ background: meta.color }} />
                        <div style={{ paddingLeft: 10 }}>
                            <div style={{ fontSize: 20 }}>{meta.icon}</div>
                            <div className="card-value" style={{ color: meta.color, fontSize: 26 }}>{counts[rel] || 0}</div>
                            <div className="card-sub">{rel}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter toolbar */}
            <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search entity..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            background: '#0f172a',
                            border: '1px solid #1e3a5f',
                            borderRadius: 6,
                            color: '#f1f5f9',
                            padding: '7px 12px',
                            fontSize: 13,
                            fontFamily: 'var(--font-sans)',
                            outline: 'none',
                            minWidth: 180,
                        }}
                    />
                    <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
                        {relations.map(r => <option key={r} value={r}>{r === 'all' ? 'All Relations' : r}</option>)}
                    </select>
                    <select className="filter-select" value={domain} onChange={e => setDomain(e.target.value)}>
                        {domains.map(d => <option key={d} value={d}>{d === 'all' ? 'All Domains' : d}</option>)}
                    </select>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#475569' }}>
                        Showing {filtered.length} of {feed.length} events
                    </span>
                    <button 
                        className="btn btn-primary btn-sm" 
                        onClick={triggerRefresh} 
                        disabled={loading}
                        style={{ marginLeft: 10 }}
                    >
                        {loading ? '⏳ Refreshing...' : '🔄 Fetch Fresh News'}
                    </button>
                    {filter !== 'all' || domain !== 'all' || query ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setFilter('all'); setDomain('all'); setQuery('') }}>
                            Clear
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Feed list */}
            <div className="card">
                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner-ring" />
                        <span>Loading intelligence feed...</span>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                        No events match your filters.
                    </div>
                )}

                {!loading && filtered.map((item, i) => {
                    const meta = RELATION_META[item.relation] || { color: '#475569', icon: '•', dotColor: '#475569' }
                    return (
                        <div key={i} className="feed-item">
                            <div className="feed-dot" style={{ background: meta.dotColor }} />
                            <div className="feed-body" style={{ flex: 1 }}>
                                <div>
                                    <strong>{item.source}</strong>
                                    <span className="relation-arrow" style={{ color: meta.color }}>
                                        <span style={{ fontSize: 12 }}>{meta.icon}</span>
                                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.relation}</span>
                                        <span style={{ color: '#94a3b8' }}>→</span>
                                    </span>
                                    <strong>{item.target}</strong>
                                </div>
                                <div style={{ marginTop: 4, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span className={`badge ${DOMAIN_BADGE[item.domain] || 'badge-cyan'}`}>{item.domain}</span>
                                    <span className="feed-meta">{item.ts}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
