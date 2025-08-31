import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'theme-toggle-sm',
    md: 'theme-toggle-md',
    lg: 'theme-toggle-lg'
  };

  return (
    <button
      className={`theme-toggle ${sizeClasses[size]} ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <div className="theme-icon">
            {theme === 'light' ? (
              // Sun icon for light mode
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .theme-toggle {
          position: relative;
          background: var(--bg-surface);
          border: 2px solid var(--border-primary);
          border-radius: 50px;
          cursor: pointer;
          transition: all var(--transition-normal);
          padding: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .theme-toggle:hover {
          border-color: var(--color-primary);
          box-shadow: var(--focus-ring);
          transform: translateY(-1px);
        }
        
        .theme-toggle:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: var(--focus-ring);
        }
        
        .theme-toggle:active {
          transform: translateY(0);
        }
        
        .theme-toggle-track {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-highlight) 100%);
          border-radius: inherit;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: all var(--transition-normal);
        }
        
        .theme-toggle-thumb {
          width: calc(50% - 2px);
          height: calc(100% - 4px);
          background: var(--bg-surface);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-bounce);
          transform: translateX(${theme === 'dark' ? 'calc(100% + 4px)' : '0'});
          box-shadow: var(--shadow-md);
        }
        
        .theme-icon {
          width: 60%;
          height: 60%;
          color: var(--color-primary);
          transition: all var(--transition-normal);
        }
        
        .theme-icon svg {
          width: 100%;
          height: 100%;
        }
        
        /* Size variants */
        .theme-toggle-sm {
          width: 40px;
          height: 20px;
        }
        
        .theme-toggle-md {
          width: 50px;
          height: 25px;
        }
        
        .theme-toggle-lg {
          width: 60px;
          height: 30px;
        }
        
        /* Dark mode specific adjustments */
        :root[data-theme="dark"] .theme-toggle-track {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        }
        
        /* Animation for theme switching */
        @keyframes toggleBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .theme-toggle:active .theme-toggle-thumb {
          animation: toggleBounce 0.2s ease;
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          .theme-toggle,
          .theme-toggle-track,
          .theme-toggle-thumb,
          .theme-icon {
            transition: none;
          }
          
          .theme-toggle:active .theme-toggle-thumb {
            animation: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .theme-toggle {
            border-width: 3px;
          }
        }
      `}</style>
    </button>
  );
};

export default ThemeToggle;