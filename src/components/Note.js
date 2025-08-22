import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Note.css';

const Note = ({ 
  note, 
  isSelected, 
  onUpdate, 
  onDelete, 
  onSelect, 
  onStartLink, 
  onEndLink, 
  isCreatingLink, 
  linkStart 
}) => {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showConnectionPoints, setShowConnectionPoints] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const noteRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Debounced update function
  const debouncedUpdate = useCallback((updates) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate({ ...note, ...updates });
    }, 500);
  }, [note, onUpdate]);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdate({ title: newTitle });
  }, [debouncedUpdate]);

  // Handle content change
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedUpdate({ content: newContent });
  }, [debouncedUpdate]);

  // Handle mouse down for dragging - any mouse hold on note triggers drag
  const handleMouseDown = useCallback((e) => {
    // Don't start drag if clicking on input fields, buttons, connection points, or editable areas
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'BUTTON' ||
        e.target.closest('.connection-point') ||
        e.target.closest('.resize-handle') ||
        e.target.closest('.note-title-display') ||
        e.target.closest('.note-body-display')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (note.x || 0),
      y: e.clientY - (note.y || 0)
    });
  }, [note.x, note.y]);

  // Handle resize mouse down
  const handleResizeMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: note.width || 300,
      height: note.height || 200
    });
  }, [note.width, note.height]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onUpdate({ ...note, x: Math.max(0, newX), y: Math.max(0, newY) });
    } else if (isResizing) {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(200, resizeStart.width + deltaX);
      const newHeight = Math.max(150, resizeStart.height + deltaY);
      debouncedUpdate({ width: Math.min(800, newWidth), height: Math.min(600, newHeight) });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, debouncedUpdate, note, onUpdate]);

  // Handle mouse up
  const handleMouseUp = useCallback((e) => {
    if (isDragging || isResizing) {
      e.preventDefault();
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, isResizing]);

  // Handle note selection
  const handleNoteClick = useCallback((e) => {
    // Don't select note if clicking on input fields or buttons
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') {
      return;
    }
    e.stopPropagation();
    onSelect(note.id, !isSelected);
  }, [note.id, isSelected, onSelect]);

  // Handle double-click for editing title
  const handleTitleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingTitle(true);
    // Ensure focus is set after state update
    setTimeout(() => {
      const input = noteRef.current?.querySelector('.note-title');
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }, []);

  // Handle double-click for editing content
  const handleContentDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingContent(true);
    // Ensure focus is set after state update
    setTimeout(() => {
      const textarea = noteRef.current?.querySelector('.note-body');
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 0);
  }, []);

  // Handle title blur
  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  // Handle content blur
  const handleContentBlur = useCallback(() => {
    setIsEditingContent(false);
  }, []);

  // Handle connection point click
  const handleConnectionClick = useCallback((e, position) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCreatingLink && linkStart) {
      onEndLink(note.id, position);
    } else {
      onStartLink(note.id, position);
    }
  }, [note.id, isCreatingLink, linkStart, onStartLink, onEndLink]);

  // Handle connection point mouse down to prevent dragging
  const handleConnectionMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle delete
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  }, [note.id, onDelete]);

  // Show connection points on hover or when creating links
  useEffect(() => {
    if (isCreatingLink) {
      setShowConnectionPoints(true);
    }
  }, [isCreatingLink]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const connectionPoints = [
    { position: 'top', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'right', style: { top: '50%', right: -6, transform: 'translateY(-50%)' } },
    { position: 'bottom', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'left', style: { top: '50%', left: -6, transform: 'translateY(-50%)' } }
  ];

  return (
    <div
      ref={noteRef}
      className={`note ${isSelected ? 'selected' : ''} ${isCreatingLink ? 'link-mode' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        position: 'absolute',
        left: note.x || 0,
        top: note.y || 0,
        width: note.width || 300,
        height: note.height || 200,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onClick={handleNoteClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowConnectionPoints(true)}
      onMouseLeave={() => !isCreatingLink && setShowConnectionPoints(false)}
    >
      <div className="note-content" style={{ width: '100%', height: '100%' }}>
        <div className="note-header">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  handleTitleBlur();
                }
              }}
              placeholder="Note title"
              className="note-title"
              tabIndex={0}
              autoFocus
            />
          ) : (
            <div
              className="note-title-display"
              onDoubleClick={handleTitleDoubleClick}
              style={{
                padding: '8px',
                minHeight: '20px',
                cursor: 'text',
                borderRadius: '4px',
                backgroundColor: 'transparent'
              }}
            >
              {title || 'Double-click to edit title'}
            </div>
          )}
          <button
            onClick={handleDelete}
            className="delete-button"
            title="Delete note"
          >
            ×
          </button>
        </div>
        <div className="note-body-container">
          {isEditingContent ? (
            <textarea
              value={content}
              onChange={handleContentChange}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={handleContentBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleContentBlur();
                }
              }}
              className="note-body"
              placeholder="Start typing..."
              tabIndex={0}
              autoFocus
            />
          ) : (
            <div
              className="note-body-display"
              onDoubleClick={handleContentDoubleClick}
              style={{
                padding: '12px',
                cursor: 'text',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                whiteSpace: 'pre-wrap'
              }}
            >
              {content || 'Double-click to edit content'}
            </div>
          )}
        </div>
      </div>
      
      {/* Resize handle */}
      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          cursor: 'se-resize',
          background: 'transparent'
        }}
      />
      
      {/* Connection points */}
      {showConnectionPoints && connectionPoints.map(({ position, style }) => (
        <div
          key={position}
          className={`connection-point ${position} ${
            isCreatingLink && linkStart?.noteId !== note.id ? 'active' : ''
          }`}
          style={style}
          onClick={(e) => handleConnectionClick(e, position)}
          onMouseDown={handleConnectionMouseDown}
          title={`Connect from ${position}`}
        />
      ))}
    </div>
  );
};

export default Note;