import { useState, useEffect } from 'react';
import defaultEngines from '../data/defaultEngines.json';
import './SearchHub.css';

function SearchHub() {
    const [query, setQuery] = useState('');
    const [engines, setEngines] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState([]);
    const [newSite, setNewSite] = useState({ name: '', url: '', icon: '' });
    const [editingSite, setEditingSite] = useState(null);

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
        if (isDeleteMode) {
            setSelectedForDeletion(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
            return;
        }
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

    const startEditing = (e, engine) => {
        e.stopPropagation();
        setEditingSite({ ...engine });
        setIsEditing(true);
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!editingSite.name || !editingSite.url) return;

        const newEngines = engines.map(eng =>
            eng.id === editingSite.id ? { ...editingSite } : eng
        );

        saveEngines(newEngines);
        setEditingSite(null);
        setIsEditing(false);
    };

    const deleteSelected = () => {
        if (selectedForDeletion.length === 0) return;
        setIsConfirmingDelete(true);
    };

    const confirmDelete = () => {
        const newEngines = engines.filter(eng => !selectedForDeletion.includes(eng.id));
        saveEngines(newEngines);
        setSelectedForDeletion([]);
        setIsConfirmingDelete(false);
        setIsDeleteMode(false);
    };

    return (
        <div className="app-container animate-fade-in">
            <header className="header">
                <h1>Multi Search Tabs</h1>
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
                            className={`glass-card site-item ${engine.enabled ? 'enabled' : ''} ${isDeleteMode && selectedForDeletion.includes(engine.id) ? 'selecting-delete' : ''} ${isDeleteMode ? 'delete-mode' : ''}`}
                            onClick={() => toggleEngine(engine.id)}
                        >
                            <div className="site-toggle"></div>
                            {isDeleteMode && (
                                <button
                                    className="edit-btn-small"
                                    onClick={(e) => startEditing(e, engine)}
                                    title="Edit site"
                                >
                                    ✎
                                </button>
                            )}
                            <img src={engine.icon} alt="" className="site-icon" />
                            <span className="site-name">{engine.name}</span>
                        </div>
                    ))}
                    {!isDeleteMode && (
                        <div className="glass-card site-item add-btn" onClick={() => setIsAdding(true)}>
                            <span style={{ fontSize: '2rem', marginBottom: '4px' }}>+</span>
                            <span className="site-name">Add Site</span>
                        </div>
                    )}
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

                {isEditing && (
                    <div className="modal-overlay">
                        <div className="glass-card modal-content animate-fade-in">
                            <h3>Edit Search Engine</h3>
                            <form onSubmit={saveEdit} className="modal-form">
                                <input
                                    placeholder="Site Name"
                                    value={editingSite.name}
                                    onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Search URL"
                                    value={editingSite.url}
                                    onChange={(e) => setEditingSite({ ...editingSite, url: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Icon URL"
                                    value={editingSite.icon}
                                    onChange={(e) => setEditingSite({ ...editingSite, icon: e.target.value })}
                                />
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button type="submit" className="btn-search">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isConfirmingDelete && (
                    <div className="modal-overlay">
                        <div className="glass-card modal-content animate-fade-in">
                            <h3 style={{ color: 'var(--danger)' }}>Delete Selected Sites?</h3>
                            <p style={{ color: 'var(--text-muted)' }}>
                                Are you sure you want to delete {selectedForDeletion.length} selected site(s)? This action cannot be undone.
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsConfirmingDelete(false)}>Cancel</button>
                                <button type="button" className="btn-search delete-btn-active" onClick={confirmDelete}>Delete Sites</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="actions-footer">
                    {!isDeleteMode ? (
                        <>
                            <button className="btn-secondary" onClick={() => setIsDeleteMode(true)}>Manage Sites</button>
                            <button className="btn-secondary" onClick={exportToJson}>Export JSON</button>
                            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                                Import JSON
                                <input type="file" accept=".json" onChange={importFromJson} style={{ display: 'none' }} />
                            </label>
                        </>
                    ) : (
                        <>
                            <button className="btn-search delete-btn-active" onClick={deleteSelected} disabled={selectedForDeletion.length === 0}>
                                Delete Selected ({selectedForDeletion.length})
                            </button>
                            <button className="btn-secondary" onClick={() => { setIsDeleteMode(false); setSelectedForDeletion([]); }}>
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SearchHub;
