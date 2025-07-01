import React, { useEffect, useRef, useState } from 'react';
import '../styles/ColorPalette.css';

const ColorPalette = ({ type, activeColor, onColorSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const paletteRef = useRef(null);
  
  // Define expanded color palette with more options
  const colors = [
    // Basic colors
    '#000000', // Black
    '#FFFFFF', // White
    '#808080', // Gray
    '#C0C0C0', // Light Gray
    
    // Primary colors
    '#FF0000', // Red
    '#00FF00', // Lime
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    
    // Secondary colors
    '#800000', // Maroon
    '#008000', // Green
    '#000080', // Navy
    '#808000', // Olive
    '#800080', // Purple
    '#008080', // Teal
    
    // Additional colors
    '#FFA500', // Orange
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#D2B48C', // Tan
    '#40E0D0', // Turquoise
    '#9ACD32', // Yellow Green
    '#FF6347', // Tomato
    '#4682B4', // Steel Blue
    '#DDA0DD', // Plum
    '#F0E68C', // Khaki
    '#FFB6C1', // Light Pink
    '#87CEEB', // Sky Blue
    '#98FB98', // Pale Green
    '#F5DEB3', // Wheat
    
    'transparent' // Transparent option
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

  const handleColorSelect = (color) => {
    onColorSelect(color);
    setIsExpanded(false);
  };

  return (
    <div className="color-palette" ref={paletteRef}>
      <div 
        className="color-button"
        onClick={togglePalette}
      >
        {type === 'stroke' ? (
          <div 
            className="color-circle" 
            style={{ 
              backgroundColor: activeColor === 'transparent' ? '#ffffff' : activeColor,
              background: activeColor === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : activeColor,
              backgroundSize: activeColor === 'transparent' ? '8px 8px' : 'auto',
              backgroundPosition: activeColor === 'transparent' ? '0 0, 4px 4px' : 'auto',
              border: '2px solid #333',
              borderRadius: '50%',
              width: '20px',
              height: '20px'
            }}
          ></div>
        ) : (
          <div 
            className="color-circle" 
            style={{ 
              backgroundColor: activeColor === 'transparent' ? '#ffffff' : activeColor,
              background: activeColor === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : activeColor,
              backgroundSize: activeColor === 'transparent' ? '8px 8px' : 'auto',
              backgroundPosition: activeColor === 'transparent' ? '0 0, 4px 4px' : 'auto',
              border: '2px solid #333',
              borderRadius: '50%',
              width: '20px',
              height: '20px'
            }}
          ></div>
        )}
      </div>
      
      {isExpanded && (
        <div className="color-options">
          {colors.map((color, index) => (
            <div 
              key={index}
              className="color-option"
              onClick={() => handleColorSelect(color)}
            >
              <div 
                className="color-circle" 
                style={{ 
                  backgroundColor: color === 'transparent' ? '#ffffff' : color,
                  background: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : color,
                  backgroundSize: color === 'transparent' ? '6px 6px' : 'auto',
                  backgroundPosition: color === 'transparent' ? '0 0, 3px 3px' : 'auto',
                  border: '1px solid #333',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px'
                }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPalette;