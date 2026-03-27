import { useEffect, useRef, useState, useMemo } from 'react'
import { Network, DataSet } from 'vis-network/standalone'

/* ── static sample data (mirrors graph.html output) ── */
const SAMPLE_NODES = [
    { id: 'USA', label: 'USA', group: 'country' },
    { id: 'Iran', label: 'Iran', group: 'country' },
    { id: 'Russia', label: 'Russia', group: 'country' },
    { id: 'India', label: 'India', group: 'country' },
    { id: 'China', label: 'China', group: 'country' },
    { id: 'Israel', label: 'Israel', group: 'country' },
    { id: 'UK', label: 'UK', group: 'country' },
    { id: 'Ukraine', label: 'Ukraine', group: 'country' },
    { id: 'France', label: 'France', group: 'country' },
    { id: 'Canada', label: 'Canada', group: 'country' },
    { id: 'Mexico', label: 'Mexico', group: 'country' },
    { id: 'Australia', label: 'Australia', group: 'country' },
    { id: 'UAE', label: 'UAE', group: 'country' },
    { id: 'UN', label: 'UN', group: 'org' },
    { id: 'NATO', label: 'NATO', group: 'org' },
    { id: 'EU', label: 'EU', group: 'org' },
    { id: 'IMF', label: 'IMF', group: 'org' },
    { id: 'WHO', label: 'WHO', group: 'org' },
    { id: 'NSA', label: 'NSA', group: 'org' },
    { id: 'AI', label: 'AI', group: 'concept' },
    { id: 'Intel', label: 'Intel', group: 'org' },
    { id: 'Apple', label: 'Apple', group: 'org' },
    { id: 'Meta', label: 'Meta', group: 'org' },
    { id: 'DonaldTrump', label: 'Donald Trump', group: 'person' },
]

const SAMPLE_EDGES = [
    { from: 'USA', to: 'Iran', label: 'CONFLICT' },
    { from: 'Russia', to: 'India', label: 'SANCTIONS' },
    { from: 'Russia', to: 'UN', label: 'SANCTIONS' },
    { from: 'Russia', to: 'Iran', label: 'CONFLICT' },
    { from: 'Russia', to: 'Israel', label: 'CONFLICT' },
    { from: 'India', to: 'Iran', label: 'CONFLICT' },
    { from: 'China', to: 'UN', label: 'TECH_DEVELOPMENT' },
    { from: 'UN', to: 'EU', label: 'TECH_DEVELOPMENT' },
    { from: 'UN', to: 'AI', label: 'TECH_DEVELOPMENT' },
    { from: 'UN', to: 'NSA', label: 'TECH_DEVELOPMENT' },
    { from: 'UN', to: 'IMF', label: 'CONFLICT' },
    { from: 'Intel', to: 'UN', label: 'TECH_DEVELOPMENT' },
    { from: 'Intel', to: 'EU', label: 'CONFLICT' },
    { from: 'NATO', to: 'UN', label: 'ALLY' },
    { from: 'Iran', to: 'UN', label: 'TECH_DEVELOPMENT' },
    { from: 'Iran', to: 'NATO', label: 'TECH_DEVELOPMENT' },
    { from: 'Iran', to: 'AI', label: 'TECH_DEVELOPMENT' },
    { from: 'Iran', to: 'UAE', label: 'TECH_DEVELOPMENT' },
    { from: 'Iran', to: 'DonaldTrump', label: 'TECH_DEVELOPMENT' },
    { from: 'Iran', to: 'EU', label: 'CONFLICT' },
    { from: 'Israel', to: 'UN', label: 'TECH_DEVELOPMENT' },
    { from: 'Israel', to: 'Iran', label: 'TECH_DEVELOPMENT' },
    { from: 'Israel', to: 'DonaldTrump', label: 'CONFLICT' },
    { from: 'UK', to: 'UN', label: 'CONFLICT' },
    { from: 'UK', to: 'Israel', label: 'CONFLICT' },
    { from: 'UK', to: 'Ukraine', label: 'CONFLICT' },
    { from: 'Canada', to: 'Mexico', label: 'TRADE' },
    { from: 'Australia', to: 'UN', label: 'SANCTIONS' },
    { from: 'WHO', to: 'EU', label: 'TRADE' },
    { from: 'WHO', to: 'AI', label: 'ALLY' },
    { from: 'Apple', to: 'UN', label: 'TECH_DEVELOPMENT' },
    { from: 'Meta', to: 'UN', label: 'TRADE' },
    { from: 'NSA', to: 'AI', label: 'ALLY' },
]

const RELATION_COLORS = {
    CONFLICT: '#ef4444',
    SANCTIONS: '#f59e0b',
    ALLY: '#10b981',
    TRADE: '#3b82f6',
    TECH_DEVELOPMENT: '#7c3aed',
}

const GROUP_COLORS = {
    country: '#3b82f6',
    org: '#06b6d4',
    concept: '#7c3aed',
    person: '#f59e0b',
}

