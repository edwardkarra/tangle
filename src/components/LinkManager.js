import React, { useState, useEffect } from 'react';
import storageManager from '../utils/storage';

const LinkManager = ({ 
  selectedNote, 
  notes, 
  connections, 
  onConnectionCreate, 
  onConnectionDelete, 
  onClose 
}) => {
  const [linkingMode, setLinkingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [connectedNotes, setConnectedNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedNote) {
      updateConnectedNotes();
      updateFilteredNotes();
    }
  }, [selectedNote, notes, connections, searchQuery]);

  const updateConnectedNotes = () => {
    if (!selectedNote) return;
    
    const connected = storageManager.getConnectedNotes(selectedNote.id);
    setConnectedNotes(connected);
  };

  const updateFilteredNotes = () => {
    if (!selectedNote) return;
    
    let filtered = notes.filter(note => note.id !== selectedNote.id);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }
    
    // Sort by relevance: unconnected notes first, then connected
    const connectedIds = new Set(connectedNotes.map(note => note.id));
    filtered.sort((a, b) => {
      const aConnected = connectedIds.has(a.id);
      const bConnected = connectedIds.has(b.id);
      
      if (aConnected && !bConnected) return 1;
      if (!aConnected && bConnected) return -1;
      
      // Secondary sort by title
      return a.title.localeCompare(b.title);
    });
    
    setFilteredNotes(filtered);
  };

  const handleCreateConnection = async (targetNote) => {
    if (!selectedNote || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await storageManager.createConnection(
        selectedNote.id, 
        targetNote.id,
        {
          type: 'manual',
          label: `${selectedNote.title} → ${targetNote.title}`
        }
      );
      
      if (result.success) {
        onConnectionCreate(result.connection);
        updateConnectedNotes();
        updateFilteredNotes();
      } else {
        console.error('Failed to create connection:', result.error);
      }
    } catch (error) {
      console.error('Error creating connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConnection = async (targetNote) => {
    if (!selectedNote || isLoading) return;
    
    setIsLoading(true);
    try {
      // Find the connection to delete
      const connection = connections.find(conn => 
        (conn.source === selectedNote.id && conn.target === targetNote.id) ||
        (conn.source === targetNote.id && conn.target === selectedNote.id)
      );
      
      if (connection) {
        const result = await storageManager.deleteConnection(connection.id);
        
        if (result.success) {
          onConnectionDelete(connection.id);
          updateConnectedNotes();
          updateFilteredNotes();
        } else {
          console.error('Failed to delete connection:', result.error);
        }
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = (noteId) => {
    return connectedNotes.some(note => note.id === noteId);
  };

  const getConnectionCount = (noteId) => {
    return connections.filter(conn => 
      conn.source === noteId || conn.target === noteId
    ).length;
  };

  if (!selectedNote) {
    return (
      <div className="link-manager-empty">
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h3>No Note Selected</h3>
          <p>Select a note to manage its connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="link-manager">
      <div className="link-manager-header">
        <div className="header-content">
          <h2 className="link-manager-title">
            <span className="link-icon">🔗</span>
            Link Manager
          </h2>
          <button className="close-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>
        
        <div className="selected-note-info">
          <div className="note-preview">
            <h3 className="note-title">{selectedNote.title}</h3>
            <p className="note-content-preview">
              {selectedNote.content.substring(0, 100)}
              {selectedNote.content.length > 100 ? '...' : ''}
            </p>
          </div>
          <div className="connection-stats">
            <span className="stat">
              <span className="stat-number">{connectedNotes.length}</span>
              <span className="stat-label">Connected</span>
            </span>
          </div>
        </div>
      </div>

      <div className="link-manager-content">
        {/* Connected Notes Section */}
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🔗</span>
              Connected Notes ({connectedNotes.length})
            </h3>
          </div>
          
          {connectedNotes.length === 0 ? (
            <div className="empty-section">
              <p>No connected notes yet</p>
              <small>Link notes together to create relationships</small>
            </div>
          ) : (
            <div className="notes-list">
              {connectedNotes.map(note => (
                <div key={note.id} className="note-item connected">
                  <div className="note-info">
                    <div className="note-title">{note.title}</div>
                    <div className="note-meta">
                      <span className="note-type">
                        {note.isMain ? '📌 Main' : '📝 Note'}
                      </span>
                      <span className="connection-count">
                        {getConnectionCount(note.id)} connections
                      </span>
                    </div>
                  </div>
                  <button
                    className="action-btn unlink-btn"
                    onClick={() => handleDeleteConnection(note)}
                    disabled={isLoading}
                    title="Remove connection"
                  >
                    ⛓️‍💥
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Notes Section */}
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              Available Notes
            </h3>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search notes to link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
          
          <div className="notes-list">
            {filteredNotes.length === 0 ? (
              <div className="empty-section">
                <p>No notes found</p>
                <small>Try adjusting your search or create new notes</small>
              </div>
            ) : (
              filteredNotes.map(note => {
                const connected = isConnected(note.id);
                return (
                  <div 
                    key={note.id} 
                    className={`note-item ${connected ? 'connected' : 'available'}`}
                  >
                    <div className="note-info">
                      <div className="note-title">{note.title}</div>
                      <div className="note-meta">
                        <span className="note-type">
                          {note.isMain ? '📌 Main' : '📝 Note'}
                        </span>
                        <span className="connection-count">
                          {getConnectionCount(note.id)} connections
                        </span>
                        {connected && (
                          <span className="connected-badge">Connected</span>
                        )}
                      </div>
                    </div>
                    
                    {connected ? (
                      <button
                        className="action-btn unlink-btn"
                        onClick={() => handleDeleteConnection(note)}
                        disabled={isLoading}
                        title="Remove connection"
                      >
                        ⛓️‍💥
                      </button>
                    ) : (
                      <button
                        className="action-btn link-btn"
                        onClick={() => handleCreateConnection(note)}
                        disabled={isLoading}
                        title="Create connection"
                      >
                        🔗
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .link-manager {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        
        .link-manager-empty {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 60px 40px;
          text-align: center;
        }
        
        .empty-state {
          color: #6c757d;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        .empty-state h3 {
          margin: 0 0 10px;
          color: #2c3e50;
        }
        
        .link-manager-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px 30px;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .link-manager-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .link-icon {
          font-size: 24px;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .selected-note-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 15px;
        }
        
        .note-preview {
          flex: 1;
        }
        
        .note-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 5px;
        }
        
        .note-content-preview {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
          line-height: 1.4;
        }
        
        .connection-stats {
          display: flex;
          gap: 20px;
        }
        
        .stat {
          text-align: center;
        }
        
        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: 700;
        }
        
        .stat-label {
          display: block;
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .link-manager-content {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }
        
        .section {
          border-bottom: 1px solid #e1e8ed;
        }
        
        .section:last-child {
          border-bottom: none;
        }
        
        .section-header {
          padding: 20px 30px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #e1e8ed;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-icon {
          font-size: 18px;
        }
        
        .search-container {
          position: relative;
          width: 250px;
        }
        
        .search-input {
          width: 100%;
          padding: 8px 35px 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }
        
        .search-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 14px;
        }
        
        .notes-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .empty-section {
          padding: 40px 30px;
          text-align: center;
          color: #6c757d;
        }
        
        .empty-section p {
          margin: 0 0 5px;
          font-weight: 500;
        }
        
        .empty-section small {
          font-size: 13px;
          opacity: 0.8;
        }
        
        .note-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 30px;
          border-bottom: 1px solid #f1f3f4;
          transition: all 0.2s ease;
        }
        
        .note-item:hover {
          background: #f8f9fa;
        }
        
        .note-item:last-child {
          border-bottom: none;
        }
        
        .note-item.connected {
          background: rgba(52, 152, 219, 0.05);
          border-left: 3px solid #3498db;
        }
        
        .note-info {
          flex: 1;
        }
        
        .note-item .note-title {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 5px;
        }
        
        .note-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 12px;
          color: #6c757d;
        }
        
        .note-type {
          font-weight: 500;
        }
        
        .connection-count {
          opacity: 0.8;
        }
        
        .connected-badge {
          background: #3498db;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .action-btn {
          background: none;
          border: 1px solid transparent;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          min-width: 40px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .link-btn {
          color: #27ae60;
          border-color: #27ae60;
        }
        
        .link-btn:hover:not(:disabled) {
          background: #27ae60;
          color: white;
          transform: translateY(-1px);
        }
        
        .unlink-btn {
          color: #e74c3c;
          border-color: #e74c3c;
        }
        
        .unlink-btn:hover:not(:disabled) {
          background: #e74c3c;
          color: white;
          transform: translateY(-1px);
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        @media (max-width: 768px) {
          .link-manager {
            margin: 10px;
            max-height: 90vh;
          }
          
          .link-manager-header {
            padding: 20px;
          }
          
          .selected-note-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .section-header {
            padding: 15px 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .search-container {
            width: 100%;
          }
          
          .note-item {
            padding: 12px 20px;
          }
          
          .note-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default LinkManager;