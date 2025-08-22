const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Debug logging function
function debugLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync('debug.log', logMessage);
  } catch (e) {
    // Ignore file write errors
  }
}

let mainWindow;
let db;

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Initialize database
function initDatabase() {
  debugLog('Initializing database...');
  db = new Database('tangle.db');
  debugLog('Database connection established');
  
  // Create notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      x INTEGER,
      y INTEGER,
      width INTEGER,
      height INTEGER,
      created_at TEXT,
      updated_at TEXT,
      parent_id TEXT,
      FOREIGN KEY (parent_id) REFERENCES notes(id)
    )
  `);
  
  // Create links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      source_note_id TEXT,
      source_line_index INTEGER,
      target_note_id TEXT,
      target_line_index INTEGER,
      source_position TEXT,
      target_position TEXT,
      type TEXT,
      created_at TEXT,
      FOREIGN KEY (source_note_id) REFERENCES notes(id),
      FOREIGN KEY (target_note_id) REFERENCES notes(id)
    )
  `);
  
  // Add new columns to existing links table if they don't exist
  try {
    db.exec('ALTER TABLE links ADD COLUMN source_position TEXT');
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE links ADD COLUMN target_position TEXT');
  } catch (e) {
    // Column already exists
  }
  
  debugLog('Database initialization complete');
}

function createWindow() {
  debugLog('Creating main window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    }
  });

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Open the DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  debugLog('Main window created successfully');
}

// Function to register IPC handlers
function registerIpcHandlers() {
  debugLog('Registering IPC handlers...');
  
  // IPC handlers for database operations
  ipcMain.handle('db:getAllNotes', async () => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }
      const stmt = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
      return stmt.all();
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createNote', async (event, noteData) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO notes (id, title, content, x, y, width, height, created_at, updated_at, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        noteData.title || 'New Note',
        noteData.content || '',
        noteData.x || 100,
        noteData.y || 100,
        noteData.width || 300,
        noteData.height || 200,
        now,
        now,
        noteData.parent_id || null
      );
      
      // Return the created note
      const getStmt = db.prepare('SELECT * FROM notes WHERE id = ?');
      return getStmt.get(id);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateNote', async (event, noteData) => {
    try {
      const currentNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteData.id);
      if (!currentNote) {
        throw new Error('Note not found');
      }
      
      const now = new Date();
      const lastUpdated = new Date(currentNote.updated_at);
      const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
      
      // If more than 1 hour has passed, create a new version
      if (hoursDiff > 1) {
        const newId = uuidv4();
        const nowISO = now.toISOString();
        
        // Create new note version
        const insertStmt = db.prepare(`
          INSERT INTO notes (id, title, content, x, y, width, height, created_at, updated_at, parent_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertStmt.run(
          newId,
          noteData.title,
          noteData.content,
          noteData.x,
          noteData.y,
          noteData.width,
          noteData.height,
          nowISO,
          nowISO,
          currentNote.id
        );
        
        // Create update link
        const linkStmt = db.prepare(`
          INSERT INTO links (id, source_note_id, source_line_index, target_note_id, target_line_index, source_position, target_position, type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        linkStmt.run(
          uuidv4(),
          newId,
          0,
          currentNote.id,
          0,
          null,
          null,
          'update',
          nowISO
        );
        
        const newNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(newId);
        return newNote;
      } else {
        // Update existing note
        const updateStmt = db.prepare(`
          UPDATE notes 
          SET title = ?, content = ?, x = ?, y = ?, width = ?, height = ?, updated_at = ?
          WHERE id = ?
        `);
        
        updateStmt.run(
          noteData.title,
          noteData.content,
          noteData.x,
          noteData.y,
          noteData.width,
          noteData.height,
          now.toISOString(),
          noteData.id
        );
        
        const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteData.id);
        return updatedNote;
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  });

  ipcMain.handle('db:deleteNote', async (event, noteId) => {
    try {
      // Delete associated links first
      const deleteLinkStmt = db.prepare('DELETE FROM links WHERE source_note_id = ? OR target_note_id = ?');
      deleteLinkStmt.run(noteId, noteId);
      
      // Delete the note
      const deleteNoteStmt = db.prepare('DELETE FROM notes WHERE id = ?');
      const result = deleteNoteStmt.run(noteId);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getAllLinks', async () => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }
      const stmt = db.prepare('SELECT * FROM links ORDER BY created_at DESC');
      const links = stmt.all();
      return links;
    } catch (error) {
      console.error('Error getting links:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createLink', async (event, linkData) => {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO links (id, source_note_id, source_line_index, target_note_id, target_line_index, source_position, target_position, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        linkData.source_note_id,
        linkData.source_line_index || 0,
        linkData.target_note_id,
        linkData.target_line_index || 0,
        linkData.source_position || null,
        linkData.target_position || null,
        linkData.type || 'reference',
        now
      );
      
      const newLink = db.prepare('SELECT * FROM links WHERE id = ?').get(id);
      return newLink;
    } catch (error) {
      console.error('Error creating link:', error);
      throw error;
    }
  });

  // Window control handlers
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });
  
  debugLog('All IPC handlers registered successfully');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  debugLog('App is ready, initializing...');
  initDatabase();
  
  // Add a small delay to ensure everything is properly initialized
  setTimeout(() => {
    debugLog('Registering IPC handlers after delay...');
    registerIpcHandlers();
    
    // Ensure IPC handlers are ready before creating window
    process.nextTick(() => {
      debugLog('Creating window...');
      createWindow();
    });
  }, 100);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) db.close();
});