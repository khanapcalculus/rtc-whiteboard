import React, { useEffect, useRef, useState } from 'react';
import '../styles/StrokePalette.css';

const StrokePalette = ({ activeStrokeWidth, onStrokeWidthSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const paletteRef = useRef(null);
  
  // Define 16 stroke widths
  const strokeWidths = [
    1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 30
  ];

  // Handle click outside to close palette
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target)) {
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

  const togglePalette = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStrokeWidthSelect = (width) => {
    onStrokeWidthSelect(width);
    setIsExpanded(false);
  };

  return (
    <div className="stroke-palette" ref={paletteRef}>
      <div 
        className="stroke-button"
        onClick={togglePalette}
      >
        <div className="stroke-width-icon">
          <div 
            className="stroke-dot" 
            style={{ width: `${Math.min(activeStrokeWidth, 20)}px`, height: `${Math.min(activeStrokeWidth, 20)}px` }}
          ></div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="stroke-options">
          {strokeWidths.map((width, index) => (
            <div 
              key={index}
              className="stroke-option"
              onClick={() => handleStrokeWidthSelect(width)}
            >
              <div className="stroke-width-icon">
                <div 
                  className="stroke-dot" 
                  style={{ width: `${Math.min(width, 20)}px`, height: `${Math.min(width, 20)}px` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrokePalette;