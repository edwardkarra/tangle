import React from 'react';

const WindowControls = () => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.window.close();
    }
  };

  return (
    <div className="window-controls">
      <button 
        className="window-control minimize" 
        onClick={handleMinimize}
        title="Minimize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="2" y="5" width="8" height="2" />
        </svg>
      </button>
      
      <button 
        className="window-control maximize" 
        onClick={handleMaximize}
        title="Maximize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </button>
      
      <button 
        className="window-control close" 
        onClick={handleClose}
        title="Close"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default WindowControls;