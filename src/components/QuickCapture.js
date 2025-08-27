import React, { useState, useEffect, useRef } from 'react';

const QuickCapture = ({ onCapture, onClose }) => {
  const [content, setContent] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus on input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (e) => {
      // Enter to capture (but allow Shift+Enter for new lines)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCapture();
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const handleCapture = () => {
    if (content.trim()) {
      onCapture(content.trim());
      setContent('');
    } else {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    setContent(e.target.value);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="quick-capture-overlay" onClick={handleOverlayClick}>
      <div className="quick-capture fade-in">
        <div className="quick-capture-header">
          <h2 className="quick-capture-title">Quick Capture</h2>
          <button className="close-btn" onClick={onClose} title="Close (Esc)">
            ×
          </button>
        </div>
        
        <div className="quick-capture-content">
          <textarea
            ref={inputRef}
            className="quick-capture-input"
            value={content}
            onChange={handleInputChange}
            placeholder="Type your note here... (Enter to save, Shift+Enter for new line, Esc to cancel)"
            rows={4}
          />
          
          <div className="quick-capture-tips">
            <div className="tip">
              <span className="tip-icon">💡</span>
              <span className="tip-text">Start typing immediately - no need to click</span>
            </div>
            <div className="tip">
              <span className="tip-icon">⚡</span>
              <span className="tip-text">Perfect for meeting notes and quick thoughts</span>
            </div>
            <div className="tip">
              <span className="tip-icon">🔗</span>
              <span className="tip-text">Link notes together after creation</span>
            </div>
          </div>
        </div>
        
        <div className="quick-capture-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            title="Cancel (Esc)"
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCapture}
            disabled={!content.trim()}
            title="Create Note (Enter)"
          >
            Create Note
          </button>
        </div>
        
        <div className="quick-capture-shortcuts">
          <div className="shortcut">
            <kbd>Enter</kbd> Create note
          </div>
          <div className="shortcut">
            <kbd>Shift</kbd> + <kbd>Enter</kbd> New line
          </div>
          <div className="shortcut">
            <kbd>Esc</kbd> Cancel
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .quick-capture-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(8px);
          animation: fadeInOverlay 0.2s ease-out;
        }
        
        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .quick-capture {
          background: white;
          border-radius: 16px;
          padding: 0;
          width: 600px;
          max-width: 90vw;
          max-height: 80vh;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          animation: slideInUp 0.3s ease-out;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .quick-capture-header {
          padding: 25px 30px 20px;
          border-bottom: 1px solid #e1e8ed;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .quick-capture-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .quick-capture-content {
          padding: 30px;
        }
        
        .quick-capture-input {
          width: 100%;
          padding: 20px;
          border: 2px solid #e1e8ed;
          border-radius: 12px;
          font-size: 16px;
          font-family: inherit;
          line-height: 1.5;
          transition: all 0.2s ease;
          margin-bottom: 25px;
          resize: vertical;
          min-height: 120px;
          background: rgba(248, 249, 250, 0.5);
        }
        
        .quick-capture-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .quick-capture-tips {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }
        
        .tip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(52, 152, 219, 0.05);
          border-radius: 8px;
          border-left: 3px solid #3498db;
        }
        
        .tip-icon {
          font-size: 16px;
        }
        
        .tip-text {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
        }
        
        .quick-capture-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 0 30px 25px;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: #f8f9fa;
          color: #6c757d;
          border: 1px solid #e1e8ed;
        }
        
        .btn-secondary:hover {
          background: #e9ecef;
          border-color: #bdc3c7;
        }
        
        .quick-capture-shortcuts {
          display: flex;
          gap: 20px;
          justify-content: center;
          padding: 20px 30px 25px;
          background: #f8f9fa;
          border-top: 1px solid #e1e8ed;
        }
        
        .shortcut {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6c757d;
          font-weight: 500;
        }
        
        kbd {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
          .quick-capture {
            margin: 20px;
            width: auto;
          }
          
          .quick-capture-content {
            padding: 20px;
          }
          
          .quick-capture-actions {
            padding: 0 20px 20px;
          }
          
          .quick-capture-shortcuts {
            flex-direction: column;
            gap: 8px;
            padding: 15px 20px;
          }
          
          .tip {
            padding: 10px 12px;
          }
          
          .tip-text {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickCapture;