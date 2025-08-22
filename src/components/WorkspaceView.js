import React, { useState, useCallback, useEffect } from 'react';
import Note from './Note';
import './WorkspaceView.css';

const WorkspaceView = ({ notes, links, onCreateNote, onUpdateNote, onDeleteNote, onCreateLink }) => {
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkStart, setLinkStart] = useState(null);

  // Handle workspace double-click to create new note
  const handleWorkspaceDoubleClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      onCreateNote({
        x: x - 150, // Center the note on click
        y: y - 100,
        width: 300,
        height: 200,
        title: '',
        content: ''
      });
    }
  }, [onCreateNote]);

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
    <div className="workspace-view" onDoubleClick={handleWorkspaceDoubleClick}>
      {renderLinks()}
      
      {notes.length === 0 && (
        <div className="workspace-instructions">
          <h3>Welcome to Tangle</h3>
          <p>Double-click anywhere to create your first note</p>
        </div>
      )}
      
      {isCreatingLink && (
        <div className="link-creation-overlay">
          <div className="link-creation-hint">
            Click on a connection point to complete the link<br/>
            <small>Press ESC to cancel</small>
          </div>
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
  );
};

export default WorkspaceView;