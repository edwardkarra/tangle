import React, { useState, useEffect } from 'react';
import './App.css';
import WorkspaceView from './components/WorkspaceView';
import TimelineView from './components/TimelineView';
import WindowControls from './components/WindowControls';

function App() {
  const [currentView, setCurrentView] = useState('workspace'); // 'workspace' or 'timeline'
  const [notes, setNotes] = useState([]);
  const [links, setLinks] = useState([]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (window.electronAPI) {
        const [notesData, linksData] = await Promise.all([
          window.electronAPI.db.getAllNotes(),
          window.electronAPI.db.getAllLinks()
        ]);
        setNotes(notesData);
        setLinks(linksData);
    
      } else {
        // Browser testing mode - load test data
        const testNotes = [
          {
            id: 'test-note-1',
            title: 'Test Note 1',
            content: 'This is the first test note',
            x: 100,
            y: 100,
            width: 300,
            height: 200,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parent_id: null
          },
          {
            id: 'test-note-2',
            title: 'Test Note 2',
            content: 'This is the second test note',
            x: 500,
            y: 200,
            width: 300,
            height: 200,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parent_id: null
          }
        ];
        const testLinks = [];
        setNotes(testNotes);
        setLinks(testLinks);
  
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      if (window.electronAPI) {
        const newNote = await window.electronAPI.db.createNote(noteData);
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      } else {
        // Fallback for browser testing when electronAPI is not available
        const newNote = {
          id: Date.now().toString(),
          title: noteData.title || 'New Note',
          content: noteData.content || '',
          x: noteData.x || 100,
          y: noteData.y || 100,
          width: noteData.width || 300,
          height: noteData.height || 200,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          parent_id: noteData.parent_id || null
        };
        setNotes(prev => [newNote, ...prev]);
    
        return newNote;
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async (noteData) => {
    try {
      if (window.electronAPI) {
        const updatedNote = await window.electronAPI.db.updateNote(noteData);
        setNotes(prev => prev.map(note => 
          note.id === noteData.id ? updatedNote : note
        ));
        return updatedNote;
      } else {
        // Fallback for browser testing
        const updatedNote = {
          ...noteData,
          updated_at: new Date().toISOString()
        };
        setNotes(prev => prev.map(note => 
          note.id === noteData.id ? updatedNote : note
        ));
    
        return updatedNote;
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.db.deleteNote(noteId);
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setLinks(prev => prev.filter(link => 
          link.source_note_id !== noteId && link.target_note_id !== noteId
        ));
      } else {
        // Fallback for browser testing
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setLinks(prev => prev.filter(link => 
          link.source_note_id !== noteId && link.target_note_id !== noteId
        ));
    
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleCreateLink = async (linkData) => {
    try {
      if (window.electronAPI) {
        const newLink = await window.electronAPI.db.createLink({
          source_note_id: linkData.sourceId,
          target_note_id: linkData.targetId,
          source_position: linkData.sourcePosition,
          target_position: linkData.targetPosition,
          type: linkData.type
        });
        setLinks(prev => [newLink, ...prev]);
        return newLink;
      } else {
        // Fallback for browser testing
        const newLink = {
          id: Date.now().toString(),
          source_note_id: linkData.sourceId,
          target_note_id: linkData.targetId,
          source_position: linkData.sourcePosition,
          target_position: linkData.targetPosition,
          type: linkData.type || 'default',
          created_at: new Date().toISOString()
        };
        setLinks(prev => [newLink, ...prev]);
    
        return newLink;
      }
    } catch (error) {
      console.error('Error creating link:', error);
    }
  };

  return (
    <div className="app">
      <WindowControls />
      
      <div className="view-switcher">
        <button 
          className={`view-button ${currentView === 'workspace' ? 'active' : ''}`}
          onClick={() => setCurrentView('workspace')}
        >
          Workspace
        </button>
        <button 
          className={`view-button ${currentView === 'timeline' ? 'active' : ''}`}
          onClick={() => setCurrentView('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="view-container">
        {currentView === 'workspace' ? (
          <WorkspaceView 
            notes={notes}
            links={links}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onCreateLink={handleCreateLink}
          />
        ) : (
          <TimelineView 
            notes={notes}
            links={links}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </div>
    </div>
  );
}

export default App;