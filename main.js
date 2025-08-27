const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let mainWindow;
let notesFilePath;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeDataStorage() {
  const userDataPath = app.getPath('userData');
  notesFilePath = path.join(userDataPath, 'notes.json');
  
  // Create notes file if it doesn't exist
  if (!fs.existsSync(notesFilePath)) {
    const initialData = {
      notes: {},
      connections: {},
      lastModified: Date.now()
    };
    fs.writeFileSync(notesFilePath, JSON.stringify(initialData, null, 2));
  }
}

function loadNotes() {
  try {
    const data = fs.readFileSync(notesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading notes:', error);
    return { notes: {}, connections: {}, lastModified: Date.now() };
  }
}

function saveNotes(data) {
  try {
    data.lastModified = Date.now();
    fs.writeFileSync(notesFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving notes:', error);
    return false;
  }
}

// IPC Handlers
ipcMain.handle('get-notes', async () => {
  return loadNotes();
});

ipcMain.handle('save-notes', async (event, data) => {
  return saveNotes(data);
});

ipcMain.handle('create-note', async (event, noteData) => {
  const data = loadNotes();
  const noteId = uuidv4();
  const note = {
    id: noteId,
    content: noteData.content || '',
    title: noteData.title || '',
    isMainNote: noteData.isMainNote || false,
    parentId: noteData.parentId || null,
    children: [],
    position: noteData.position || { x: 0, y: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  data.notes[noteId] = note;
  
  // Update parent's children array if this note has a parent
  if (note.parentId && data.notes[note.parentId]) {
    data.notes[note.parentId].children.push(noteId);
  }
  
  saveNotes(data);
  return note;
});

ipcMain.handle('update-note', async (event, noteId, updates) => {
  const data = loadNotes();
  if (data.notes[noteId]) {
    data.notes[noteId] = { ...data.notes[noteId], ...updates, updatedAt: Date.now() };
    saveNotes(data);
    return data.notes[noteId];
  }
  return null;
});

ipcMain.handle('delete-note', async (event, noteId) => {
  const data = loadNotes();
  if (data.notes[noteId]) {
    const note = data.notes[noteId];
    
    // Remove from parent's children array
    if (note.parentId && data.notes[note.parentId]) {
      data.notes[note.parentId].children = data.notes[note.parentId].children.filter(id => id !== noteId);
    }
    
    // Delete all children recursively
    const deleteChildren = (id) => {
      const childNote = data.notes[id];
      if (childNote && childNote.children) {
        childNote.children.forEach(deleteChildren);
      }
      delete data.notes[id];
      // Remove all connections involving this note
      Object.keys(data.connections).forEach(connId => {
        if (data.connections[connId].from === id || data.connections[connId].to === id) {
          delete data.connections[connId];
        }
      });
    };
    
    deleteChildren(noteId);
    saveNotes(data);
    return true;
  }
  return false;
});

ipcMain.handle('create-connection', async (event, fromId, toId) => {
  const data = loadNotes();
  const connectionId = uuidv4();
  const connection = {
    id: connectionId,
    from: fromId,
    to: toId,
    createdAt: Date.now()
  };
  
  data.connections[connectionId] = connection;
  saveNotes(data);
  return connection;
});

ipcMain.handle('delete-connection', async (event, connectionId) => {
  const data = loadNotes();
  if (data.connections[connectionId]) {
    delete data.connections[connectionId];
    saveNotes(data);
    return true;
  }
  return false;
});

ipcMain.handle('export-notes', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Notes',
    defaultPath: 'tangle-notes.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled) {
    const data = loadNotes();
    try {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, canceled: true };
});

app.whenReady().then(() => {
  initializeDataStorage();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Ensure all data is saved before quitting
  if (mainWindow) {
    mainWindow.webContents.send('app-closing');
  }
});