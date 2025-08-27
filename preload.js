const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Notes operations
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNotes: (data) => ipcRenderer.invoke('save-notes', data),
  createNote: (noteData) => ipcRenderer.invoke('create-note', noteData),
  updateNote: (noteId, updates) => ipcRenderer.invoke('update-note', noteId, updates),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  
  // Connection operations
  createConnection: (fromId, toId) => ipcRenderer.invoke('create-connection', fromId, toId),
  deleteConnection: (connectionId) => ipcRenderer.invoke('delete-connection', connectionId),
  
  // Export functionality
  exportNotes: () => ipcRenderer.invoke('export-notes'),
  
  // App lifecycle events
  onAppClosing: (callback) => {
    ipcRenderer.on('app-closing', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose a simple API for keyboard shortcuts and window management
contextBridge.exposeInMainWorld('windowAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});