const MOCK_STREAM_DATA = [
    { from: 'China', to: 'Taiwan', label: 'CONFLICT', groupFrom: 'country', groupTo: 'country' },
    { from: 'USA', to: 'Taiwan', label: 'ALLY', groupFrom: 'country', groupTo: 'country' },
    { from: 'EU', to: 'China', label: 'SANCTIONS', groupFrom: 'org', groupTo: 'country' },
    { from: 'Russia', to: 'NorthKorea', label: 'TRADE', groupFrom: 'country', groupTo: 'country' },
    { from: 'NorthKorea', to: 'UN', label: 'CONFLICT', groupFrom: 'country', groupTo: 'org' },
    { from: 'Japan', to: 'USA', label: 'ALLY', groupFrom: 'country', groupTo: 'country' },
]

function buildVisNodes(filterGroup) {
    return SAMPLE_NODES
        .filter(n => filterGroup === 'all' || n.group === filterGroup)
        .map(n => ({
            id: n.id,
            label: n.label,
            color: {
                background: GROUP_COLORS[n.group],
                border: GROUP_COLORS[n.group],
                highlight: { background: '#f1f5f9', border: GROUP_COLORS[n.group] },
            },
            font: { color: '#f1f5f9', size: 13, face: 'Inter' },
            shape: 'dot',
            size: 18,
        }))
}

function buildVisEdges(filterRel) {
    const nodeIds = new Set(SAMPLE_NODES.map(n => n.id))
    return SAMPLE_EDGES
        .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
        .filter(e => filterRel === 'all' || e.label === filterRel)
        .map((e, i) => ({
            id: i,
            from: e.from,
            to: e.to,
            label: e.label,
            color: { color: RELATION_COLORS[e.label] || '#475569', opacity: 0.85 },
            font: { align: 'middle', color: '#94a3b8', size: 10, strokeWidth: 0 },
            arrows: { to: { enabled: true, scaleFactor: 0.6 } },
            smooth: { type: 'dynamic' },
            width: 1.5,
        }))
}

const SELECTED_RELATIONS = ['all', 'CONFLICT', 'SANCTIONS', 'ALLY', 'TRADE', 'TECH_DEVELOPMENT']
const SELECTED_GROUPS = ['all', 'country', 'org', 'concept', 'person']

