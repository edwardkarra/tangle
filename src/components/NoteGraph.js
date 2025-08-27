import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

const NoteGraph = ({ 
  notes, 
  connections, 
  selectedNote, 
  onSelectNote, 
  onCreateConnection, 
  onDeleteConnection, 
  onUpdateNote 
}) => {
  const cyRef = useRef(null);
  const [cy, setCy] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);

  useEffect(() => {
    if (!cyRef.current) return;

    const cytoscapeInstance = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ffffff',
            'border-color': '#e1e8ed',
            'border-width': 2,
            'label': 'data(label)',
            'text-valign': 'top',
            'text-halign': 'center',
            'font-size': '11px',
            'font-weight': '600',
            'color': '#2c3e50',
            'text-wrap': 'wrap',
            'text-max-width': '140px',
            'width': '100px',
            'height': '100px',
            'shape': 'round-rectangle',
            'overlay-opacity': 0,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#3498db',
            'border-color': '#2980b9',
            'color': '#ffffff',
            'width': '110px',
            'height': '110px'
          }
        },
        {
          selector: 'node:after',
          style: {
            'content': 'data(body)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '9px',
            'color': '#7f8c8d',
            'text-wrap': 'wrap',
            'text-max-width': '140px',
            'text-margin-y': '10px'
          }
        },
        {
          selector: 'node:hover',
          style: {
            'background-color': '#ecf0f1',
            'border-color': '#bdc3c7'
          }
        },
        {
          selector: 'node[type="main"]',
          style: {
            'border-color': '#e74c3c',
            'border-width': 3,
            'background-color': '#fff5f5'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#95a5a6',
            'target-arrow-color': '#95a5a6',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2,
            'overlay-opacity': 0,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge:hover',
          style: {
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 3
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 3
          }
        },
        {
          selector: '.connecting',
          style: {
            'background-color': '#f39c12',
            'border-color': '#e67e22'
          }
        }
      ],
      layout: {
        name: 'preset'
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: 'single',
      wheelSensitivity: 0.1
    });

    setCy(cytoscapeInstance);

    // Event handlers
    cytoscapeInstance.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.id();
      
      if (isConnecting) {
        if (connectingFrom && connectingFrom !== nodeId) {
          onCreateConnection(connectingFrom, nodeId);
          setIsConnecting(false);
          setConnectingFrom(null);
          cytoscapeInstance.nodes().removeClass('connecting');
        }
      } else {
        onSelectNote(nodeId);
      }
    });

    cytoscapeInstance.on('dbltap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.id();
      onSelectNote(nodeId);
      // Trigger edit mode - this will be handled by parent component
      setTimeout(() => {
        const editEvent = new CustomEvent('editNote', { detail: { noteId } });
        window.dispatchEvent(editEvent);
      }, 100);
    });

    cytoscapeInstance.on('dbltap', (evt) => {
      if (evt.target === cytoscapeInstance) {
        const position = evt.position || evt.renderedPosition;
        const createEvent = new CustomEvent('createNoteAtPosition', { 
          detail: { 
            position: { x: position.x, y: position.y } 
          } 
        });
        window.dispatchEvent(createEvent);
      }
    });

    cytoscapeInstance.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const edgeId = edge.id();
      
      if (window.confirm('Delete this connection?')) {
        onDeleteConnection(edgeId);
      }
    });

    cytoscapeInstance.on('tap', (evt) => {
      if (evt.target === cytoscapeInstance) {
        if (isConnecting) {
          setIsConnecting(false);
          setConnectingFrom(null);
          cytoscapeInstance.nodes().removeClass('connecting');
        } else {
          onSelectNote(null);
        }
      }
    });

    cytoscapeInstance.on('cxttap', 'node', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      const node = evt.target;
      const nodeId = node.id();
      
      if (!isConnecting) {
        setIsConnecting(true);
        setConnectingFrom(nodeId);
        node.addClass('connecting');
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

    return () => {
      cytoscapeInstance.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cy) return;

    // Update graph data
    const elements = [];
    
    // Add nodes
    Object.values(notes).forEach(note => {
      elements.push({
        data: {
          id: note.id,
          label: note.title || 'Untitled',
          body: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
          type: note.isMainNote ? 'main' : 'regular'
        },
        position: note.position || { x: Math.random() * 400, y: Math.random() * 300 }
      });
    });
    
    // Add edges
    Object.values(connections).forEach(connection => {
      elements.push({
        data: {
          id: connection.id,
          source: connection.from,
          target: connection.to
        }
      });
    });

    cy.elements().remove();
    cy.add(elements);
    
    // Update selection
    cy.nodes().removeClass('selected');
    if (selectedNote) {
      cy.getElementById(selectedNote).addClass('selected');
    }

    // Auto-layout if no positions are set
    const hasPositions = Object.values(notes).some(note => note.position);
    if (!hasPositions && Object.keys(notes).length > 0) {
      cy.layout({
        name: 'circle',
        radius: 200,
        animate: true,
        animationDuration: 500
      }).run();
    }
  }, [notes, connections, selectedNote, cy]);

  const handleCreateNote = () => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    };
    
    // This will be handled by the parent component
    // For now, we'll just trigger the quick capture
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
        
        .graph-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3498db;
          color: white;
          border: none;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
          transition: all 0.2s ease;
        }
        
        .graph-btn:hover {
          background: #2980b9;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
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
};

export default NoteGraph;