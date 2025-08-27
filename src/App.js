import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import NoteGraph from './components/NoteGraph';
import NoteEditor from './components/NoteEditor';
import Sidebar from './components/Sidebar';

function App() {
  const [notes, setNotes] = useState({});
  const [connections, setConnections] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load notes on app start
  useEffect(() => {
    loadNotes();
    
    // Set up keyboard shortcuts
    const handleKeyDown = (e) => {
      // Escape to close note editor
      if (e.key === 'Escape') {
        setSelectedNote(null);
      }
      
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };
    
    // Handle custom events from NoteGraph
    const handleEditNote = (e) => {
      setSelectedNote(e.detail.noteId);
    };
    
    const handleCreateNoteAtPosition = async (e) => {
      const { x, y } = e.detail;
      const newNote = await createNote({
        content: '',
        title: 'New Note',
        position: { x, y }
      });
      if (newNote) {
        setSelectedNote(newNote.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('editNote', handleEditNote);
    window.addEventListener('createNoteAtPosition', handleCreateNoteAtPosition);
    
    // Handle app closing
    if (window.electronAPI) {
      window.electronAPI.onAppClosing(() => {
        saveNotes();
      });
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('editNote', handleEditNote);
      window.removeEventListener('createNoteAtPosition', handleCreateNoteAtPosition);
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('app-closing');
      }
    };
  }, [sidebarCollapsed]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const data = await window.electronAPI.getNotes();
        setNotes(data.notes || {});
        setConnections(data.connections || {});
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveNotes({
          notes,
          connections,
          lastModified: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const createNote = useCallback(async (noteData) => {
    try {
      if (window.electronAPI) {
        const newNote = await window.electronAPI.createNote(noteData);
        setNotes(prev => ({ ...prev, [newNote.id]: newNote }));
        return newNote;
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  }, []);

  const updateNote = useCallback(async (noteId, updates) => {
    try {
      if (window.electronAPI) {
        const updatedNote = await window.electronAPI.updateNote(noteId, updates);
        if (updatedNote) {
          setNotes(prev => ({ ...prev, [noteId]: updatedNote }));
        }
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }, []);

  const deleteNote = useCallback(async (noteId) => {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.deleteNote(noteId);
        if (success) {
          setNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[noteId];
            return newNotes;
          });
          
          // Remove connections involving this note
          setConnections(prev => {
            const newConnections = { ...prev };
            Object.keys(newConnections).forEach(connId => {
              if (newConnections[connId].from === noteId || newConnections[connId].to === noteId) {
                delete newConnections[connId];
              }
            });
            return newConnections;
          });
          
          if (selectedNote === noteId) {
            setSelectedNote(null);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, [selectedNote]);

  const createConnection = useCallback(async (fromId, toId) => {
    try {
      if (window.electronAPI) {
        const connection = await window.electronAPI.createConnection(fromId, toId);
        if (connection) {
          setConnections(prev => ({ ...prev, [connection.id]: connection }));
        }
      }
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  }, []);

  const deleteConnection = useCallback(async (connectionId) => {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.deleteConnection(connectionId);
        if (success) {
          setConnections(prev => {
            const newConnections = { ...prev };
            delete newConnections[connectionId];
            return newConnections;
          });
        }
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  }, []);



  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Tangle...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar 
        notes={notes}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        onCreateNote={createNote}
        onDeleteNote={deleteNote}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <NoteGraph 
          notes={notes}
          connections={connections}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onCreateConnection={createConnection}
          onDeleteConnection={deleteConnection}
          onUpdateNote={updateNote}
        />
        
        {selectedNote && notes[selectedNote] && (
          <NoteEditor 
            note={notes[selectedNote]}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onClose={() => setSelectedNote(null)}
          />
        )}
      </div>
      
      <div className="app-shortcuts">
        <div className="shortcut-hint">Ctrl+B: Toggle Sidebar</div>
        <div className="shortcut-hint">Esc: Close</div>
        <div className="shortcut-hint">Double-click: Edit Note / Create Note</div>
      </div>
    </div>
  );
}

export default App;