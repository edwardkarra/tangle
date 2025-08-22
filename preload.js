const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    getAllNotes: () => ipcRenderer.invoke('db:getAllNotes'),
    createNote: (noteData) => ipcRenderer.invoke('db:createNote', noteData),
    updateNote: (noteData) => ipcRenderer.invoke('db:updateNote', noteData),
    deleteNote: (noteId) => ipcRenderer.invoke('db:deleteNote', noteId),
    getAllLinks: () => ipcRenderer.invoke('db:getAllLinks'),
    createLink: (linkData) => ipcRenderer.invoke('db:createLink', linkData)
  },
  
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  }
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');