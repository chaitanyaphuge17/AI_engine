import { useLocation, useNavigate } from 'react-router-dom'

const navItems = [
    { path: '/', icon: '🏠', label: 'Overview' },
    { path: '/graph', icon: '🕸', label: 'Intelligence Graph' },
    { path: '/map', icon: '🌍', label: 'Geospatial Map' },
    { path: '/analytics', icon: '📈', label: 'Influence Analytics' },
    { path: '/forecast', icon: '🤖', label: 'AI Conflict Forecast' },
    { path: '/feed', icon: '📰', label: 'Intelligence Feed' },
]

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation()
    const navigate = useNavigate()

    const handleNav = (path) => {
        navigate(path)
        if (onClose) onClose()
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">🌍</div>
                <h1>Global Ontology<br />Intelligence Engine</h1>
                <p>AI Strategic Platform</p>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>
                {navItems.map(item => (
                    <div
                        key={item.path}
                        className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="status-badge">
                    <div className="status-dot" />
                    System Operational
                </div>
            </div>
        </aside>
    )
}
