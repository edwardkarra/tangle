# Tangle

A note-taking application with hierarchical organization and visual graph representation.

## Features

- **Note Editor**: Create and edit notes with rich text support
- **Hierarchy Manager**: Organize notes in a hierarchical structure
- **Visual Graph**: View connections between notes in an interactive graph
- **Quick Capture**: Rapidly capture thoughts and ideas
- **Link Management**: Create and manage links between related notes
- **Local Storage**: All data is stored locally on your device

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

```bash
npm start
```

The application will open in your default browser at `http://localhost:3000`.

## Project Structure

- `src/components/` - React components for different features
- `src/utils/` - Utility functions including storage management
- `public/` - Static assets
- `main.js` - Electron main process (if using Electron)

## Technologies Used

- React
- CSS3
- Local Storage API
- Electron (for desktop app)

## License

This project is open source and available under the MIT License.