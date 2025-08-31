import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';

const NoteGraph = forwardRef(({ 
  notes, 
  connections, 
  selectedNote, 
  onSelectNote, 
  onCreateConnection, 
  onDeleteConnection, 
  onUpdateNote 
}, ref) => {
  const cyRef = useRef(null);
  const [cy, setCy] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [collapsedNotes, setCollapsedNotes] = useState(new Set());

  const toggleNoteCollapse = (noteId) => {
    setCollapsedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const toggleMainNote = (noteId) => {
    const note = notes[noteId];
    if (note) {
      onUpdateNote(noteId, { ...note, isMainNote: !note.isMainNote });
    }
  };

  useImperativeHandle(ref, () => ({
    focusOnNote: (noteId) => {
      if (cy) {
        const node = cy.getElementById(noteId);
        if (node.length > 0) {
          cy.animate({
            center: {
              eles: node
            },
            zoom: 1.5
          }, {
            duration: 300,
            easing: 'ease-in-out'
          });
        }
      }
    }
  }));

  useEffect(() => {
    if (!cyRef.current) return;

    const cytoscapeInstance = cytoscape({
      container: cyRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ecf0f1',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#2c3e50',
            'font-size': '12px',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'width': 120,
            'height': 100,
            'shape': 'rectangle',
            'border-width': 2,
            'border-color': '#bdc3c7'
          }
        },
        {
          selector: 'node[type="main"]',
          style: {
            'background-color': '#e74c3c',
            'border-color': '#c0392b',
            'width': 140,
            'height': 120
          }
        },
        {
          selector: 'node.selected',
          style: {
            'border-width': 5,
            'border-color': '#f39c12',
            'background-color': '#f1c40f'
          }
        },
        {
          selector: 'node.connecting',
          style: {
            'border-color': '#e67e22',
            'border-width': 4
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#95a5a6',
            'target-arrow-color': '#95a5a6',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 4
          }
        }
      ],
      layout: {
        name: 'preset'
      },
      wheelSensitivity: 0.3,
      minZoom: 0.1,
      maxZoom: 3
    });

    setCy(cytoscapeInstance);

    // Event handlers
    cytoscapeInstance.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      onSelectNote(nodeId);
      
      if (isConnecting && connectingFrom && connectingFrom !== nodeId) {
        onCreateConnection(connectingFrom, nodeId);
        setIsConnecting(false);
        setConnectingFrom(null);
        cytoscapeInstance.nodes().removeClass('connecting');
      }
    });

    cytoscapeInstance.on('dbltap', 'node', (evt) => {
      const nodeId = evt.target.id();
      document.dispatchEvent(new CustomEvent('editNote', { detail: { noteId: nodeId } }));
    });

    cytoscapeInstance.on('tap', (evt) => {
      if (evt.target === cytoscapeInstance) {
        onSelectNote(null);
        if (isConnecting) {
          setIsConnecting(false);
          setConnectingFrom(null);
          cytoscapeInstance.nodes().removeClass('connecting');
        }
      }
    });

    cytoscapeInstance.on('dbltap', (evt) => {
      if (evt.target === cytoscapeInstance) {
        const position = evt.position || evt.cyPosition;
        document.dispatchEvent(new CustomEvent('createNoteAtPosition', {
          detail: { x: position.x, y: position.y }
        }));
      }
    });

    cytoscapeInstance.on('tap', 'edge', (evt) => {
      const edgeId = evt.target.id();
      
      // Show confirmation dialog before deleting connection
      const confirmed = window.confirm('Are you sure you want to delete this connection?');
      if (confirmed) {
        onDeleteConnection(edgeId);
      }
    });

    cytoscapeInstance.on('cxttap', 'node', (evt) => {
      evt.stopPropagation();
      const nodeId = evt.target.id();
      
      if (!isConnecting) {
        setIsConnecting(true);
        setConnectingFrom(nodeId);
        cytoscapeInstance.nodes().removeClass('connecting');
        evt.target.addClass('connecting');
      } else if (connectingFrom && connectingFrom !== nodeId) {
        onCreateConnection(connectingFrom, nodeId);
        setIsConnecting(false);
        setConnectingFrom(null);
        cytoscapeInstance.nodes().removeClass('connecting');
      }
    });

    cytoscapeInstance.on('dragfree', 'node', (evt) => {
      const node = evt.target;
      const position = node.position();
      const nodeId = node.id();
      
      onUpdateNote(nodeId, { position: { x: position.x, y: position.y } });
    });

    // Add custom wheel event handler for Ctrl+scroll faster zooming
    const handleWheel = (evt) => {
      evt.preventDefault();
      const zoomFactor = evt.deltaY > 0 ? 0.7 : 1.3;
      const currentZoom = cytoscapeInstance.zoom();
      const newZoom = currentZoom * zoomFactor;
      
      const container = cyRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;
      const mouseY = evt.clientY - rect.top;
      
      cytoscapeInstance.zoom({
        level: newZoom,
        renderedPosition: { x: mouseX, y: mouseY }
      });
    };

    const container = cyRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cytoscapeInstance.destroy();
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isConnecting, connectingFrom, onSelectNote, onCreateConnection, onDeleteConnection, onUpdateNote]);

  useEffect(() => {
    if (!cy) return;

    const elements = [];
    
    // Helper function to get all child notes of a parent
    const getChildNotes = (parentId) => {
      return Object.values(connections)
        .filter(conn => conn.from === parentId)
        .map(conn => conn.to);
    };

    // Helper function to check if a note should be hidden (parent is collapsed)
    const isNoteHidden = (noteId) => {
      return Object.values(connections).some(conn => {
        return conn.to === noteId && collapsedNotes.has(conn.from);
      });
    };
    
    Object.values(notes).forEach(note => {
      // Skip notes that should be hidden due to collapsed parent
      if (isNoteHidden(note.id)) {
        return;
      }

      // Create label with title and description preview
      const title = note.title || 'Untitled';
      const description = note.content ? note.content.substring(0, 50) : '';
      const label = description ? `${title}\n${description}${note.content.length > 50 ? '...' : ''}` : title;
      
      elements.push({
        data: {
          id: note.id,
          label: label,
          type: note.isMainNote ? 'main' : 'regular'
        },
        position: note.position || { x: Math.random() * 400, y: Math.random() * 300 }
      });
    });
    
    Object.values(connections).forEach(connection => {
      // Only show connections if both nodes are visible
      if (!isNoteHidden(connection.from) && !isNoteHidden(connection.to)) {
        elements.push({
          data: {
            id: connection.id,
            source: connection.from,
            target: connection.to
          }
        });
      }
    });

    // Store current viewport state before updating elements
    const currentZoom = cy.zoom();
    const currentPan = cy.pan();

    cy.elements().remove();
    cy.add(elements);
    
    cy.nodes().removeClass('selected');
    if (selectedNote) {
      cy.getElementById(selectedNote).addClass('selected');
    }

    const hasPositions = Object.values(notes).some(note => note.position);
    if (!hasPositions && Object.keys(notes).length > 0) {
      cy.layout({
        name: 'circle',
        radius: 200,
        animate: true,
        animationDuration: 500
      }).run();
    } else {
      // Restore viewport state to prevent unwanted viewport changes
      cy.zoom(currentZoom);
      cy.pan(currentPan);
    }
  }, [notes, connections, selectedNote, cy, collapsedNotes]);

  const handleCreateNote = () => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    };
    
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true
    }));
  };

  return (
    <div className="graph-container">
      <div 
        ref={cyRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }} 
      />
      
      <div className="graph-controls">
        {isConnecting && (
          <div className="connection-hint">
            <span>Click another note to connect</span>
            <button 
              className="cancel-btn"
              onClick={() => {
                setIsConnecting(false);
                setConnectingFrom(null);
                if (cy) cy.nodes().removeClass('connecting');
              }}
            >
              Cancel
            </button>
          </div>
        )}
        
        {selectedNote && (
          <div className="note-action-buttons">
            {/* Collapse button - only show if note has children */}
            {Object.values(connections).some(conn => conn.from === selectedNote) && (
              <button 
                className="collapse-button"
                onClick={() => toggleNoteCollapse(selectedNote)}
                title={collapsedNotes.has(selectedNote) ? 'Expand children' : 'Collapse children'}
              >
                {collapsedNotes.has(selectedNote) ? '▶' : '▼'}
              </button>
            )}
            
            {/* Main note toggle button */}
            <button 
              className="main-toggle-button"
              onClick={() => toggleMainNote(selectedNote)}
              title={notes[selectedNote]?.isMainNote ? 'Remove from main notes' : 'Mark as main note'}
            >
              {notes[selectedNote]?.isMainNote ? '★' : '☆'}
            </button>
          </div>
        )}
      </div>
      
      <div className="graph-help">
        <div className="help-item">Left click: Select</div>
        <div className="help-item">Double click: Edit note</div>
        <div className="help-item">Double click empty: Create note</div>
        <div className="help-item">Right click: Start connection</div>
        <div className="help-item">Drag: Move note</div>
        <div className="help-item">Click edge: Delete connection</div>
      </div>
      
      <style jsx>{`
        .graph-controls {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 10;
        }
        
        .connection-hint {
          background: rgba(241, 196, 15, 0.9);
          color: #2c3e50;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          gap: 8px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .cancel-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .cancel-btn:hover {
          background: #c0392b;
        }
        
        .note-action-buttons {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
        }
        
        .collapse-button, .main-toggle-button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .collapse-button {
          background: #3498db;
          color: white;
        }
        
        .collapse-button:hover {
          background: #2980b9;
          transform: scale(1.1);
        }
        
        .main-toggle-button {
          background: #f39c12;
          color: white;
        }
        
        .main-toggle-button:hover {
          background: #e67e22;
          transform: scale(1.1);
        }
        
        .graph-help {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-size: 11px;
          backdrop-filter: blur(10px);
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        .graph-help:hover {
          opacity: 1;
        }
        
        .help-item {
          margin-bottom: 4px;
        }
        
        .help-item:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
});

export default NoteGraph;