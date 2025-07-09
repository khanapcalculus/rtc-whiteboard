import React, { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES, FONT_SIZES } from '../tools/text';

interface FontSelectorProps {
    selectedFont: string;
    selectedSize: number;
    onFontChange: (font: string) => void;
    onSizeChange: (size: number) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({
    selectedFont,
    selectedSize,
    onFontChange,
    onSizeChange
}) => {
    const [showFontGrid, setShowFontGrid] = useState(false);
    const fontRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fontRef.current && !fontRef.current.contains(event.target as Node)) {
                setShowFontGrid(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="font-selector" ref={fontRef} style={{ position: 'relative' }}>
            <button
                className="font-button"
                onClick={() => setShowFontGrid(!showFontGrid)}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    setShowFontGrid(!showFontGrid);
                }}
                title={`Font: ${selectedFont}, Size: ${selectedSize}px`}
            >
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    fontSize: '10px',
                    fontFamily: selectedFont
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Aa</span>
                    <span style={{ fontSize: '8px', marginTop: '2px' }}>{selectedSize}</span>
                </div>
            </button>
            
            {showFontGrid && (
                <div className="font-grid">
                    <div style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid #eee',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textAlign: 'center'
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
                            color: '#666'
                        }}>
                            Font Family
                        </div>
                        <div style={{ 
                            maxHeight: '120px', 
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                        }}>
                            {FONT_FAMILIES.map((font) => (
                                <div
                                    key={font}
                                    onClick={() => {
                                        onFontChange(font);
                                        setShowFontGrid(false);
                                    }}
                                    style={{
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        fontFamily: font,
                                        fontSize: '12px',
                                        backgroundColor: font === selectedFont ? '#e3f2fd' : 'transparent',
                                        borderRadius: '4px',
                                        border: font === selectedFont ? '1px solid #2196f3' : '1px solid transparent',
                                        transition: 'all 0.2s ease'
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
                            color: '#666'
                        }}>
                            Font Size
                        </div>
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '4px',
                            maxHeight: '120px',
                            overflowY: 'auto'
                        }}>
                            {FONT_SIZES.map((size) => (
                                <div
                                    key={size}
                                    onClick={() => {
                                        onSizeChange(size);
                                        setShowFontGrid(false);
                                    }}
                                    style={{
                                        padding: '6px 4px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        textAlign: 'center',
                                        backgroundColor: size === selectedSize ? '#e3f2fd' : 'transparent',
                                        borderRadius: '4px',
                                        border: size === selectedSize ? '1px solid #2196f3' : '1px solid transparent',
                                        transition: 'all 0.2s ease'
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

export default FontSelector; 