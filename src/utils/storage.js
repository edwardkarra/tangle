// Storage utility for handling local JSON file operations
// This module provides functions to interact with the Electron main process
// for persistent storage of notes and their connections

class StorageManager {
  constructor() {
    this.notes = [];
    this.connections = [];
    this.isLoaded = false;
  }

  // Initialize storage and load existing data
  async initialize() {
    try {
      const data = await window.electronAPI.getNotes();
      this.notes = data.notes || [];
      this.connections = data.connections || [];
      this.isLoaded = true;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      return { success: false, error };
    }
  }

  // Get all notes
  getNotes() {
    return [...this.notes];
  }

  // Get all connections
  getConnections() {
    return [...this.connections];
  }

  // Get a specific note by ID
  getNote(id) {
    return this.notes.find(note => note.id === id);
  }

  // Create a new note
  async createNote(noteData) {
    try {
      const newNote = {
        id: this.generateId(),
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        isMain: noteData.isMain || false,
        tags: noteData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...noteData
      };

      // Add to local array
      this.notes.push(newNote);

      // Save to file via Electron
      const result = await window.electronAPI.createNote(newNote);
      
      if (result.success) {
        return { success: true, note: newNote };
      } else {
        // Rollback on failure
        this.notes = this.notes.filter(note => note.id !== newNote.id);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      return { success: false, error };
    }
  }

  // Update an existing note
  async updateNote(id, updates) {
    try {
      const noteIndex = this.notes.findIndex(note => note.id === id);
      if (noteIndex === -1) {
        return { success: false, error: 'Note not found' };
      }

      const originalNote = { ...this.notes[noteIndex] };
      const updatedNote = {
        ...originalNote,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update local array
      this.notes[noteIndex] = updatedNote;

      // Save to file via Electron
      const result = await window.electronAPI.updateNote(id, updatedNote);
      
      if (result.success) {
        return { success: true, note: updatedNote };
      } else {
        // Rollback on failure
        this.notes[noteIndex] = originalNote;
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      return { success: false, error };
    }
  }

  // Delete a note
  async deleteNote(id) {
    try {
      const noteIndex = this.notes.findIndex(note => note.id === id);
      if (noteIndex === -1) {
        return { success: false, error: 'Note not found' };
      }

      const deletedNote = this.notes[noteIndex];
      
      // Remove from local array
      this.notes.splice(noteIndex, 1);
      
      // Remove all connections involving this note
      const connectionsToRemove = this.connections.filter(
        conn => conn.source === id || conn.target === id
      );
      
      this.connections = this.connections.filter(
        conn => conn.source !== id && conn.target !== id
      );

      // Save to file via Electron
      const result = await window.electronAPI.deleteNote(id);
      
      if (result.success) {
        // Also delete connections from storage
        for (const conn of connectionsToRemove) {
          await window.electronAPI.deleteConnection(conn.id);
        }
        return { success: true, deletedNote, deletedConnections: connectionsToRemove };
      } else {
        // Rollback on failure
        this.notes.splice(noteIndex, 0, deletedNote);
        this.connections.push(...connectionsToRemove);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      return { success: false, error };
    }
  }

  // Create a connection between two notes
  async createConnection(sourceId, targetId, connectionData = {}) {
    try {
      // Check if notes exist
      const sourceNote = this.getNote(sourceId);
      const targetNote = this.getNote(targetId);
      
      if (!sourceNote || !targetNote) {
        return { success: false, error: 'One or both notes not found' };
      }

      // Check if connection already exists
      const existingConnection = this.connections.find(
        conn => 
          (conn.source === sourceId && conn.target === targetId) ||
          (conn.source === targetId && conn.target === sourceId)
      );

      if (existingConnection) {
        return { success: false, error: 'Connection already exists' };
      }

      const newConnection = {
        id: this.generateId(),
        source: sourceId,
        target: targetId,
        type: connectionData.type || 'default',
        label: connectionData.label || '',
        createdAt: new Date().toISOString(),
        ...connectionData
      };

      // Add to local array
      this.connections.push(newConnection);

      // Save to file via Electron
      const result = await window.electronAPI.createConnection(newConnection);
      
      if (result.success) {
        return { success: true, connection: newConnection };
      } else {
        // Rollback on failure
        this.connections = this.connections.filter(conn => conn.id !== newConnection.id);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      return { success: false, error };
    }
  }

  // Delete a connection
  async deleteConnection(connectionId) {
    try {
      const connectionIndex = this.connections.findIndex(conn => conn.id === connectionId);
      if (connectionIndex === -1) {
        return { success: false, error: 'Connection not found' };
      }

      const deletedConnection = this.connections[connectionIndex];
      
      // Remove from local array
      this.connections.splice(connectionIndex, 1);

      // Save to file via Electron
      const result = await window.electronAPI.deleteConnection(connectionId);
      
      if (result.success) {
        return { success: true, connection: deletedConnection };
      } else {
        // Rollback on failure
        this.connections.splice(connectionIndex, 0, deletedConnection);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return { success: false, error };
    }
  }

  // Get connections for a specific note
  getConnectionsForNote(noteId) {
    return this.connections.filter(
      conn => conn.source === noteId || conn.target === noteId
    );
  }

  // Get connected notes for a specific note
  getConnectedNotes(noteId) {
    const connections = this.getConnectionsForNote(noteId);
    const connectedNoteIds = connections.map(conn => 
      conn.source === noteId ? conn.target : conn.source
    );
    return this.notes.filter(note => connectedNoteIds.includes(note.id));
  }

  // Search notes by title or content
  searchNotes(query) {
    if (!query || query.trim() === '') {
      return this.notes;
    }

    const searchTerm = query.toLowerCase().trim();
    return this.notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Get notes by type (main or regular)
  getNotesByType(isMain) {
    return this.notes.filter(note => note.isMain === isMain);
  }

  // Export all data
  async exportData() {
    try {
      const result = await window.electronAPI.exportNotes();
      return result;
    } catch (error) {
      console.error('Failed to export data:', error);
      return { success: false, error };
    }
  }

  // Save all data to file
  async saveData() {
    try {
      const data = {
        notes: this.notes,
        connections: this.connections,
        lastSaved: new Date().toISOString()
      };
      
      const result = await window.electronAPI.saveNotes(data);
      return result;
    } catch (error) {
      console.error('Failed to save data:', error);
      return { success: false, error };
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Get storage statistics
  getStats() {
    return {
      totalNotes: this.notes.length,
      mainNotes: this.notes.filter(note => note.isMain).length,
      regularNotes: this.notes.filter(note => !note.isMain).length,
      totalConnections: this.connections.length,
      lastUpdated: this.notes.length > 0 ? 
        Math.max(...this.notes.map(note => new Date(note.updatedAt).getTime())) : null
    };
  }

  // Validate data integrity
  validateData() {
    const issues = [];
    
    // Check for orphaned connections
    const noteIds = new Set(this.notes.map(note => note.id));
    const orphanedConnections = this.connections.filter(
      conn => !noteIds.has(conn.source) || !noteIds.has(conn.target)
    );
    
    if (orphanedConnections.length > 0) {
      issues.push({
        type: 'orphaned_connections',
        count: orphanedConnections.length,
        connections: orphanedConnections
      });
    }
    
    // Check for duplicate connections
    const connectionPairs = new Set();
    const duplicateConnections = [];
    
    this.connections.forEach(conn => {
      const pair1 = `${conn.source}-${conn.target}`;
      const pair2 = `${conn.target}-${conn.source}`;
      
      if (connectionPairs.has(pair1) || connectionPairs.has(pair2)) {
        duplicateConnections.push(conn);
      } else {
        connectionPairs.add(pair1);
      }
    });
    
    if (duplicateConnections.length > 0) {
      issues.push({
        type: 'duplicate_connections',
        count: duplicateConnections.length,
        connections: duplicateConnections
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Create and export a singleton instance
const storageManager = new StorageManager();
export default storageManager;

// Export the class for testing purposes
export { StorageManager };