export default function IntelligenceGraph() {
    const containerRef = useRef(null)
    const networkRef = useRef(null)
    const [filterRel, setFilterRel] = useState('all')
    const [filterGroup, setFilterGroup] = useState('all')
    const [selected, setSelected] = useState(null)
    const nodes = useMemo(() => new DataSet(buildVisNodes(filterGroup)), [filterGroup])
    const edges = useMemo(() => new DataSet(buildVisEdges(filterRel)), [filterRel])
    
    // We derive these directly to avoid extra setState calls
    const nodeCountValue = nodes.length
    const edgeCountValue = edges.length

    // Stream state
    const [isStreaming, setIsStreaming] = useState(false)
    const streamIdxRef = useRef(0)

    useEffect(() => {
        if (!containerRef.current) return

        const options = {
            physics: {
                enabled: true,
                forceAtlas2Based: {
                    gravitationalConstant: -55,
                    springLength: 120,
                    springConstant: 0.08,
                    damping: 0.4,
                    centralGravity: 0.01,
                },
                solver: 'forceAtlas2Based',
                stabilization: { iterations: 800, fit: true },
            },
            interaction: { hover: true, tooltipDelay: 100 },
            configure: { enabled: false },
            edges: { smooth: { enabled: true, type: 'dynamic' } },
        }

        if (networkRef.current) { networkRef.current.destroy() }

        const network = new Network(containerRef.current, { nodes, edges }, options)
        networkRef.current = network

        network.on('click', (params) => {
            if (params.nodes.length) {
                const id = params.nodes[0]
                const node = networkRef.current.body.data.nodes.get(id)
                const allEdges = networkRef.current.body.data.edges.get()
                const connectedEdges = allEdges.filter(e => e.from === id || e.to === id)
                if (node) {
                    setSelected({ node, edges: connectedEdges })
                }
            } else {
                setSelected(null)
            }
        })

        return () => { if (networkRef.current) networkRef.current.destroy() }
    }, [filterRel, filterGroup, nodes, edges])

    // Stream effect
    useEffect(() => {
        let interval;
        if (isStreaming && networkRef.current) {
            interval = setInterval(() => {
                const nodes = networkRef.current.body.data.nodes;
                const edges = networkRef.current.body.data.edges;
                
                if (streamIdxRef.current >= MOCK_STREAM_DATA.length) {
                    setIsStreaming(false);
                    return;
                }
                const data = MOCK_STREAM_DATA[streamIdxRef.current];
                streamIdxRef.current++;
                
                if (!nodes.get(data.from)) {
                    nodes.add({
                        id: data.from, label: data.from, shape: 'dot', size: 24,
                        color: { background: GROUP_COLORS[data.groupFrom], border: '#f87171', highlight: { border: '#f87171' } },
                        font: { color: '#f87171', size: 15, face: 'Inter', bold: true }
                    })
                }
                if (!nodes.get(data.to)) {
                    nodes.add({
                        id: data.to, label: data.to, shape: 'dot', size: 24,
                        color: { background: GROUP_COLORS[data.groupTo], border: '#f87171', highlight: { border: '#f87171' } },
                        font: { color: '#f87171', size: 15, face: 'Inter', bold: true }
                    })
                }
                
                edges.add({
                    from: data.from, to: data.to, label: data.label,
                    color: { color: RELATION_COLORS[data.label] || '#475569', opacity: 1 },
                    font: { align: 'middle', color: '#f87171', size: 11, strokeWidth: 0, face: 'JetBrains Mono' },
                    arrows: { to: { enabled: true, scaleFactor: 0.8 } },
                    width: 3,
                });
                
                // Highlight the new nodes briefly
                networkRef.current.selectNodes([data.from, data.to]);
                setTimeout(() => networkRef.current.unselectAll(), 800);
            }, 1500)
        }
        return () => clearInterval(interval)
    }, [isStreaming])

    return (
        <div>
            <div className="page-header">
                <h2>🕸 Intelligence Graph</h2>
                <p>Interactive knowledge graph — entities and relationships extracted from global news</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
                {[
                    { v: nodeCountValue, l: 'Nodes', c: '#3b82f6' },
                    { v: edgeCountValue, l: 'Edges', c: '#06b6d4' },
                    { v: '5', l: 'Relation Types', c: '#7c3aed' },
                    { v: '4', l: 'Entity Groups', c: '#10b981' },
                ].map(s => (
                    <div className="stat-card" key={s.l}>
                        <div className="accent-bar" style={{ background: s.c }} />
                        <div className="card-value" style={{ paddingLeft: 10, color: s.c, fontSize: 26 }}>{s.v}</div>
                        <div className="card-sub" style={{ paddingLeft: 10 }}>{s.l}</div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="card" style={{ padding: '12px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em' }}>Relation:</span>
                    {Object.entries(RELATION_COLORS).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: v }} />
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{k}</span>
                        </div>
                    ))}
                    <div className="divider" style={{ width: 1, height: 20, margin: 0 }} />
                    <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em' }}>Entity:</span>
                    {Object.entries(GROUP_COLORS).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: v }} />
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{k}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Graph */}
            <div className="graph-container">
                <div className="graph-toolbar">
                    <span style={{ fontSize: 12, color: '#475569' }}>Filter:</span>
                    <select
                        className="filter-select"
                        value={filterRel}
                        onChange={e => setFilterRel(e.target.value)}
                    >
                        {SELECTED_RELATIONS.map(r => (
                            <option key={r} value={r}>{r === 'all' ? 'All Relations' : r}</option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value)}
                    >
                        {SELECTED_GROUPS.map(g => (
                            <option key={g} value={g}>{g === 'all' ? 'All Entity Types' : g}</option>
                        ))}
                    </select>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button 
                            className={`btn ${isStreaming ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setIsStreaming(!isStreaming)}
                            style={{ 
                                animation: isStreaming ? 'pulse-red 2s infinite' : 'none',
                                borderColor: isStreaming ? '#ef4444' : '',
                            }}
                        >
                            {isStreaming ? '🛑 Stop Live Stream' : '📡 Start Intel Stream'}
                        </button>
                        <div style={{ fontSize: 12, color: '#475569' }}>
                            Click a node to inspect
                        </div>
                    </div>
                </div>
                <div ref={containerRef} id="knowledge-graph" />
            </div>

            {/* Node detail panel */}
            {selected && (
                <div className="card mt-6">
                    <div className="card-title">🔍 Entity Detail — {selected.node.label}</div>
                    <div className="two-col mt-4">
                        <div>
                            <div style={{ marginBottom: 8 }}>
                                <span className={`badge badge-${selected.node.group === 'country' ? 'blue' : selected.node.group === 'org' ? 'cyan' : selected.node.group === 'person' ? 'amber' : 'violet'}`}>
                                    {selected.node.group}
                                </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                                <strong style={{ color: '#f1f5f9' }}>{selected.edges.length}</strong> connected relationships
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Edge breakdown</div>
                            {['CONFLICT', 'ALLY', 'TRADE', 'SANCTIONS', 'TECH_DEVELOPMENT'].map(rel => {
                                const cnt = selected.edges.filter(e => e.label === rel).length
                                if (!cnt) return null
                                return (
                                    <div key={rel} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e3a5f' }}>
                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{rel}</span>
                                        <span style={{ fontSize: 12, color: RELATION_COLORS[rel], fontWeight: 700 }}>{cnt}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
