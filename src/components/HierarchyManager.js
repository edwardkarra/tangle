import React, { useState, useEffect } from 'react';
import storageManager from '../utils/storage';

const HierarchyManager = ({ 
  notes, 
  connections, 
  onNoteUpdate, 
  onNoteSelect, 
  selectedNoteId 
}) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [hierarchyData, setHierarchyData] = useState({ mainNotes: [], orphanNotes: [] });
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'flat'
  const [sortBy, setSortBy] = useState('title'); // 'title', 'created', 'updated'

  useEffect(() => {
    buildHierarchy();
  }, [notes, connections]);

  const buildHierarchy = () => {
    const mainNotes = notes.filter(note => note.isMain);
    const regularNotes = notes.filter(note => !note.isMain);
    
    // Group regular notes under their connected main notes
    const hierarchy = mainNotes.map(mainNote => {
      const connectedNotes = getConnectedNotes(mainNote.id, regularNotes);
      return {
        ...mainNote,
        children: sortNotes(connectedNotes, sortBy),
        childCount: connectedNotes.length
      };
    });
    
    // Find orphan notes (regular notes not connected to any main note)
    const connectedToMainIds = new Set();
    hierarchy.forEach(mainNote => {
      mainNote.children.forEach(child => {
        connectedToMainIds.add(child.id);
      });
    });
    
    const orphanNotes = regularNotes.filter(note => !connectedToMainIds.has(note.id));
    
    setHierarchyData({
      mainNotes: sortNotes(hierarchy, sortBy),
      orphanNotes: sortNotes(orphanNotes, sortBy)
    });
  };

  const getConnectedNotes = (mainNoteId, candidateNotes) => {
    const connectedIds = connections
      .filter(conn => 
        (conn.source === mainNoteId || conn.target === mainNoteId)
      )
      .map(conn => 
        conn.source === mainNoteId ? conn.target : conn.source
      );
    
    return candidateNotes.filter(note => connectedIds.includes(note.id));
  };

  const sortNotes = (notes, criteria) => {
    return [...notes].sort((a, b) => {
      switch (criteria) {
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'updated':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'title':
        default:
          return a.title.localeCompare(b.title);
      }
    });
  };

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleMainNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const result = await storageManager.updateNote(noteId, {
      isMain: !note.isMain
    });
    
    if (result.success) {
      onNoteUpdate(result.note);
    }
  };

  const expandAll = () => {
    const allGroupIds = hierarchyData.mainNotes.map(note => note.id);
    setExpandedGroups(new Set(allGroupIds));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getConnectionCount = (noteId) => {
    return connections.filter(conn => 
      conn.source === noteId || conn.target === noteId
    ).length;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNote = (note, isChild = false, parentId = null) => {
    const isSelected = selectedNoteId === note.id;
    const connectionCount = getConnectionCount(note.id);
    
    return (
      <div 
        key={note.id} 
        className={`hierarchy-note ${isChild ? 'child-note' : 'main-note'} ${
          isSelected ? 'selected' : ''
        }`}
        onClick={() => onNoteSelect(note)}
      >
        <div className="note-content">
          <div className="note-header">
            <div className="note-title-section">
              {!isChild && (
                <button
                  className="main-note-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMainNote(note.id);
                  }}
                  title={note.isMain ? 'Remove from main notes' : 'Make main note'}
                >
                  {note.isMain ? '📌' : '📝'}
                </button>
              )}
              
              <h3 className="note-title">{note.title}</h3>
              
              <div className="note-badges">
                {note.isMain && <span className="badge main-badge">Main</span>}
                {connectionCount > 0 && (
                  <span className="badge connection-badge">
                    {connectionCount} link{connectionCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {!isChild && note.children && note.children.length > 0 && (
              <button
                className="expand-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(note.id);
                }}
                title={expandedGroups.has(note.id) ? 'Collapse group' : 'Expand group'}
              >
                <span className={`arrow ${expandedGroups.has(note.id) ? 'expanded' : ''}`}>
                  ▶
                </span>
                <span className="child-count">({note.childCount})</span>
              </button>
            )}
          </div>
          
          <div className="note-preview">
            {note.content.substring(0, 120)}
            {note.content.length > 120 ? '...' : ''}
          </div>
          
          <div className="note-meta">
            <span className="note-date">
              Updated {formatDate(note.updatedAt)}
            </span>
            {isChild && parentId && (
              <span className="parent-link">
                Child of main note
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHierarchyView = () => {
    return (
      <div className="hierarchy-view">
        {/* Main Notes with Children */}
        {hierarchyData.mainNotes.map(mainNote => (
          <div key={mainNote.id} className="note-group">
            {renderNote(mainNote)}
            
            {expandedGroups.has(mainNote.id) && mainNote.children.length > 0 && (
              <div className="children-container">
                {mainNote.children.map(childNote => 
                  renderNote(childNote, true, mainNote.id)
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* Orphan Notes */}
        {hierarchyData.orphanNotes.length > 0 && (
          <div className="orphan-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📄</span>
                Unorganized Notes ({hierarchyData.orphanNotes.length})
              </h3>
              <small className="section-subtitle">
                These notes are not connected to any main note
              </small>
            </div>
            
            <div className="orphan-notes">
              {hierarchyData.orphanNotes.map(note => renderNote(note))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFlatView = () => {
    const allNotes = sortNotes(notes, sortBy);
    
    return (
      <div className="flat-view">
        {allNotes.map(note => renderNote(note))}
      </div>
    );
  };

  return (
    <div className="hierarchy-manager">
      <div className="hierarchy-controls">
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'hierarchy' ? 'active' : ''}`}
            onClick={() => setViewMode('hierarchy')}
            title="Hierarchical view"
          >
            🌳 Hierarchy
          </button>
          <button
            className={`view-btn ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => setViewMode('flat')}
            title="Flat list view"
          >
            📋 List
          </button>
        </div>
        
        <div className="sort-controls">
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title">Sort by Title</option>
            <option value="updated">Sort by Updated</option>
            <option value="created">Sort by Created</option>
          </select>
        </div>
        
        {viewMode === 'hierarchy' && hierarchyData.mainNotes.length > 0 && (
          <div className="expand-controls">
            <button className="control-btn" onClick={expandAll} title="Expand all groups">
              ⬇️ Expand All
            </button>
            <button className="control-btn" onClick={collapseAll} title="Collapse all groups">
              ⬆️ Collapse All
            </button>
          </div>
        )}
      </div>
      
      <div className="hierarchy-content">
        {viewMode === 'hierarchy' ? renderHierarchyView() : renderFlatView()}
      </div>
      
      <style jsx>{`
        .hierarchy-manager {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .hierarchy-controls {
          padding: 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e1e8ed;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .view-controls {
          display: flex;
          gap: 8px;
        }
        
        .view-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .view-btn:hover {
          background: #f3f4f6;
        }
        
        .view-btn.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }
        
        .sort-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .sort-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        
        .expand-controls {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }
        
        .control-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .control-btn:hover {
          background: #f3f4f6;
        }
        
        .hierarchy-content {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }
        
        .note-group {
          margin-bottom: 8px;
        }
        
        .hierarchy-note {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          margin: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .hierarchy-note:hover {
          border-color: #3498db;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
        }
        
        .hierarchy-note.selected {
          border-color: #3498db;
          background: rgba(52, 152, 219, 0.05);
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }
        
        .main-note {
          border-left: 4px solid #3498db;
        }
        
        .child-note {
          margin-left: 40px;
          border-left: 4px solid #95a5a6;
          background: #fafbfc;
        }
        
        .children-container {
          margin-top: 4px;
          margin-bottom: 12px;
        }
        
        .note-content {
          padding: 16px;
        }
        
        .note-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .note-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        
        .main-note-toggle {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .main-note-toggle:hover {
          background: rgba(52, 152, 219, 0.1);
        }
        
        .note-title {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
          flex: 1;
        }
        
        .note-badges {
          display: flex;
          gap: 6px;
        }
        
        .badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .main-badge {
          background: #3498db;
          color: white;
        }
        
        .connection-badge {
          background: #95a5a6;
          color: white;
        }
        
        .expand-toggle {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6c757d;
          transition: all 0.2s ease;
        }
        
        .expand-toggle:hover {
          background: #f3f4f6;
          border-color: #3498db;
        }
        
        .arrow {
          transition: transform 0.2s ease;
          font-size: 10px;
        }
        
        .arrow.expanded {
          transform: rotate(90deg);
        }
        
        .child-count {
          font-weight: 600;
        }
        
        .note-preview {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        
        .note-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #95a5a6;
        }
        
        .note-date {
          font-weight: 500;
        }
        
        .parent-link {
          font-style: italic;
        }
        
        .orphan-section {
          margin-top: 32px;
          border-top: 2px solid #e1e8ed;
          padding-top: 24px;
        }
        
        .section-header {
          padding: 0 16px 16px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-icon {
          font-size: 20px;
        }
        
        .section-subtitle {
          color: #6c757d;
          font-style: italic;
        }
        
        .orphan-notes {
          margin-top: 8px;
        }
        
        .flat-view .hierarchy-note {
          margin: 8px 16px;
        }
        
        @media (max-width: 768px) {
          .hierarchy-controls {
            padding: 15px;
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }
          
          .view-controls,
          .expand-controls {
            justify-content: center;
          }
          
          .expand-controls {
            margin-left: 0;
          }
          
          .hierarchy-note {
            margin: 6px 12px;
          }
          
          .child-note {
            margin-left: 24px;
          }
          
          .note-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .note-title-section {
            width: 100%;
          }
          
          .note-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default HierarchyManager;