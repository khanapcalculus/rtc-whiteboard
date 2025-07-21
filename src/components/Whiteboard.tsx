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
        lastCreatedTextId,
        currentLine,
        currentShape
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
                    // For selection tool, be very permissive to allow all interactions
                    // Only prevent default on touchstart and only if it's not on a Konva element
                    const isKonvaElement = target.closest('canvas') || target.tagName === 'CANVAS';
                    if (e.type === 'touchstart' && !isKonvaElement) {
                        e.preventDefault();
                    }
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
        // Don't override touch action for selection tool as it can interfere with toolbar buttons
        // The toolbar buttons have their own touch handling that should work independently
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
            // Immediate handling for touch events
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

    const onImageDragEnd = (e: any) => {
        if (tool === 'select') {
            handleTransform(e.target);
        }
    };

    const onShapeDragEnd = (e: any) => {
        if (tool === 'select') {
            handleTransform(e.target);
        }
    };

    const onTextDragEnd = (e: any) => {
        if (tool === 'select') {
            handleTransform(e.target);
        }
    };

    const onShapeClick = (e: any) => {
        console.log('onShapeClick called with tool:', tool, 'target:', e.target.id(), 'name:', e.target.name(), 'event type:', e.evt?.type);
        if (tool === 'select') {
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            // For touch events, ensure proper selection with immediate handling
            if (e.evt && e.evt.type && e.evt.type.includes('touch')) {
                console.log('Handling touch shape click');
                // Immediate handling for better touch responsiveness
                handleMouseDown(e);
            } else {
                console.log('Handling mouse shape click');
                handleMouseDown(e);
            }
        }
    };

    const onImageClick = (e: any) => {
        console.log('onImageClick called with tool:', tool, 'target:', e.target.id(), 'name:', e.target.name(), 'event type:', e.evt?.type);
        if (tool === 'select') {
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            // For touch events, ensure proper selection with immediate handling
            if (e.evt && e.evt.type && e.evt.type.includes('touch')) {
                console.log('Handling touch image click');
                // Immediate handling for better touch responsiveness
                handleMouseDown(e);
            } else {
                console.log('Handling mouse image click');
                handleMouseDown(e);
            }
        }
    };

    const onTextClick = (e: any) => {
        console.log('onTextClick called with tool:', tool, 'target:', e.target.id(), 'name:', e.target.name(), 'event type:', e.evt?.type);
        if (tool === 'select') {
            e.cancelBubble = true;
            if (e.evt) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
            }
            // For touch events, ensure proper selection with immediate handling
            if (e.evt && e.evt.type && e.evt.type.includes('touch')) {
                console.log('Handling touch text click');
                // Immediate handling for better touch responsiveness
                handleMouseDown(e);
            } else {
                console.log('Handling mouse text click');
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
            // Always clear the editing state
            setEditingText(null);
            setTextInput('');
            setTextInputPosition({ x: 0, y: 0 });
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
            // Always clear the editing state
            setEditingText(null);
            setTextInput('');
            setTextInputPosition({ x: 0, y: 0 });
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
        <div ref={containerRef} className="whiteboard-container" style={{ width: '100%', height: '100%', touchAction: tool === 'select' ? 'manipulation' : 'none' }}>
            <Toolbar
                activeTool={tool}
                onToolChange={setTool}
                selectedColor={color}
                onColorChange={setColor}
                selectedStroke={strokeWidth}
                onStrokeChange={setStrokeWidth}
                selectedFont={fontFamily}
                onFontChange={setFontFamily}
                selectedFontSize={fontSize}
                onFontSizeChange={setFontSize}
                onImageUpload={handleImageUpload}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onClear={clearCanvas}
            />
            
            {/* Logo in top right corner */}
            <img 
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Logo" 
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    height: '25px',
                    width: 'auto',
                    zIndex: 1001,
                    pointerEvents: 'none'
                }}
            />
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={onStageMouseDown}
                onTouchStart={onStageMouseDown}
                onMouseMove={onStageMouseMove}
                onTouchMove={onStageMouseMove}
                onMouseUp={onStageMouseUp}
                onTouchEnd={onStageMouseUp}
                draggable={tool === 'pan'}
                onDragEnd={onStageDragEnd}
                onDragStart={onStageDragStart}
                onDragMove={onStageDragMove}
                x={stagePos.x}
                y={stagePos.y}
            >
                <Layer>
                    {/* Draw current shape if any */}
                    {currentShape && (
                        currentShape.type === 'rectangle' ? (
                            <Rect
                                x={currentShape.x}
                                y={currentShape.y}
                                width={currentShape.width || 0}
                                height={currentShape.height || 0}
                                stroke={currentShape.color}
                                strokeWidth={currentShape.strokeWidth}
                                fill="transparent"
                            />
                        ) : currentShape.type === 'circle' ? (
                            <Circle
                                x={currentShape.x}
                                y={currentShape.y}
                                radius={currentShape.radius || 0}
                                stroke={currentShape.color}
                                strokeWidth={currentShape.strokeWidth}
                                fill="transparent"
                            />
                        ) : currentShape.type === 'ellipse' ? (
                            <Ellipse
                                x={currentShape.x}
                                y={currentShape.y}
                                radiusX={currentShape.radiusX || 0}
                                radiusY={currentShape.radiusY || 0}
                                stroke={currentShape.color}
                                strokeWidth={currentShape.strokeWidth}
                                fill="transparent"
                            />
                        ) : currentShape.type === 'line' ? (
                            <Line
                                points={currentShape.points || []}
                                stroke={currentShape.color}
                                strokeWidth={currentShape.strokeWidth}
                                lineCap="round"
                                lineJoin="round"
                            />
                        ) : null
                    )}

                    {/* Draw all completed shapes */}
                    {shapes.map(shape => (
                        shape.type === 'rectangle' ? (
                            <Rect
                                key={shape.id}
                                id={shape.id}
                                x={shape.x}
                                y={shape.y}
                                width={shape.width || 0}
                                height={shape.height || 0}
                                stroke={shape.color}
                                strokeWidth={shape.strokeWidth}
                                fill="transparent"
                                onClick={onShapeClick}
                                onTouchStart={onShapeClick}
                                name="shape"
                                scaleX={shape.scaleX}
                                scaleY={shape.scaleY}
                                rotation={shape.rotation}
                                draggable={tool === 'select'}
                                onDragEnd={onShapeDragEnd}
                            />
                        ) : shape.type === 'circle' ? (
                            <Circle
                                key={shape.id}
                                id={shape.id}
                                x={shape.x}
                                y={shape.y}
                                radius={shape.radius || 0}
                                stroke={shape.color}
                                strokeWidth={shape.strokeWidth}
                                fill="transparent"
                                onClick={onShapeClick}
                                onTouchStart={onShapeClick}
                                name="shape"
                                scaleX={shape.scaleX}
                                scaleY={shape.scaleY}
                                rotation={shape.rotation}
                                draggable={tool === 'select'}
                                onDragEnd={onShapeDragEnd}
                            />
                        ) : shape.type === 'ellipse' ? (
                            <Ellipse
                                key={shape.id}
                                id={shape.id}
                                x={shape.x}
                                y={shape.y}
                                radiusX={shape.radiusX || 0}
                                radiusY={shape.radiusY || 0}
                                stroke={shape.color}
                                strokeWidth={shape.strokeWidth}
                                fill="transparent"
                                onClick={onShapeClick}
                                onTouchStart={onShapeClick}
                                name="shape"
                                scaleX={shape.scaleX}
                                scaleY={shape.scaleY}
                                rotation={shape.rotation}
                                draggable={tool === 'select'}
                                onDragEnd={onShapeDragEnd}
                            />
                        ) : shape.type === 'line' ? (
                            <Line
                                key={shape.id}
                                id={shape.id}
                                points={shape.points || []}
                                stroke={shape.color}
                                strokeWidth={shape.strokeWidth}
                                lineCap="round"
                                lineJoin="round"
                                onClick={onShapeClick}
                                onTouchStart={onShapeClick}
                                name="shape"
                                scaleX={shape.scaleX}
                                scaleY={shape.scaleY}
                                rotation={shape.rotation}
                                draggable={tool === 'select'}
                                onDragEnd={onShapeDragEnd}
                            />
                        ) : null
                    ))}

                    {/* Draw all images */}
                    {images.map(image => {
                        const imageElement = imageElements.get(image.id);
                        return imageElement ? (
                            <KonvaImage
                                key={image.id}
                                id={image.id}
                                image={imageElement}
                                x={image.x}
                                y={image.y}
                                width={image.width}
                                height={image.height}
                                scaleX={image.scaleX}
                                scaleY={image.scaleY}
                                rotation={image.rotation}
                                onClick={onImageClick}
                                onTouchStart={onImageClick}
                                name="image"
                                draggable={tool === 'select'}
                                onDragEnd={onImageDragEnd}
                            />
                        ) : null;
                    })}

                    {/* Draw all text elements */}
                    {texts.map(text => (
                        <Text
                            key={text.id}
                            id={text.id}
                            x={text.x}
                            y={text.y}
                            text={text.text}
                            fontSize={text.fontSize}
                            fontFamily={text.fontFamily}
                            fill={text.color}
                            scaleX={text.scaleX}
                            scaleY={text.scaleY}
                            rotation={text.rotation}
                            onClick={onTextClick}
                            onTouchStart={onTextClick}
                            onDblClick={onTextDoubleClick}
                            onDblTap={onTextDoubleClick}
                            name="text"
                            draggable={tool === 'select'}
                            onDragEnd={onTextDragEnd}
                        />
                    ))}

                    {/* Draw current line if any */}
                    {currentLine && (
                        <Line
                            points={currentLine.points}
                            stroke={currentLine.color}
                            strokeWidth={currentLine.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation="source-over"
                        />
                    )}

                    {/* Draw all completed lines */}
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation="source-over"
                        />
                    ))}

                    {/* Transformer for selection tool */}
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            // Limit resize to a minimum size
                            const minSize = 5;
                            if (Math.abs(newBox.width) < minSize || Math.abs(newBox.height) < minSize) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                        anchorSize={24}
                        anchorCornerRadius={8}
                        padding={8}
                        ignoreStroke={true}
                        keepRatio={false}
                        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                        rotateEnabled={true}
                        rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                        rotationSnapTolerance={5}
                    />
                </Layer>
            </Stage>

            {/* Text input for editing */}
            {editingText && (
                <input
                    ref={textInputRef}
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleTextInputKeyDown}
                    onBlur={handleTextInputBlur}
                    style={{
                        position: 'absolute',
                        left: textInputPosition.x + 'px',
                        top: textInputPosition.y + 'px',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: color,
                        fontSize: fontSize + 'px',
                        fontFamily: fontFamily,
                        minWidth: '100px',
                        textAlign: 'center'
                    }}
                />
            )}
        </div>
    );
};

export default Whiteboard; 