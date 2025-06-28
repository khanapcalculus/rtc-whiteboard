import React from 'react';
import './Toolbar.css';

const Toolbar = ({ activeTool, onToolChange }) => {
  const tools = [
    {
      id: 'pen',
      name: 'Pen',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      )
    },
    {
      id: 'eraser',
      name: 'Eraser',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20H7l-7-7 3.5-3.5L17 22l3-3z"/>
          <path d="M15 5l4 4"/>
        </svg>
      )
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
      )
    },
    {
      id: 'circle',
      name: 'Circle',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      )
    }
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-content">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-button ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.name}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar; 