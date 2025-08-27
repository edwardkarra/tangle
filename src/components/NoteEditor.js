import React, { useState, useEffect, useRef } from 'react';

const NoteEditor = ({ note, onUpdateNote, onDeleteNote, onClose }) => {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [isMainNote, setIsMainNote] = useState(note.isMainNote || false);
  const [hasChanges, setHasChanges] = useState(false);
  const titleInputRef = useRef(null);
  const contentTextareaRef = useRef(null);

  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
    setIsMainNote(note.isMainNote || false);
    setHasChanges(false);
  }, [note]);

  useEffect(() => {
    // Focus on title input when editor opens
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Ctrl/Cmd + Enter to save and close
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, isMainNote]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleMainNoteToggle = () => {
    setIsMainNote(!isMainNote);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (hasChanges) {
      onUpdateNote(note.id, {
        title: title.trim(),
        content: content.trim(),
        isMainNote
      });
      setHasChanges(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      onDeleteNote(note.id);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Do you want to save before closing?')) {
        handleSave();
      }
    }
    onClose();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  return (
    <div className="note-editor fade-in">
      <div className="note-editor-header">
        <div className="note-editor-title">
          {note.title || 'Untitled Note'}
          {hasChanges && <span className="unsaved-indicator">*</span>}
        </div>
        <button className="close-btn" onClick={handleClose} title="Close (Esc)">
          ×
        </button>
      </div>
      
      <div className="note-editor-content">
        <div className="form-group">
          <label htmlFor="note-title" className="form-label">
            Title
          </label>
          <input
            ref={titleInputRef}
            id="note-title"
            type="text"
            className="note-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter note title..."
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="note-content" className="form-label">
            Content
          </label>
          <textarea
            ref={contentTextareaRef}
            id="note-content"
            className="note-input note-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="Write your note here..."
          />
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isMainNote}
              onChange={handleMainNoteToggle}
              className="checkbox-input"
            />
            <span className="checkbox-text">Mark as main note</span>
          </label>
          <div className="help-text">
            Main notes can be used to organize and group related notes
          </div>
        </div>
        
        <div className="note-stats">
          <div className="stat-item">
            <span className="stat-label">Words:</span>
            <span className="stat-value">{wordCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Characters:</span>
            <span className="stat-value">{charCount}</span>
          </div>
        </div>
        
        <div className="note-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{formatDate(note.createdAt)}</span>
          </div>
          {note.updatedAt && note.updatedAt !== note.createdAt && (
            <div className="metadata-item">
              <span className="metadata-label">Modified:</span>
              <span className="metadata-value">{formatDate(note.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="note-controls">
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={!hasChanges}
          title="Save (Ctrl+S)"
        >
          Save
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleClose}
          title="Close (Esc)"
        >
          Close
        </button>
        <button 
          className="btn btn-danger" 
          onClick={handleDelete}
          title="Delete Note"
        >
          Delete
        </button>
      </div>
      
      <style jsx>{`
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
          color: #2c3e50;
        }
        
        .checkbox-input {
          margin-right: 10px;
          width: 16px;
          height: 16px;
          accent-color: #3498db;
        }
        
        .checkbox-text {
          font-weight: 500;
        }
        
        .help-text {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 5px;
          font-style: italic;
        }
        
        .unsaved-indicator {
          color: #e74c3c;
          margin-left: 5px;
          font-weight: bold;
        }
        
        .note-stats {
          display: flex;
          gap: 20px;
          padding: 15px;
          background: rgba(52, 152, 219, 0.05);
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-label {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: 500;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .note-metadata {
          padding: 15px;
          background: rgba(149, 165, 166, 0.05);
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .metadata-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .metadata-item:last-child {
          margin-bottom: 0;
        }
        
        .metadata-label {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: 500;
        }
        
        .metadata-value {
          font-size: 12px;
          color: #2c3e50;
          font-weight: 500;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default NoteEditor;