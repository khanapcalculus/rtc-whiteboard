import React, { useEffect } from 'react';
import type { Tool } from '../hooks/useWhiteboard';
import ColorSelector from './ColorSelector';
import ShapeSelector from './ShapeSelector';
import StrokeSelector from './StrokeSelector';
import TextSelector from './TextSelector';

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    onClear: () => void;
    onImageUpload: () => void;
    selectedColor: string;
    onColorChange: (color: string) => void;
    selectedStroke: number;
    onStrokeChange: (stroke: number) => void;
    selectedFont: string;
    onFontChange: (font: string) => void;
    selectedFontSize: number;
    onFontSizeChange: (size: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
    activeTool, 
    onToolChange, 
    onClear,
    onImageUpload,
    selectedColor, 
    onColorChange, 
    selectedStroke, 
    onStrokeChange,
    selectedFont,
    onFontChange,
    selectedFontSize,
    onFontSizeChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {
    // Add touch event handling for better tablet support
    useEffect(() => {
        const handleTouchEvents = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.toolbar')) {
                // Allow toolbar touch events to work normally
                return;
            }
        };

        document.addEventListener('touchstart', handleTouchEvents, { passive: true });
        document.addEventListener('touchend', handleTouchEvents, { passive: true });
        
        return () => {
            document.removeEventListener('touchstart', handleTouchEvents);
            document.removeEventListener('touchend', handleTouchEvents);
        };
    }, []);
    const handleToolChange = (tool: Tool) => {
        console.log('Tool change requested:', tool);
        onToolChange(tool);
    };

    const handleClear = () => {
        console.log('Clear requested');
        onClear();
    };

    const handleImageUpload = () => {
        console.log('Image upload requested');
        onImageUpload();
    };

    return (
        <div className="toolbar">
            <button
                className={activeTool === 'pen' ? 'active' : ''}
                onClick={() => handleToolChange('pen')}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleToolChange('pen');
                }}
                title="Pen Tool"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
            </button>
            
            <button
                className={activeTool === 'pan' ? 'active' : ''}
                onClick={() => handleToolChange('pan')}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleToolChange('pan');
                }}
                title="Pan Tool"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/>
                    <path d="M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1h4z"/>
                    <path d="M10 10.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.5"/>
                    <path d="M6 12V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3c0 6 4 9 8 9s8-3 8-9v-2"/>
                </svg>
            </button>

            <button
                className={`select-button ${activeTool === 'select' ? 'active' : ''}`}
                onClick={() => handleToolChange('select')}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleToolChange('select');
                }}
                title="Select Tool"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    <path d="M13 13l6 6"/>
                </svg>
            </button>

            <button
                className={activeTool === 'eraser' ? 'active' : ''}
                onClick={() => handleToolChange('eraser')}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleToolChange('eraser');
                }}
                title="Eraser Tool"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 20H7l-4-4 9.5-9.5a2.828 2.828 0 1 1 4 4L7 20"/>
                    <path d="M15 5l4 4"/>
                </svg>
            </button>

            <TextSelector 
                activeTool={activeTool}
                onToolChange={handleToolChange}
                selectedFont={selectedFont}
                selectedSize={selectedFontSize}
                onFontChange={onFontChange}
                onSizeChange={onFontSizeChange}
            />

            <div className="toolbar-separator" />

            <ShapeSelector 
                activeTool={activeTool}
                onToolChange={handleToolChange}
            />

            <div className="toolbar-separator" />

            <button
                onClick={handleImageUpload}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleImageUpload();
                }}
                title="Upload Image"
                className="image-button"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>
            </button>

            <div className="toolbar-separator" />

            <ColorSelector 
                selectedColor={selectedColor}
                onColorChange={onColorChange}
            />

            <StrokeSelector 
                selectedStroke={selectedStroke}
                onStrokeChange={onStrokeChange}
            />

            <div className="toolbar-separator" />

            <button
                onClick={onUndo}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    onUndo();
                }}
                title="Undo"
                className={!canUndo ? 'disabled' : ''}
                disabled={!canUndo}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 7v6h6"/>
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                </svg>
            </button>

            <button
                onClick={onRedo}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    onRedo();
                }}
                title="Redo"
                className={!canRedo ? 'disabled' : ''}
                disabled={!canRedo}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 7v6h-6"/>
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
                </svg>
            </button>

            <div className="toolbar-separator" />

            <button
                onClick={handleClear}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleClear();
                }}
                title="Clear Canvas"
                className="clear-button"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
            </button>
        </div>
    );
};

export default Toolbar; 