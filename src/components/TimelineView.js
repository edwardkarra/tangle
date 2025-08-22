import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import './TimelineView.css';

const TimelineView = ({ notes, links, onNoteUpdate }) => {
  const cyRef = useRef(null);
  const [cy, setCy] = useState(null);

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyRef.current) return;

    const cytoscapeInstance = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#2a2a2a',
            'border-color': '#4a9eff',
            'border-width': 2,
            'label': 'data(title)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'font-size': '12px',
            'width': 'data(width)',
            'height': 'data(height)',
            'shape': 'rectangle'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#f39c12',
            'border-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#4a9eff',
            'target-arrow-color': '#4a9eff',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#f39c12',
            'target-arrow-color': '#f39c12',
            'width': 3
          }
        }
      ],
      layout: {
        name: 'preset'
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single'
    });

    setCy(cytoscapeInstance);

    // Handle node position changes
    cytoscapeInstance.on('position', 'node', (event) => {
      const node = event.target;
      const noteId = node.id();
      const position = node.position();
      
      if (onNoteUpdate) {
        onNoteUpdate({
          id: noteId,
          x: position.x - (node.data('width') || 300) / 2,
          y: position.y - (node.data('height') || 200) / 2
        });
      }
    });

    return () => {
      cytoscapeInstance.destroy();
    };
  }, [onNoteUpdate]);

  // Update graph when notes or links change
  useEffect(() => {
    if (!cy) return;

    // Prepare nodes data
    const nodes = notes.map(note => ({
      data: {
        id: note.id,
        title: note.title || 'Untitled',
        width: note.width || 300,
        height: note.height || 200
      },
      position: {
        x: (note.x || 0) + (note.width || 300) / 2,
        y: (note.y || 0) + (note.height || 200) / 2
      }
    }));

    // Prepare edges data
    const edges = links.map(link => ({
      data: {
        id: `${link.sourceId}-${link.targetId}`,
        source: link.sourceId,
        target: link.targetId,
        type: link.type || 'default'
      }
    }));

    // Update the graph
    cy.elements().remove();
    cy.add([...nodes, ...edges]);
    
    // Fit the view if there are nodes
    if (nodes.length > 0) {
      cy.fit(cy.nodes(), 50);
    }
  }, [cy, notes, links]);

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h2>Timeline View</h2>
        <div className="timeline-controls">
          <button 
            onClick={() => cy && cy.fit(cy.nodes(), 50)}
            className="control-button"
            title="Fit to view"
          >
            🔍
          </button>
          <button 
            onClick={() => cy && cy.center()}
            className="control-button"
            title="Center view"
          >
            🎯
          </button>
          <button 
            onClick={() => cy && cy.zoom(1)}
            className="control-button"
            title="Reset zoom"
          >
            ↻
          </button>
        </div>
      </div>
      <div 
        ref={cyRef} 
        className="cytoscape-container"
      />
    </div>
  );
};

export default TimelineView;