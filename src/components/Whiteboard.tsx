import { useEffect, useRef, useState } from 'react';
import { Circle, Ellipse, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { useWhiteboard } from '../hooks/useWhiteboard';
import Toolbar from './Toolbar';
import './Toolbar.css';

const Whiteboard = () => {
    const { 
        lines, 
        images,
        shapes,
        texts,
        tool, 
        setTool,
        color,
        setColor,
        strokeWidth,
        setStrokeWidth,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        selection,
        eraserState,
        stagePos,
        handleMouseDown, 
        handleMouseMove, 
        handleMouseUp,
        handleDragEnd,
        handleImageUpload,
        handleTransform,
        handleTextDoubleClick,
        handleTextEdit,
        undo,
        redo,
        canUndo,
        canRedo,
        clearCanvas,
        lastCreatedTextId
    } = useWhiteboard();

    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const transformTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [imageElements, setImageElements] = useState<Map<string, HTMLImageElement>>(new Map());
    const [editingText, setEditingText] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });

    // Load images when they change
    useEffect(() => {
        images.forEach(imageItem => {
            if (!imageElements.has(imageItem.id)) {
                const img = new Image();
                img.onload = () => {
                    setImageElements(prev => new Map(prev).set(imageItem.id, img));
                };
                img.src = imageItem.src;
            }
        });
    }, [images, imageElements]);

    // Handle transformer selection
    useEffect(() => {
        console.log('Transformer useEffect - selection changed:', selection);
        if (transformerRef.current) {
            if (selection.selectedId) {
                const stage = stageRef.current;
                const selectedNode = stage.findOne('#' + selection.selectedId);
                console.log('Looking for node with ID:', selection.selectedId, 'Found:', selectedNode);
                if (selectedNode) {
                    console.log('Setting transformer nodes to:', selectedNode);
                    transformerRef.current.nodes([selectedNode]);
                    transformerRef.current.getLayer().batchDraw();
                } else {
                    console.log('Selected node not found, clearing transformer');
                    transformerRef.current.nodes([]);
                    transformerRef.current.getLayer().batchDraw();
                }
            } else {
                console.log('No selection, clearing transformer');
                transformerRef.current.nodes([]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else {
            console.log('Transformer ref is null');
        }
    }, [selection.selectedId]);

    // Focus text input when editing starts
    useEffect(() => {
        if (editingText && textInputRef.current) {
            // Use a longer delay and multiple attempts to ensure focus on computers
            const focusInput = () => {
                if (textInputRef.current) {
                    textInputRef.current.focus();
                    textInputRef.current.select();
                }
            };
            
            // Try focusing immediately
            focusInput();
            
            // Try again after a short delay
            setTimeout(focusInput, 50);
            
            // Try once more after a longer delay
            setTimeout(focusInput, 150);
        }
    }, [editingText]);

    // Debug tool changes
    useEffect(() => {
        console.log('Current tool changed to:', tool);
        console.log('Stage draggable:', tool === 'pan');
    }, [tool]);

    // Prevent page refresh and improve touch handling - but only on canvas area
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const preventDefaultTouch = (e: TouchEvent) => {
            // Check if the touch target is the toolbar or text input
            const target = e.target as HTMLElement;
            const isToolbarElement = target.closest('.toolbar');
            const isTextInput = target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text';
            
            // Only prevent default if it's not a toolbar interaction or text input
            if (!isToolbarElement && !isTextInput && e.touches.length > 0) {
                if (tool === 'select') {
                    // For selection tool, prevent default to avoid scrolling and enable touch interactions
                    e.preventDefault();
                } else if (tool === 'pen') {
                    // For pen tool, prevent all default touch behaviors to enable drawing over everything
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        const preventDefaultWheel = (e: WheelEvent) => {
            // Prevent page zoom with wheel/pinch, but not on toolbar
            const target = e.target as HTMLElement;
            const isToolbarElement = target.closest('.toolbar');
            
            if (!isToolbarElement && e.ctrlKey) {
                e.preventDefault();
            }
        };

        const preventContextMenu = (e: MouseEvent) => {
            // Prevent context menu on long press, but not on toolbar
            const target = e.target as HTMLElement;
            const isToolbarElement = target.closest('.toolbar');
            
            if (!isToolbarElement) {
                e.preventDefault();
            }
        };

        // Add touch event listeners with passive: false to allow preventDefault
        container.addEventListener('touchstart', preventDefaultTouch, { passive: false });
        container.addEventListener('touchmove', preventDefaultTouch, { passive: false });
        container.addEventListener('touchend', preventDefaultTouch, { passive: false });
        
        // Add specific touch handling for better tablet interaction
        if (tool === 'select') {
            container.style.touchAction = 'none';
        }
        container.addEventListener('wheel', preventDefaultWheel, { passive: false });
        container.addEventListener('contextmenu', preventContextMenu);

        return () => {
            container.removeEventListener('touchstart', preventDefaultTouch);
            container.removeEventListener('touchmove', preventDefaultTouch);
            container.removeEventListener('touchend', preventDefaultTouch);
            container.removeEventListener('wheel', preventDefaultWheel);
            container.removeEventListener('contextmenu', preventContextMenu);
            // Reset touch action
            container.style.touchAction = 'auto';
        };
    }, [tool]);

    const getPointerPosition = (e: any) => {
        const stage = stageRef.current;
        if (!stage) return null;
        
        // Handle both mouse and touch events
        if (e.evt && e.evt.touches && e.evt.touches.length > 0) {
            const touch = e.evt.touches[0];
            return { x: touch.clientX, y: touch.clientY };
        } else if (e.evt) {
            return { x: e.evt.clientX, y: e.evt.clientY };
        }
        return stage.getPointerPosition();
    };

    const onStageMouseDown = (e: any) => {
        console.log('Stage mouse down - tool:', tool, 'target:', e.target.getType());
        
        // Check if we clicked on the text input - if so, don't do anything
        if (editingText && e.evt && e.evt.target && e.evt.target.tagName === 'INPUT') {
            return;
        }
        
        // If we're editing text and click somewhere else, finish editing
        if (editingText && e.target === e.target.getStage()) {
            handleTextInputSubmit();
            return;
        }
        
        // For selection tool, handle clicks on stage background (to deselect)
        if (tool === 'select' && e.target === e.target.getStage()) {
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseDown(e);
            return;
        }
        
        // For selection tool, don't interfere with image/shape clicks - they handle themselves
        if (tool === 'select') {
            return;
        }
        
        // For text tool, handle clicks directly
        if (tool === 'text') {
            const pos = e.target.getStage().getPointerPosition();
            if (pos) {
                const adjustedPos = {
                    x: pos.x - stagePos.x,
                    y: pos.y - stagePos.y
                };
                
                // Set up text input at the clicked position
                setTextInputPosition({ x: pos.x, y: pos.y });
                setTextInput('');
                setEditingText('new'); // Use 'new' as a special ID for new text
                
                // Create the text item
                handleMouseDown(e);
                
                // Force focus after a brief delay to ensure the input is rendered
                setTimeout(() => {
                    if (textInputRef.current) {
                        textInputRef.current.focus();
                        textInputRef.current.select();
                    }
                }, 100);
            }
            return;
        }
        
        if (['pen', 'rectangle', 'circle', 'line', 'ellipse'].includes(tool)) {
            // Prevent dragging when using drawing tools
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseDown(e);
        } else if (tool === 'eraser') {
            // Prevent dragging when using eraser tool
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseDown(e);
        } else if (tool === 'pan') {
            console.log('Pan tool - starting pan');
            const pos = getPointerPosition(e);
            if (pos) {
                setIsPanning(true);
                setLastPanPoint(pos);
                console.log('Pan started at:', pos);
            }
        }
    };

    const onStageMouseMove = (e: any) => {
        if (['pen', 'rectangle', 'circle', 'line', 'ellipse'].includes(tool)) {
            // Prevent dragging during drawing
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseMove(e);
        } else if (tool === 'eraser') {
            // Prevent dragging during erasing
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseMove(e);
        } else if (tool === 'pan' && isPanning) {
            const pos = getPointerPosition(e);
            if (pos) {
                const deltaX = pos.x - lastPanPoint.x;
                const deltaY = pos.y - lastPanPoint.y;
                
                console.log('Pan move - delta:', deltaX, deltaY);
                
                const stage = stageRef.current;
                if (stage) {
                    const newX = stage.x() + deltaX;
                    const newY = stage.y() + deltaY;
                    stage.x(newX);
                    stage.y(newY);
                    console.log('New stage position:', newX, newY);
                }
                
                setLastPanPoint(pos);
            }
        }
    };

    const onStageMouseUp = (e: any) => {
        console.log('Stage mouse up - tool:', tool);
        
        if (['pen', 'rectangle', 'circle', 'line', 'ellipse'].includes(tool)) {
            // Prevent dragging when finishing drawing
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseUp(e);
        } else if (tool === 'eraser') {
            // Prevent dragging when finishing erasing
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            handleMouseUp(e);
        } else if (tool === 'pan' && isPanning) {
            console.log('Pan tool - ending pan');
            setIsPanning(false);
            
            // Update the stage position in the hook
            const stage = stageRef.current;
            if (stage) {
                const mockEvent = {
                    target: {
                        x: () => stage.x(),
                        y: () => stage.y()
                    },
                    evt: e.evt
                };
                handleDragEnd(mockEvent);
            }
        }
    };

    const onStageDragEnd = (e: any) => {
        console.log('Stage drag end - tool:', tool);
        // Prevent page refresh after panning
        if (e.evt) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
        }
        handleDragEnd(e);
    };

    const onStageDragStart = (e: any) => {
        console.log('Stage drag start - tool:', tool);
    };

    const onStageDragMove = (e: any) => {
        console.log('Stage drag move - tool:', tool, 'position:', e.target.x(), e.target.y());
    };

    const onTransformEnd = (e: any) => {
        handleTransform(e.target);
    };

    const onShapeClick = (e: any) => {
        console.log('onShapeClick called with tool:', tool, 'target:', e.target.id(), 'name:', e.target.name());
        if (tool === 'select') {
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            // For touch events, ensure proper selection
            if (e.evt && e.evt.type && e.evt.type.includes('touch')) {
                // Add a small delay for touch events to ensure proper registration
                setTimeout(() => {
                    handleMouseDown(e);
                }, 10);
            } else {
                handleMouseDown(e);
            }
        }
    };

    const onImageClick = (e: any) => {
        console.log('onImageClick called with tool:', tool, 'target:', e.target.id(), 'name:', e.target.name());
        if (tool === 'select') {
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            // For touch events, ensure proper selection
            if (e.evt && e.evt.type && e.evt.type.includes('touch')) {
                // Add a small delay for touch events to ensure proper registration
                setTimeout(() => {
                    handleMouseDown(e);
                }, 10);
            } else {
                handleMouseDown(e);
            }
        }
    };

    const onTextClick = (e: any) => {
        if (tool === 'select') {
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            // For touch events, ensure proper selection
            if (e.evt && e.evt.type && e.evt.type.includes('touch')) {
                // Add a small delay for touch events to ensure proper registration
                setTimeout(() => {
                    handleMouseDown(e);
                }, 10);
            } else {
                handleMouseDown(e);
            }
        }
    };

    const onTextDoubleClick = (e: any) => {
        console.log('Text double click detected:', e.target.id());
        e.cancelBubble = true;
        if (e.evt) {
            e.evt.stopPropagation();
        }
        
        const textId = e.target.id();
        const textItem = texts.find(t => t.id === textId);
        console.log('Found text item:', textItem);
        
        if (textItem) {
            const stage = stageRef.current;
            const textNode = stage.findOne('#' + textId);
            if (textNode) {
                const absolutePos = textNode.getAbsolutePosition();
                const inputPos = {
                    x: absolutePos.x + stagePos.x,
                    y: absolutePos.y + stagePos.y
                };
                console.log('Setting text input position:', inputPos);
                setTextInputPosition(inputPos);
            }
            setEditingText(textId);
            setTextInput(textItem.text);
            handleTextDoubleClick(textId);
            
            // Force focus after a brief delay to ensure the input is rendered
            setTimeout(() => {
                if (textInputRef.current) {
                    console.log('Focusing text input');
                    textInputRef.current.focus();
                    textInputRef.current.select();
                } else {
                    console.log('textInputRef.current is null');
                }
            }, 100);
        }
    };

    const handleTextInputSubmit = () => {
        if (editingText) {
            const trimmedText = textInput.trim();
            if (editingText === 'new') {
                // For new text, only save if there's actual content
                if (trimmedText) {
                    // The text was already created by handleMouseDown, just need to update it
                    const lastTextId = lastCreatedTextId.current;
                    if (lastTextId) {
                        handleTextEdit('new', trimmedText);
                    }
                } else {
                    // Remove empty text
                    const lastTextId = lastCreatedTextId.current;
                    if (lastTextId) {
                        handleTextEdit('new', ''); // This will remove the empty text
                    }
                }
            } else {
                // For existing text, update it (even if empty, let user decide)
                handleTextEdit(editingText, trimmedText);
            }
            setEditingText(null);
            setTextInput('');
        }
    };

    const handleTextInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextInputSubmit();
        } else if (e.key === 'Escape') {
            if (editingText === 'new') {
                // Cancel new text creation
                const lastTextId = lastCreatedTextId.current;
                if (lastTextId) {
                    handleTextEdit('new', ''); // This will remove the empty text
                }
            }
            setEditingText(null);
            setTextInput('');
        }
    };

    // Handle text input blur with a delay to prevent immediate closing
    const handleTextInputBlur = (e: React.FocusEvent) => {
        // Add a small delay to allow for potential refocus
        setTimeout(() => {
            // Only submit if the input is still not focused
            if (textInputRef.current && document.activeElement !== textInputRef.current) {
                handleTextInputSubmit();
            }
        }, 100);
    };

    console.log('Rendering whiteboard with tool:', tool, 'draggable:', tool === 'pan');
    console.log('Shapes:', shapes.length, 'Images:', images.length, 'Texts:', texts.length, 'Lines:', lines.length);
    console.log('Current selection:', selection);

    return (
        <div 
            ref={containerRef}
            style={{ 
                width: '100vw', 
                height: '100vh', 
                overflow: 'hidden',
                userSelect: 'none',  // Prevent text selection
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                position: 'relative'
            }}
        >
            {/* Logo */}
            <img 
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Logo" 
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    height: '50px',
                    width: 'auto',
                    zIndex: 1000,
                    pointerEvents: 'none' // Prevent interference with drawing
                }}
            />

            <Toolbar 
                activeTool={tool} 
                onToolChange={setTool} 
                onClear={clearCanvas}
                onImageUpload={handleImageUpload}
                selectedColor={color}
                onColorChange={setColor}
                selectedStroke={strokeWidth}
                onStrokeChange={setStrokeWidth}
                selectedFont={fontFamily}
                onFontChange={setFontFamily}
                selectedFontSize={fontSize}
                onFontSizeChange={setFontSize}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            {/* Inline Text Input */}
            {editingText && (
                <input
                    ref={textInputRef}
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleTextInputKeyDown}
                    onBlur={handleTextInputBlur}
                    onMouseDown={(e) => {
                        // Prevent event from bubbling to stage
                        e.stopPropagation();
                    }}
                    onFocus={(e) => {
                        // Ensure the input stays focused
                        e.target.select();
                    }}
                    style={{
                        position: 'absolute',
                        left: Math.max(0, textInputPosition.x),
                        top: Math.max(0, textInputPosition.y),
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        color: color,
                        backgroundColor: 'white',
                        border: '2px solid #007bff',
                        borderRadius: '4px',
                        outline: 'none',
                        minWidth: '120px',
                        padding: '6px 10px',
                        zIndex: 10000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        caretColor: color,
                        pointerEvents: 'auto',
                        userSelect: 'text',
                        WebkitUserSelect: 'text'
                    }}
                    placeholder="Type text..."
                    autoFocus
                />
            )}


            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={onStageMouseDown}
                onMouseMove={onStageMouseMove}
                onMouseUp={onStageMouseUp}
                onTouchStart={(e) => {
                    // For touch events, ensure proper handling
                    if (tool === 'select') {
                        // Add a small delay for touch selection to work properly
                        setTimeout(() => {
                            onStageMouseDown(e);
                        }, 10);
                    } else {
                        onStageMouseDown(e);
                    }
                }}
                onTouchMove={onStageMouseMove}
                onTouchEnd={onStageMouseUp}
                draggable={false} // Disable Konva's draggable, use custom pan
                onDragStart={onStageDragStart}
                onDragMove={onStageDragMove}
                onDragEnd={onStageDragEnd}
                x={stagePos.x}
                y={stagePos.y}
                style={{
                    touchAction: tool === 'pan' ? 'none' : tool === 'select' ? 'none' : 'auto' // Dynamic touch action
                }}
                scaleX={1}
                scaleY={1}
                listening={true}
                perfectDrawEnabled={false} // Performance optimization for smoother drawing
            >
                <Layer
                    listening={true}
                    perfectDrawEnabled={false}
                    imageSmoothingEnabled={true}
                    hitGraphEnabled={true}
                >
                    {/* Render Lines (behind everything else) */}
                    {lines.map((line, index) => (
                        <Line
                            key={line.id || `line-${index}`}
                            points={line.points}
                            stroke={line.color || '#000000'}
                            strokeWidth={line.strokeWidth || 2.5}
                            tension={0.1} // Further reduced tension for smoother rapid drawing
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation="source-over"
                            perfectDrawEnabled={false} // Performance optimization
                            listening={false} // Performance optimization
                            shadowForStrokeEnabled={false} // Performance optimization
                            hitStrokeWidth={0} // Performance optimization
                            bezier={false} // Disable Konva's bezier since we're doing our own smoothing
                            closed={false}
                            fillEnabled={false}
                        />
                    ))}

                    {/* Render Images */}
                    {images.map((imageItem) => {
                        const img = imageElements.get(imageItem.id);
                        if (!img) return null;
                        
                        return (
                            <KonvaImage
                                key={imageItem.id}
                                id={imageItem.id}
                                name="image"
                                x={imageItem.x}
                                y={imageItem.y}
                                width={imageItem.width}
                                height={imageItem.height}
                                image={img}
                                draggable={tool === 'select' && selection.selectedId === imageItem.id}
                                onDragEnd={onTransformEnd}
                                onClick={onImageClick}
                                onTap={onImageClick}
                                onTouchStart={onImageClick}
                                scaleX={imageItem.scaleX || 1}
                                scaleY={imageItem.scaleY || 1}
                                rotation={imageItem.rotation || 0}
                                listening={tool === 'select'}
                                perfectDrawEnabled={false}
                                hitStrokeWidth={tool === 'select' ? 10 : 0}
                            />
                        );
                    })}

                    {/* Render Shapes */}
                    {shapes.map((shape) => {
                        console.log('Rendering shape:', shape.id, 'listening:', tool === 'select', 'draggable:', tool === 'select' && selection.selectedId === shape.id);
                        const commonProps = {
                            id: shape.id,
                            name: "shape",
                            x: shape.x,
                            y: shape.y,
                            stroke: shape.color,
                            strokeWidth: shape.strokeWidth,
                            fill: tool === 'select' ? 'rgba(0,0,0,0.01)' : "transparent",
                            draggable: tool === 'select' && selection.selectedId === shape.id,
                            onDragEnd: onTransformEnd,
                            onClick: onShapeClick,
                            onTap: onShapeClick,
                            onTouchStart: onShapeClick,
                            scaleX: shape.scaleX || 1,
                            scaleY: shape.scaleY || 1,
                            rotation: shape.rotation || 0,
                            listening: tool === 'select',
                            perfectDrawEnabled: false,
                            hitStrokeWidth: tool === 'select' ? Math.max(shape.strokeWidth, 10) : shape.strokeWidth
                        };

                        switch (shape.type) {
                            case 'rectangle':
                                return (
                                    <Rect
                                        key={shape.id}
                                        {...commonProps}
                                        width={shape.width || 0}
                                        height={shape.height || 0}
                                    />
                                );
                            case 'circle':
                                return (
                                    <Circle
                                        key={shape.id}
                                        {...commonProps}
                                        radius={shape.radius || 0}
                                    />
                                );
                            case 'ellipse':
                                return (
                                    <Ellipse
                                        key={shape.id}
                                        {...commonProps}
                                        radiusX={shape.radiusX || 0}
                                        radiusY={shape.radiusY || 0}
                                    />
                                );
                            case 'line':
                                return (
                                    <Line
                                        key={shape.id}
                                        {...commonProps}
                                        points={shape.points || []}
                                        lineCap="round"
                                        x={0}
                                        y={0}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}

                    {/* Render Text */}
                    {texts.map((textItem) => {
                        // Don't render text that's currently being edited as new text
                        if (editingText === 'new' && textItem.text === '') {
                            return null;
                        }
                        
                        return (
                            <Text
                                key={textItem.id}
                                id={textItem.id}
                                name="text"
                                x={textItem.x}
                                y={textItem.y}
                                text={textItem.text}
                                fontSize={textItem.fontSize}
                                fontFamily={textItem.fontFamily}
                                fill={textItem.color}
                                scaleX={textItem.scaleX || 1}
                                scaleY={textItem.scaleY || 1}
                                rotation={textItem.rotation || 0}
                                draggable={tool === 'select' && selection.selectedId === textItem.id}
                                onDragEnd={onTransformEnd}
                                onClick={onTextClick}
                                onTap={onTextClick}
                                onTouchStart={onTextClick}
                                onDblClick={(e) => {
                                    console.log('Double click on text:', textItem.id);
                                    onTextDoubleClick(e);
                                }}
                                onDblTap={onTextDoubleClick}
                                onMouseDown={(e) => {
                                    // Prevent event bubbling to stage
                                    e.cancelBubble = true;
                                    if (e.evt) {
                                        e.evt.stopPropagation();
                                    }
                                }}
                                listening={true} // Always listen for text events
                                perfectDrawEnabled={false}
                                visible={editingText !== textItem.id} // Hide text being edited
                            />
                        );
                    })}

                    {/* Render Eraser Path */}
                    {tool === 'eraser' && eraserState.isErasing && eraserState.eraserPath.length > 2 && (
                        <Line
                            points={eraserState.eraserPath}
                            stroke="#ff0000"
                            strokeWidth={3}
                            lineCap="round"
                            lineJoin="round"
                            dash={[5, 5]}
                            opacity={0.7}
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                    )}

                    {/* Transformer for selection */}
                    {tool === 'select' && (
                        <Transformer
                            ref={transformerRef}
                            onTransformEnd={onTransformEnd}
                            onTransform={(e) => {
                                // Don't update during transform, only on transform end
                                // This prevents the jumping issue
                            }}
                            onDragEnd={onTransformEnd}
                            boundBoxFunc={(oldBox, newBox) => {
                                // Limit resize to prevent negative dimensions
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
                            borderEnabled={true}
                            anchorSize={24}
                            anchorStroke="#007bff"
                            anchorFill="#ffffff"
                            anchorStrokeWidth={3}
                            anchorCornerRadius={6}
                            borderStroke="#007bff"
                            borderStrokeWidth={2}
                            borderDash={[5, 5]}
                            keepRatio={false}
                            centeredScaling={false}
                            ignoreStroke={true}
                            useSingleNodeRotation={false}
                            shouldOverdrawWholeArea={false}
                            flipEnabled={false}
                            resizeEnabled={true}
                            rotateEnabled={true}
                            anchorDragBoundFunc={(oldPos, newPos) => {
                                // Allow free movement of anchors
                                return newPos;
                            }}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default Whiteboard; 