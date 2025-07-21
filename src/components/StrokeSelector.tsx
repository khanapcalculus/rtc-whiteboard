import React, { useEffect, useRef, useState } from 'react';

interface StrokeSelectorProps {
    selectedStroke: number;
    onStrokeChange: (stroke: number) => void;
}

const strokes = Array.from({ length: 16 }, (_, i) => ({
    width: i + 1,
    label: `${i + 1}px`
}));

const StrokeSelector: React.FC<StrokeSelectorProps> = ({ selectedStroke, onStrokeChange }) => {
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

    const handleStrokeSelect = (stroke: number) => {
        onStrokeChange(stroke);
        setIsExpanded(false);
    };

    return (
        <div className="stroke-selector" ref={containerRef}>
            <button
                className="stroke-button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={`Stroke Width: ${selectedStroke}px`}
            >
                <span className="stroke-button-number">{selectedStroke}</span>
            </button>
            
            {isExpanded && (
                <div className="stroke-grid">
                    {strokes.map((stroke) => (
                        <button
                            key={stroke.width}
                            className={`stroke-option ${selectedStroke === stroke.width ? 'selected' : ''}`}
                            onClick={() => handleStrokeSelect(stroke.width)}
                            title={stroke.label}
                        >
                            <span className="stroke-number">{stroke.width}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StrokeSelector; 