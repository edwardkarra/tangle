import React, { useState, useMemo } from 'react';

const Sidebar = ({ 
  notes, 
  selectedNote, 
  onSelectNote, 
  onCreateNote, 
  onDeleteNote, 
  collapsed, 
  onToggleCollapse 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'title'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'main', 'regular'

  const filteredAndSortedNotes = useMemo(() => {
    let notesList = Object.values(notes);
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      notesList = notesList.filter(note => 
        note.title.toLowerCase().includes(term) || 
        note.content.toLowerCase().includes(term)
      );
    }
    
    // Filter by type
    if (filterBy === 'main') {
      notesList = notesList.filter(note => note.isMainNote);
    } else if (filterBy === 'regular') {
      notesList = notesList.filter(note => !note.isMainNote);
    }
    
    // Sort notes
    notesList.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || a.content.substring(0, 50)).localeCompare(
            b.title || b.content.substring(0, 50)
          );
        case 'created':
          return b.createdAt - a.createdAt;
        case 'updated':
        default:
          return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
      }
    });
    
    return notesList;
  }, [notes, searchTerm, sortBy, filterBy]);

  const handleCreateNote = async () => {
    const newNote = await onCreateNote({
      title: '',
      content: 'New note',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      }
    });
    
    if (newNote) {
      onSelectNote(newNote.id);
    }
  };

  const handleNoteClick = (noteId) => {
    onSelectNote(noteId);
  };

  const handleDeleteNote = (e, noteId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(noteId);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getPreviewText = (note) => {
    const text = note.content || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const noteCount = Object.keys(notes).length;
  const mainNoteCount = Object.values(notes).filter(note => note.isMainNote).length;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <h1 className="sidebar-title">Tangle</h1>
        )}
        <button 
          className="toggle-btn" 
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      {!collapsed && (
        <>
          <div className="sidebar-controls">
            <button 
              className="create-note-btn"
              onClick={handleCreateNote}
              title="Create New Note (Ctrl+N)"
            >
              <span>+ New Note</span>
            </button>
            
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <select 
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated">Sort by Updated</option>
                <option value="created">Sort by Created</option>
                <option value="title">Sort by Title</option>
              </select>
              
              <select 
                className="filter-select"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Notes</option>
                <option value="main">Main Notes</option>
                <option value="regular">Regular Notes</option>
              </select>
            </div>
          </div>
          
          <div className="sidebar-stats">
            <div className="stat">
              <span className="stat-number">{noteCount}</span>
              <span className="stat-label">Total Notes</span>
            </div>
            <div className="stat">
              <span className="stat-number">{mainNoteCount}</span>
              <span className="stat-label">Main Notes</span>
            </div>
          </div>
        </>
      )}
      
      <div className="sidebar-content">
        {collapsed ? (
          <div className="collapsed-notes">
            {Object.values(notes).slice(0, 10).map(note => (
              <div
                key={note.id}
                className={`collapsed-note-item ${
                  selectedNote === note.id ? 'selected' : ''
                } ${note.isMainNote ? 'main-note' : ''}`}
                onClick={() => handleNoteClick(note.id)}
                title={note.title || note.content.substring(0, 100)}
              >
                {note.isMainNote ? '★' : '●'}
              </div>
            ))}
          </div>
        ) : (
          <div className="note-list">
            {filteredAndSortedNotes.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? (
                  <>
                    <p>No notes found for "{searchTerm}"</p>
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <p>No notes yet</p>
                    <button 
                      className="create-first-note-btn"
                      onClick={handleCreateNote}
                    >
                      Create your first note
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredAndSortedNotes.map(note => (
                <div
                  key={note.id}
                  className={`note-item ${
                    selectedNote === note.id ? 'selected' : ''
                  } ${note.isMainNote ? 'main-note' : ''}`}
                  onClick={() => handleNoteClick(note.id)}
                >
                  <div className="note-header">
                    <div className="note-title">
                      {note.isMainNote && <span className="main-note-icon">★</span>}
                      {note.title || 'Untitled'}
                    </div>
                    <div className="note-actions">
                      <span className="note-date">
                        {formatDate(note.updatedAt || note.createdAt)}
                      </span>
                      <button
                        className="delete-note-btn"
                        onClick={(e) => handleDeleteNote(e, note.id)}
                        title="Delete Note"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="note-preview">
                    {getPreviewText(note)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .sidebar-controls {
          padding: 20px;
          border-bottom: 1px solid #e1e8ed;
        }
        
        .search-container {
          margin: 15px 0;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.8);
          transition: border-color 0.2s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }
        
        .filter-controls {
          display: flex;
          gap: 10px;
        }
        
        .filter-select {
          flex: 1;
          padding: 8px 10px;
          border: 1px solid #e1e8ed;
          border-radius: 4px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.8);
          cursor: pointer;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .sidebar-stats {
          display: flex;
          padding: 15px 20px;
          background: rgba(52, 152, 219, 0.05);
          border-bottom: 1px solid #e1e8ed;
        }
        
        .stat {
          flex: 1;
          text-align: center;
        }
        
        .stat-number {
          display: block;
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .stat-label {
          font-size: 11px;
          color: #7f8c8d;
          font-weight: 500;
        }
        
        .collapsed-notes {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .collapsed-note-item {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid #e1e8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
        }
        
        .collapsed-note-item:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: scale(1.1);
        }
        
        .collapsed-note-item.selected {
          background: #3498db;
          color: white;
          border-color: #2980b9;
        }
        
        .collapsed-note-item.main-note {
          border-color: #e74c3c;
          color: #e74c3c;
        }
        
        .collapsed-note-item.main-note.selected {
          background: #e74c3c;
          color: white;
        }
        
        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .note-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .note-item:hover .note-actions {
          opacity: 1;
        }
        
        .note-date {
          font-size: 10px;
          color: #95a5a6;
          font-weight: 500;
        }
        
        .delete-note-btn {
          background: none;
          border: none;
          color: #e74c3c;
          font-size: 16px;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }
        
        .delete-note-btn:hover {
          background: rgba(231, 76, 60, 0.1);
        }
        
        .main-note-icon {
          color: #e74c3c;
          margin-right: 5px;
          font-size: 12px;
        }
        
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #7f8c8d;
        }
        
        .empty-state p {
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .clear-search-btn,
        .create-first-note-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .clear-search-btn:hover,
        .create-first-note-btn:hover {
          background: #2980b9;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;