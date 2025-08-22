import React, { useState, useCallback, useEffect } from 'react';
import Note from './Note';
import './WorkspaceView.css';

const WorkspaceView = ({ notes, onCreateNote, onUpdateNote, onDeleteNote, onCreateLink }) => {
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

  return (
    <div className="workspace-view" onDoubleClick={handleWorkspaceDoubleClick}>
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