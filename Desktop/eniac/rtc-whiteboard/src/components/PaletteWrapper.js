import React, { useEffect, useRef, useState } from 'react';
import '../styles/PaletteWrapper.css';
import ColorPalette from './ColorPalette';
import StrokePalette from './StrokePalette';

const PaletteWrapper = ({ 
  strokeColor, 
  fillColor, 
  strokeWidth,
  setStrokeColor, 
  setFillColor, 
  setStrokeWidth 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef(null);

  // Handle click outside to close palette wrapper
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="palette-wrapper" ref={wrapperRef}>
      <div 
        className="palette-toggle" 
        onClick={toggleExpand}
        title="Color & Stroke Settings"
      >
        <div className="palette-preview">
          {/* Show active settings preview */}
          <div className="stroke-color-preview" style={{ backgroundColor: strokeColor }}></div>
          <div className="fill-color-preview" style={{ backgroundColor: fillColor }}></div>
          <div className="stroke-width-preview">
            <div 
              className="width-dot" 
              style={{ 
                width: `${Math.min(strokeWidth, 10)}px`, 
                height: `${Math.min(strokeWidth, 10)}px` 
              }}
            ></div>
          </div>
        </div>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="palette-panel">
          <div className="palette-item">
            <ColorPalette 
              type="stroke" 
              activeColor={strokeColor} 
              onColorSelect={setStrokeColor} 
            />
            <span className="palette-label">Stroke</span>
          </div>
          <div className="palette-item">
            <ColorPalette 
              type="fill" 
              activeColor={fillColor} 
              onColorSelect={setFillColor} 
            />
            <span className="palette-label">Fill</span>
          </div>
          <div className="palette-item">
            <StrokePalette 
              activeStrokeWidth={strokeWidth} 
              onStrokeWidthSelect={setStrokeWidth} 
            />
            <span className="palette-label">Width</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaletteWrapper;