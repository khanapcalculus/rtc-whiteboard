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
                <div 
                    className="text-grid" 
                    style={{ touchAction: 'manipulation' }}
                    onTouchStart={(e) => {
                        // Prevent touch events from bubbling up to document
                        e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                        // Allow scrolling within the dropdown
                        e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                        // Prevent touch events from bubbling up to document
                        e.stopPropagation();
                    }}
                >
                    <div style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid #eee',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: 'black'
                    }}>
                        Font & Size
                    </div>
                    
                    {/* Font Family Section */}
                    <div style={{ 
                        padding: '8px',
                        borderBottom: '1px solid #eee'
                    }}>
                        <div style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            marginBottom: '6px',
                            color: 'black'
                        }}>
                            Font Family
                        </div>
                        <div 
                            style={{ 
                                maxHeight: '180px', 
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                WebkitOverflowScrolling: 'touch'
                            }}
                            onTouchStart={(e) => {
                                // Prevent touch events from bubbling up during scroll
                                e.stopPropagation();
                                setIsScrolling(true);
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                            }}
                            onTouchMove={(e) => {
                                // Prevent touch events from bubbling up during scroll
                                e.stopPropagation();
                                setIsScrolling(true);
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                                scrollTimeoutRef.current = setTimeout(() => {
                                    setIsScrolling(false);
                                }, 300);
                            }}
                            onTouchEnd={() => {
                                // Reset scrolling state after a delay
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                                scrollTimeoutRef.current = setTimeout(() => {
                                    setIsScrolling(false);
                                }, 200);
                            }}
                        >
                            {FONT_FAMILIES.map((font) => (
                                <div
                                    key={font}
                                    onClick={() => {
                                        onFontChange(font);
                                        setShowFontGrid(false);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Only handle selection if not scrolling
                                        if (!isScrolling) {
                                            onFontChange(font);
                                            setShowFontGrid(false);
                                        }
                                    }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontFamily: font,
                                        fontSize: '12px',
                                        color: 'black',
                                        backgroundColor: font === selectedFont ? '#e3f2fd' : 'transparent',
                                        borderRadius: '4px',
                                        border: font === selectedFont ? '1px solid #2196f3' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                        minHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (font !== selectedFont) {
                                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (font !== selectedFont) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {font}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Font Size Section */}
                    <div style={{ padding: '8px' }}>
                        <div style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            marginBottom: '6px',
                            color: 'black'
                        }}>
                            Font Size
                        </div>
                        <div 
                            style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '4px',
                                maxHeight: '120px',
                                overflowY: 'auto'
                            }}
                            onTouchStart={(e) => {
                                // Prevent touch events from bubbling up during scroll
                                e.stopPropagation();
                                setIsScrolling(true);
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                            }}
                            onTouchMove={(e) => {
                                // Prevent touch events from bubbling up during scroll
                                e.stopPropagation();
                                setIsScrolling(true);
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                                scrollTimeoutRef.current = setTimeout(() => {
                                    setIsScrolling(false);
                                }, 300);
                            }}
                            onTouchEnd={() => {
                                // Reset scrolling state after a delay
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                                scrollTimeoutRef.current = setTimeout(() => {
                                    setIsScrolling(false);
                                }, 200);
                            }}
                        >
                            {FONT_SIZES.map((size) => (
                                <div
                                    key={size}
                                    onClick={() => {
                                        onSizeChange(size);
                                        setShowFontGrid(false);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Only handle selection if not scrolling
                                        if (!isScrolling) {
                                            onSizeChange(size);
                                            setShowFontGrid(false);
                                        }
                                    }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                    }}
                                    style={{
                                        padding: '8px 6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        color: 'black',
                                        textAlign: 'center',
                                        backgroundColor: size === selectedSize ? '#e3f2fd' : 'transparent',
                                        borderRadius: '4px',
                                        border: size === selectedSize ? '1px solid #2196f3' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                        minHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (size !== selectedSize) {
                                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (size !== selectedSize) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {size}
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