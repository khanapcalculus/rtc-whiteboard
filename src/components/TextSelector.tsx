import React, { useEffect, useRef, useState } from 'react';
import type { Tool } from '../hooks/useWhiteboard';
import { FONT_FAMILIES, FONT_SIZES } from '../tools/text';

interface TextSelectorProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    selectedFont: string;
    selectedSize: number;
    onFontChange: (font: string) => void;
    onSizeChange: (size: number) => void;
}

const TextSelector: React.FC<TextSelectorProps> = ({
    activeTool,
    onToolChange,
    selectedFont,
    selectedSize,
    onFontChange,
    onSizeChange
}) => {
    const [showFontGrid, setShowFontGrid] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!showFontGrid) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (textRef.current && !textRef.current.contains(target)) {
                setShowFontGrid(false);
            }
        };

        const handleTouchOutside = (event: TouchEvent) => {
            const target = event.target as Node;
            // Only close if it's a single touch and not scrolling
            if (event.touches.length === 1 && !isScrolling && textRef.current && !textRef.current.contains(target)) {
                // Add a small delay to differentiate between tap and scroll
                setTimeout(() => {
                    if (!isScrolling && textRef.current && !textRef.current.contains(target)) {
                        setShowFontGrid(false);
                    }
                }, 150);
            }
        };

        // Add both mouse and touch event listeners
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleTouchOutside, { passive: true });
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleTouchOutside);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [showFontGrid]);

    const handleTextClick = () => {
        if (activeTool === 'text') {
            setShowFontGrid(!showFontGrid);
        } else {
            onToolChange('text');
        }
    };

    return (
        <div className="text-selector" ref={textRef}>
            <button 
                className={`text-button ${activeTool === 'text' ? 'active' : ''}`}
                onClick={handleTextClick}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleTextClick();
                }}
                title="Text Tool"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="4,7 4,4 20,4 20,7"/>
                    <line x1="9" y1="20" x2="15" y2="20"/>
                    <line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
            </button>
            
            {showFontGrid && (
                <div className="text-grid">
                    <div className="grid-title">Font & Size</div>
                    
                    {/* Font Family Section */}
                    <div className="font-section">
                        <div className="section-title">Font Family</div>
                        <div className="font-list">
                            {FONT_FAMILIES.map((font) => (
                                <div
                                    key={font}
                                    className={`font-item ${font === selectedFont ? 'active' : ''}`}
                                    onClick={() => {
                                        onFontChange(font);
                                        setShowFontGrid(false);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!isScrolling) {
                                            onFontChange(font);
                                            setShowFontGrid(false);
                                        }
                                    }}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Font Size Section */}
                    <div className="size-section">
                        <div className="section-title">Font Size</div>
                        <div className="size-grid">
                            {FONT_SIZES.map((size) => (
                                <div
                                    key={size}
                                    className={`size-item ${size === selectedSize ? 'active' : ''}`}
                                    onClick={() => {
                                        onSizeChange(size);
                                        setShowFontGrid(false);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!isScrolling) {
                                            onSizeChange(size);
                                            setShowFontGrid(false);
                                        }
                                    }}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    {size}px
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextSelector; 