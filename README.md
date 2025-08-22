# Tangle

A powerful node editor application with graph visualization for creating interconnected notes and ideas.

## Overview

Tangle is an Electron-based application that combines the flexibility of free-form note-taking with the power of graph visualization. Create notes, link them together, and visualize your knowledge as an interactive graph.

## Current Features

### 📝 Note Management
- **Create Notes**: Double-click anywhere in the workspace to create a new note
- **Rich Text Editing**: Edit note titles and content with a clean, intuitive interface
- **Drag & Drop**: Move notes freely around the workspace
- **Resizable Notes**: Adjust note dimensions using the resize handle
- **Auto-save**: Changes are automatically saved with debouncing to prevent excessive database calls
- **Delete Notes**: Remove notes with confirmation dialog

### 🔗 Linking System
- **Visual Connection Points**: Hover over notes to see connection points (top, right, bottom, left)
- **Interactive Linking**: Click and drag between connection points to create links
- **Link Management**: Links are automatically managed and stored in the database
- **Link Visualization**: See connections between notes in both workspace and timeline views

### 📊 Dual View System
- **Workspace View**: Free-form canvas for creating and organizing notes
  - Drag and drop notes anywhere
  - Real-time editing and positioning
  - Visual link creation interface
  - Welcome instructions for new users

- **Timeline View**: Graph visualization powered by Cytoscape.js
  - Interactive node-link diagram
  - Zoom and pan capabilities
  - Node positioning synchronization with workspace
  - Visual styling for nodes and edges

### 💾 Data Persistence
- **SQLite Database**: Local storage with `better-sqlite3` for high performance
- **Structured Schema**: Separate tables for notes and links with proper relationships
- **Version Control Ready**: Database file can be included or excluded from version control
- **Cross-platform**: Works on Windows, macOS, and Linux

### 🎨 User Interface
- **Custom Window Frame**: Frameless Electron window with custom controls
- **Dark Theme**: Modern dark interface optimized for extended use
- **Responsive Design**: Adapts to different window sizes
- **Smooth Animations**: Polished interactions and transitions
- **Browser Fallback**: Includes test mode for development without Electron

## Vision

Tangle aims to become a comprehensive knowledge management and idea visualization tool with the following planned features:

### 🎯 Advanced Linking
- **Line-to-Line Connections**: Link specific lines or bullet points between notes
- **Typed Relationships**: Different link types (reference, dependency, similarity, etc.)
- **Bidirectional Links**: Automatic backlink discovery and visualization
- **Link Annotations**: Add context and descriptions to connections

### 📈 Enhanced Visualization
- **Timeline Filtering**: Filter graph by date ranges and time periods
- **Layout Algorithms**: Multiple graph layout options (force-directed, hierarchical, circular)
- **Visual Clustering**: Group related notes automatically
- **Export Options**: Save graphs as images or interactive HTML

### 🔄 Version Control & History
- **Note Versioning**: Automatic versioning when notes are edited after time thresholds
- **Change Tracking**: Visual diff between note versions
- **Branching**: Create alternative versions of notes
- **History Timeline**: Navigate through the evolution of your knowledge base

### 🎨 Rich Content Support
- **Advanced Text Editor**: Rich formatting with toolbar (bold, italic, lists, etc.)
- **Media Embedding**: Images, videos, and file attachments
- **Code Syntax Highlighting**: Support for multiple programming languages
- **Mathematical Notation**: LaTeX support for equations and formulas

### 🔍 Search & Discovery
- **Full-text Search**: Find content across all notes
- **Tag System**: Organize notes with hierarchical tags
- **Smart Suggestions**: AI-powered link recommendations
- **Graph Queries**: Query the knowledge graph with graph-based search

### 📱 Collaboration & Sharing
- **Export/Import**: Share knowledge graphs between users
- **Collaboration Mode**: Real-time collaborative editing
- **Publishing**: Generate static websites from knowledge graphs
- **API Access**: Programmatic access to notes and links

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tangle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

   This command will:
   - Start the React development server on `http://localhost:3000`
   - Launch the Electron application
   - Initialize the SQLite database (`tangle.db`)

### Development

- **React Development**: The React app runs on `http://localhost:3000` and supports hot reloading
- **Electron Development**: The Electron main process automatically restarts when `main.js` changes
- **Database**: SQLite database file (`tangle.db`) is created automatically on first run

### Building for Production

```bash
# Build React app for production
npm run build

# Package as Electron app
npm run package
```

## Architecture

Tangle follows a multi-process Electron architecture:

- **Main Process**: Node.js backend handling database operations and window management
- **Renderer Process**: React frontend providing the user interface
- **IPC Bridge**: Secure communication between frontend and backend via `preload.js`
- **SQLite Database**: Local storage for all notes, links, and metadata

## Technology Stack

- **Frontend**: React 19, CSS3
- **Backend**: Electron, Node.js
- **Database**: SQLite with better-sqlite3
- **Visualization**: Cytoscape.js
- **UI Libraries**: react-draggable, react-resizable
- **Build Tools**: React Scripts, Electron Builder

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

ISC License - see package.json for details.

## Roadmap

See `specifications.md` and `architecture_description.md` for detailed development plans and technical architecture information.