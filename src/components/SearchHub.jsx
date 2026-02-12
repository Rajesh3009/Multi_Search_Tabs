import { useState, useEffect } from 'react';
import defaultEngines from '../data/defaultEngines.json';
import './SearchHub.css';

function SearchHub() {
    const [query, setQuery] = useState('');
    const [engines, setEngines] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newSite, setNewSite] = useState({ name: '', url: '', icon: '' });

    useEffect(() => {
        const savedEngines = localStorage.getItem('search_engines');
        if (savedEngines) {
            setEngines(JSON.parse(savedEngines));
        } else {
            setEngines(defaultEngines);
        }
    }, []);

    const saveEngines = (newEngines) => {
        setEngines(newEngines);
        localStorage.setItem('search_engines', JSON.stringify(newEngines));
    };

    const toggleEngine = (id) => {
        const newEngines = engines.map(eng =>
            eng.id === id ? { ...eng, enabled: !eng.enabled } : eng
        );
        saveEngines(newEngines);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const activeEngines = engines.filter(eng => eng.enabled);
        if (activeEngines.length === 0) {
            alert('Please select at least one site to search!');
            return;
        }

        activeEngines.forEach(eng => {
            const searchUrl = eng.url.replace('%s', encodeURIComponent(query));
            window.open(searchUrl, '_blank');
        });
    };

    const exportToJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(engines, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "search_engines.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const importFromJson = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedEngines = JSON.parse(event.target.result);
                saveEngines(importedEngines);
            } catch (err) {
                alert('Invalid JSON file!');
            }
        };
        reader.readAsText(file);
    };

    const addSite = (e) => {
        e.preventDefault();
        if (!newSite.name || !newSite.url) return;

        const iconUrl = newSite.icon || `https://www.google.com/s2/favicons?domain=${newSite.url}&sz=64`;

        const newEngine = {
            id: Date.now().toString(),
            name: newSite.name,
            url: newSite.url.includes('%s') ? newSite.url : `${newSite.url}?q=%s`,
            icon: iconUrl,
            enabled: true
        };

        saveEngines([...engines, newEngine]);
        setNewSite({ name: '', url: '', icon: '' });
        setIsAdding(false);
    };

    const removeSite = (id, e) => {
        e.stopPropagation();
        if (confirm('Remove this search engine?')) {
            saveEngines(engines.filter(eng => eng.id !== id));
        }
    };

    return (
        <div className="app-container animate-fade-in">
            <header className="header">
                <h1>Multi-Search</h1>
                <p>Search everywhere, all at once.</p>
            </header>

            <main className="glass-card search-section">
                <form onSubmit={handleSearch} className="search-input-group">
                    <input
                        type="text"
                        placeholder="What are you looking for?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn-search">Search</button>
                </form>

                <div className="site-grid">
                    {engines.map(engine => (
                        <div
                            key={engine.id}
                            className={`glass-card site-item ${engine.enabled ? 'enabled' : ''}`}
                            onClick={() => toggleEngine(engine.id)}
                        >
                            <button
                                className="btn-remove"
                                onClick={(e) => removeSite(engine.id, e)}
                                title="Remove site"
                            >×</button>
                            <div className="site-toggle"></div>
                            <img src={engine.icon} alt="" className="site-icon" />
                            <span className="site-name">{engine.name}</span>
                        </div>
                    ))}
                    <div className="glass-card site-item add-btn" onClick={() => setIsAdding(true)}>
                        <span style={{ fontSize: '2rem', marginBottom: '4px' }}>+</span>
                        <span className="site-name">Add Site</span>
                    </div>
                </div>

                {isAdding && (
                    <div className="modal-overlay">
                        <div className="glass-card modal-content animate-fade-in">
                            <h3>Add New Search Engine</h3>
                            <form onSubmit={addSite} className="modal-form">
                                <input
                                    placeholder="Site Name (e.g. Bing)"
                                    value={newSite.name}
                                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Search URL (e.g. https://bing.com/search?q=%s)"
                                    value={newSite.url}
                                    onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Icon URL (optional)"
                                    value={newSite.icon}
                                    onChange={(e) => setNewSite({ ...newSite, icon: e.target.value })}
                                />
                                <p className="hint">Use <code>%s</code> as placeholder for your search query.</p>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                                    <button type="submit" className="btn-search">Add Engine</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="actions-footer">
                    <button className="btn-secondary" onClick={exportToJson}>Export JSON</button>
                    <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                        Import JSON
                        <input type="file" accept=".json" onChange={importFromJson} style={{ display: 'none' }} />
                    </label>
                </div>
            </main>
        </div>
    );
}

export default SearchHub;
