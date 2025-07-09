import React, { useEffect, useRef, useState } from 'react';

interface ColorSelectorProps {
    selectedColor: string;
    onColorChange: (color: string) => void;
}

const colors = [
    // Basic colors
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    
    // Primary colors
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    
    // Warm colors
    '#FF6600', '#FF9900', '#FFCC00', '#FFA500', '#FF4500', '#DC143C',
    
    // Cool colors
    '#0066FF', '#3399FF', '#66CCFF', '#0099CC', '#006699', '#004080',
    
    // Purple/Pink tones
    '#6600FF', '#9900FF', '#CC00FF', '#FF69B4', '#FF1493', '#C71585',
    
    // Green tones
    '#32CD32', '#00FF7F', '#00FA9A', '#90EE90', '#228B22', '#006400',
    
    // Earth tones
    '#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#F4A460',
    
    // Additional colors
    '#800080', '#4B0082', '#2F4F4F', '#708090', '#B0C4DE', '#F0E68C'
];

const ColorSelector: React.FC<ColorSelectorProps> = ({ selectedColor, onColorChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

    const handleColorSelect = (color: string) => {
        onColorChange(color);
        setIsExpanded(false);
    };

    return (
        <div className="color-selector" ref={containerRef}>
            <button
                className="color-button"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Color"
            >
                <div 
                    className="color-dot"
                    style={{ 
                        width: '16px',
                        height: '16px',
                        backgroundColor: selectedColor,
                        borderRadius: '50%',
                        border: '1px solid rgba(0, 0, 0, 0.2)'
                    }}
                />
            </button>
            
            {isExpanded && (
                <div className="color-grid">
                    {colors.map((color, index) => (
                        <button
                            key={color}
                            className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                            title={`Color ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColorSelector; 