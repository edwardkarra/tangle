import React, { useState, useCallback, useEffect } from 'react';
import Note from './Note';
import './WorkspaceView.css';

const WorkspaceView = ({ notes, links, onCreateNote, onUpdateNote, onDeleteNote, onCreateLink }) => {
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkStart, setLinkStart] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isWheelPressed, setIsWheelPressed] = useState(false);

  // Handle workspace double-click to create new note
  const handleWorkspaceDoubleClick = useCallback((e) => {
    // Only create note if not clicking on a note or its children
    if (!e.target.closest('.note')) {
      const rect = e.currentTarget.getBoundingClientRect();
      // Convert screen coordinates to workspace coordinates
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      
      onCreateNote({
        x: x - 150, // Center the note on click
        y: y - 100,
        width: 300,
        height: 200,
        title: '',
        content: ''
      });
    }
  }, [onCreateNote, transform]);

  // Handle note selection
  const handleNoteSelect = useCallback((noteId, isSelected) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(noteId);
      } else {
        newSet.delete(noteId);
      }
      return newSet;
    });
  }, []);

  // Handle link creation start
  const handleStartLink = useCallback((noteId, position) => {
    setLinkStart({ noteId, position });
    setIsCreatingLink(true);
  }, []);

  // Handle link creation end
  const handleEndLink = useCallback((targetNoteId, targetPosition) => {
    if (linkStart && linkStart.noteId !== targetNoteId) {
      onCreateLink({
        sourceId: linkStart.noteId,
        targetId: targetNoteId,
        sourcePosition: linkStart.position,
        targetPosition: targetPosition,
        type: 'default'
      });
    }
    setLinkStart(null);
    setIsCreatingLink(false);
  }, [linkStart, onCreateLink]);

  // Handle canceling link creation
  const handleCancelLink = useCallback(() => {
    setLinkStart(null);
    setIsCreatingLink(false);
  }, []);

  // Handle wheel event for zoom or pan
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    if (isWheelPressed) {
      // Pan when wheel is held down
      const deltaX = e.deltaX || 0;
      const deltaY = e.deltaY || 0;
      
      setTransform(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
    } else {
      // Zoom with wheel scroll
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, transform.scale * delta));
      
      // Zoom towards mouse position
      const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
      const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
      
      setTransform({ x: newX, y: newY, scale: newScale });
    }
  }, [transform, isWheelPressed]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1) {
      // Middle mouse button (wheel) - set wheel pressed state and start panning
      e.preventDefault();
      setIsWheelPressed(true);
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    } else if (e.target === e.currentTarget && e.button === 0) {
      // Left mouse button in empty area
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      e.preventDefault();
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    }
  }, [isPanning, panStart]);

  // Handle mouse up for panning
  const handleMouseUp = useCallback((e) => {
    if (e.button === 1) {
      setIsWheelPressed(false);
    }
    setIsPanning(false);
  }, []);

  // Add global mouse event listeners for panning
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Handle escape key to cancel linking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCreatingLink) {
        handleCancelLink();
      }
    };
    
    if (isCreatingLink) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCreatingLink, handleCancelLink]);

  // Calculate connection point position for a note
  const getConnectionPointPosition = useCallback((note, position) => {
    const noteX = note.x || 0;
    const noteY = note.y || 0;
    const noteWidth = note.width || 300;
    const noteHeight = note.height || 200;

    switch (position) {
      case 'top':
        return { x: noteX + noteWidth / 2, y: noteY };
      case 'right':
        return { x: noteX + noteWidth, y: noteY + noteHeight / 2 };
      case 'bottom':
        return { x: noteX + noteWidth / 2, y: noteY + noteHeight };
      case 'left':
        return { x: noteX, y: noteY + noteHeight / 2 };
      default:
        return { x: noteX + noteWidth / 2, y: noteY + noteHeight / 2 };
    }
  }, []);

  // Render SVG links
  const renderLinks = () => {
    if (!links || links.length === 0) return null;

    return (
      <svg
        className="links-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {links.map(link => {
          const sourceNote = notes.find(note => note.id === link.source_note_id);
          const targetNote = notes.find(note => note.id === link.target_note_id);
          
          if (!sourceNote || !targetNote) return null;

          const sourcePos = getConnectionPointPosition(sourceNote, link.source_position || 'right');
          const targetPos = getConnectionPointPosition(targetNote, link.target_position || 'left');

          return (
            <line
              key={link.id}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke="#4a9eff"
              strokeWidth="2"
              strokeDasharray={link.type === 'update' ? '5,5' : 'none'}
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div 
      className="workspace-view" 
      onDoubleClick={handleWorkspaceDoubleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'default'
      }}
    >
      <div
        className="workspace-content"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        {renderLinks()}
        
        {notes.length === 0 && (
          <div className="workspace-instructions">
             <h3>Welcome to Tangle</h3>
             <p>Double-click anywhere to create your first note</p>
             <p><small>Use Wheel to zoom, Hold wheel + scroll to pan, or drag in empty area to pan</small></p>
           </div>
        )}
        
        {notes.map(note => (
          <Note
            key={note.id}
            note={note}
            isSelected={selectedNotes.has(note.id)}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onSelect={handleNoteSelect}
            onStartLink={handleStartLink}
            onEndLink={handleEndLink}
            isCreatingLink={isCreatingLink}
            linkStart={linkStart}
          />
        ))}
      </div>
      
      {isCreatingLink && (
        <div className="link-creation-overlay">
          <div className="link-creation-hint">
            Click on a connection point to complete the link<br/>
            <small>Press ESC to cancel</small>
          </div>
        </div>
      )}
      
      {/* Zoom indicator */}
      <div 
        className="zoom-indicator"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}
      >
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
};

export default WorkspaceView;