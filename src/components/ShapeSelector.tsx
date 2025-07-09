import React, { useEffect, useRef, useState } from 'react';
import type { Tool } from '../hooks/useWhiteboard';

interface ShapeSelectorProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}

const shapes = [
    { 
        tool: 'rectangle' as Tool, 
        title: 'Rectangle',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
        )
    },
    { 
        tool: 'circle' as Tool, 
        title: 'Circle',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
            </svg>
        )
    },
    { 
        tool: 'line' as Tool, 
        title: 'Line',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="7" y1="17" x2="17" y2="7"/>
            </svg>
        )
    },
    { 
        tool: 'ellipse' as Tool, 
        title: 'Ellipse',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="12" cy="12" rx="10" ry="6"/>
            </svg>
        )
    }
];

const ShapeSelector: React.FC<ShapeSelectorProps> = ({ activeTool, onToolChange }) => {
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

    const handleShapeSelect = (tool: Tool) => {
        onToolChange(tool);
        setIsExpanded(false);
    };

    const getCurrentShapeIcon = () => {
        const currentShape = shapes.find(shape => shape.tool === activeTool);
        return currentShape ? currentShape.icon : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
        );
    };

    const isShapeTool = ['rectangle', 'circle', 'line', 'ellipse'].includes(activeTool);

    return (
        <div className="shape-selector" ref={containerRef}>
            <button
                className={`shape-button ${isShapeTool ? 'active' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                title="Shape Tools"
            >
                {getCurrentShapeIcon()}
            </button>
            
            {isExpanded && (
                <div className="shape-grid">
                    {shapes.map((shape) => (
                        <button
                            key={shape.tool}
                            className={`shape-option ${activeTool === shape.tool ? 'selected' : ''}`}
                            onClick={() => handleShapeSelect(shape.tool)}
                            title={shape.title}
                        >
                            {shape.icon}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShapeSelector; 