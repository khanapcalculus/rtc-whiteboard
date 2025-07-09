import { useCallback, useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { ClearTool } from '../tools/clear';
import { EraserTool, type EraserState } from '../tools/eraser';
import { HistoryManager, type WhiteboardState } from '../tools/history';
import { ImageTool, type ImageItem } from '../tools/image';
import { PanTool } from '../tools/pan';
import { PenTool } from '../tools/pen';
import { SelectionTool, type SelectionState } from '../tools/selection';
import { ShapeTool, type Shape, type ShapeType } from '../tools/shapes';
import { TextTool, type TextItem } from '../tools/text';

export interface Line {
    id: string;
    points: number[];
    tool: 'pen';
    color: string;
    strokeWidth: number;
}

export type Tool = 'pen' | 'pan' | 'image' | 'rectangle' | 'circle' | 'line' | 'ellipse' | 'select' | 'text' | 'eraser';

const doc = new Y.Doc();
const yLines = doc.getArray<string>('lines');
const yImages = doc.getArray<string>('images');
const yShapes = doc.getArray<string>('shapes');
const yTexts = doc.getArray<string>('texts');
const yViewState = doc.getMap<number>('viewState');
const provider = new WebsocketProvider('ws://192.168.31.158:3001', 'whiteboard', doc);

// Performance optimization: Throttle function with improved responsiveness for pen tool
const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    let lastFunc: ReturnType<typeof setTimeout>;
    let lastRan: number;
    
    return function(this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args);
            lastRan = Date.now();
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(this, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

// Viewport culling - only render lines that are visible
const isLineInViewport = (line: Line, stagePos: { x: number; y: number }, viewport: { width: number; height: number }) => {
    if (line.points.length < 2) return false;
    
    const minX = Math.min(...line.points.filter((_, i) => i % 2 === 0)) + stagePos.x;
    const maxX = Math.max(...line.points.filter((_, i) => i % 2 === 0)) + stagePos.x;
    const minY = Math.min(...line.points.filter((_, i) => i % 2 === 1)) + stagePos.y;
    const maxY = Math.max(...line.points.filter((_, i) => i % 2 === 1)) + stagePos.y;
    
    return !(maxX < 0 || minX > viewport.width || maxY < 0 || minY > viewport.height);
};

// Create history manager instance
const historyManager = new HistoryManager(50);

export const useWhiteboard = () => {
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState<string>('#000000');
    const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
    const [fontSize, setFontSize] = useState<number>(16);
    const [fontFamily, setFontFamily] = useState<string>('Arial');
    const [syncedLines, setSyncedLines] = useState<Line[]>([]);
    const [syncedImages, setSyncedImages] = useState<ImageItem[]>([]);
    const [syncedShapes, setSyncedShapes] = useState<Shape[]>([]);
    const [syncedTexts, setSyncedTexts] = useState<TextItem[]>([]);
    const [currentLine, setCurrentLine] = useState<Line | null>(null);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [selection, setSelection] = useState<SelectionState>(() => SelectionTool.getInitialState());
    const [eraserState, setEraserState] = useState<EraserState>(() => EraserTool.getInitialState());
    const [stagePos, setStagePos] = useState(() => PanTool.getInitialState());
    const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
    const isDrawing = useRef(false);
    const lastMouseMoveTime = useRef(0);
    const lastCreatedTextId = useRef<string | null>(null);
    const isUndoRedoOperation = useRef(false);
    
    // Store references to observer functions
    const observerRefs = useRef<{
        syncLines?: () => void;
        syncImages?: () => void;
        syncShapes?: () => void;
        syncTexts?: () => void;
        syncViewState?: () => void;
    }>({});

    // Update viewport on resize
    useEffect(() => {
        const handleResize = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Save state to history when significant changes occur
    const saveToHistory = useCallback(() => {
        // Don't save to history during undo/redo operations
        if (isUndoRedoOperation.current) {
            return;
        }
        
        const state: WhiteboardState = {
            lines: syncedLines,
            images: syncedImages,
            shapes: syncedShapes,
            texts: syncedTexts,
            timestamp: Date.now()
        };
        
        historyManager.saveState(state);
    }, [syncedLines, syncedImages, syncedShapes, syncedTexts]);

    useEffect(() => {
        const syncLines = () => {
            try {
                const lines: Line[] = yLines.toArray()
                    .map(lineStr => JSON.parse(lineStr))
                    .filter(line => line && line.id);
                
                setSyncedLines(lines);
            } catch (error) {
                console.error('Error syncing lines:', error);
            }
        };

        const syncImages = () => {
            try {
                const images: ImageItem[] = yImages.toArray()
                    .map(imageStr => JSON.parse(imageStr))
                    .filter(image => image && image.id);
                
                setSyncedImages(images);
            } catch (error) {
                console.error('Error syncing images:', error);
            }
        };

        const syncShapes = () => {
            try {
                const shapes: Shape[] = yShapes.toArray()
                    .map(shapeStr => JSON.parse(shapeStr))
                    .filter(shape => shape && shape.id);
                
                setSyncedShapes(shapes);
            } catch (error) {
                console.error('Error syncing shapes:', error);
            }
        };

        const syncTexts = () => {
            try {
                const texts: TextItem[] = yTexts.toArray()
                    .map(textStr => JSON.parse(textStr))
                    .filter(text => text && text.id);
                
                setSyncedTexts(texts);
            } catch (error) {
                console.error('Error syncing texts:', error);
            }
        };

        const syncViewState = () => {
            setStagePos({ x: yViewState.get('x') || 0, y: yViewState.get('y') || 0 });
        };

        // Store references to observer functions
        observerRefs.current = {
            syncLines,
            syncImages,
            syncShapes,
            syncTexts,
            syncViewState
        };

        yLines.observe(syncLines);
        yImages.observe(syncImages);
        yShapes.observe(syncShapes);
        yTexts.observe(syncTexts);
        yViewState.observe(syncViewState);
        
        syncLines();
        syncImages();
        syncShapes();
        syncTexts();
        syncViewState();

        // Save initial state to history after a brief delay to ensure all syncing is complete
        setTimeout(() => {
            if (!isUndoRedoOperation.current) {
                const initialState: WhiteboardState = {
                    lines: yLines.toArray().map(lineStr => JSON.parse(lineStr)).filter(line => line && line.id),
                    images: yImages.toArray().map(imageStr => JSON.parse(imageStr)).filter(image => image && image.id),
                    shapes: yShapes.toArray().map(shapeStr => JSON.parse(shapeStr)).filter(shape => shape && shape.id),
                    texts: yTexts.toArray().map(textStr => JSON.parse(textStr)).filter(text => text && text.id),
                    timestamp: Date.now()
                };
                historyManager.saveState(initialState);
            }
        }, 100);

        return () => {
            // Cleanup observers with error handling
            try {
                yLines.unobserve(syncLines);
            } catch (e) {
                console.warn('Could not unobserve syncLines during cleanup:', e);
            }
            
            try {
                yImages.unobserve(syncImages);
            } catch (e) {
                console.warn('Could not unobserve syncImages during cleanup:', e);
            }
            
            try {
                yShapes.unobserve(syncShapes);
            } catch (e) {
                console.warn('Could not unobserve syncShapes during cleanup:', e);
            }
            
            try {
                yTexts.unobserve(syncTexts);
            } catch (e) {
                console.warn('Could not unobserve syncTexts during cleanup:', e);
            }
            
            try {
                yViewState.unobserve(syncViewState);
            } catch (e) {
                console.warn('Could not unobserve syncViewState during cleanup:', e);
            }
            
            // Clear observer references
            observerRefs.current = {};
        };
    }, []);

    const handleMouseDown = useCallback((e: any) => {
        console.log('handleMouseDown called with tool:', tool, 'target:', e.target.getType(), 'target name:', e.target.name?.());
        
        if (tool === 'select') {
            console.log('Selection tool - before:', selection);
            SelectionTool.handleSelection(e.target, selection, (newSelection) => {
                console.log('Selection tool - after:', newSelection);
                setSelection(newSelection);
            });
            return;
        }

        if (tool === 'text') {
            const pos = e.target.getStage().getPointerPosition();
            if (pos) {
                const adjustedPos = {
                    x: pos.x - stagePos.x,
                    y: pos.y - stagePos.y
                };
                
                const newText = TextTool.createText(
                    adjustedPos.x,
                    adjustedPos.y,
                    '', // Start with empty text
                    color,
                    fontSize,
                    fontFamily
                );
                
                // Store the new text ID for later reference
                lastCreatedTextId.current = newText.id;
                yTexts.push([JSON.stringify(newText)]);
                saveToHistory();
            }
            return;
        }

        if (tool === 'eraser') {
            const newEraserState = EraserTool.handleMouseDown(e, stagePos);
            setEraserState(newEraserState);
            isDrawing.current = true;
            return;
        }

        if (isDrawing.current) return;
        
        isDrawing.current = true;

        if (tool === 'pen') {
            const newLine = PenTool.handleMouseDown(e, stagePos, color, strokeWidth);
            if (newLine) {
                setCurrentLine(newLine);
            }
        } else if (['rectangle', 'circle', 'line', 'ellipse'].includes(tool)) {
            const newShape = ShapeTool.startDrawing(tool as ShapeType, e, stagePos, color, strokeWidth);
            if (newShape) {
                setCurrentShape(newShape);
            }
        }
    }, [tool, stagePos, color, strokeWidth, fontSize, fontFamily, selection, saveToHistory]);

    // Throttled mouse move for better performance
    const handleMouseMove = useCallback(throttle((e: any) => {
        if (!isDrawing.current) return;
        
        const now = Date.now();
        if (now - lastMouseMoveTime.current < 4) { // Reduced from 8ms to 4ms for even smoother rapid drawing
            return;
        }
        lastMouseMoveTime.current = now;
        
        if (tool === 'pen' && currentLine) {
            const updatedLine = PenTool.handleMouseMove(e, currentLine, stagePos);
            setCurrentLine(updatedLine);
        } else if (['rectangle', 'circle', 'line', 'ellipse'].includes(tool) && currentShape) {
            const updatedShape = ShapeTool.updateDrawing(currentShape, e, stagePos);
            setCurrentShape(updatedShape);
        } else if (tool === 'eraser' && eraserState.isErasing) {
            const updatedEraserState = EraserTool.handleMouseMove(e, eraserState, stagePos);
            setEraserState(updatedEraserState);
        }
    }, 4), [tool, currentLine, currentShape, stagePos, eraserState]); // Reduced throttle from 8ms to 4ms

    const handleMouseUp = useCallback((e: any) => {
        if (!isDrawing.current) return;
        
        isDrawing.current = false;
        
        if (tool === 'pen' && currentLine) {
            if (PenTool.shouldSyncLine(currentLine)) {
                yLines.push([JSON.stringify(currentLine)]);
                saveToHistory();
            }
            setCurrentLine(null);
        } else if (['rectangle', 'circle', 'line', 'ellipse'].includes(tool) && currentShape) {
            if (ShapeTool.shouldSyncShape(currentShape)) {
                yShapes.push([JSON.stringify(currentShape)]);
                saveToHistory();
            }
            setCurrentShape(null);
        } else if (tool === 'eraser' && eraserState.isErasing) {
            const finalEraserState = EraserTool.handleMouseUp(eraserState);
            setEraserState(finalEraserState);
            
            // Check for collisions and delete intersecting objects
            const collisions = EraserTool.checkCollisions(eraserState.eraserPath, {
                lines: syncedLines,
                shapes: syncedShapes,
                images: syncedImages,
                texts: syncedTexts
            });
            
            // Delete intersecting objects
            let hasChanges = false;
            
            // Delete lines
            collisions.linesToDelete.forEach(lineId => {
                const lineIndex = syncedLines.findIndex(line => line.id === lineId);
                if (lineIndex !== -1) {
                    yLines.delete(lineIndex, 1);
                    hasChanges = true;
                }
            });
            
            // Delete shapes
            collisions.shapesToDelete.forEach(shapeId => {
                const shapeIndex = syncedShapes.findIndex(shape => shape.id === shapeId);
                if (shapeIndex !== -1) {
                    yShapes.delete(shapeIndex, 1);
                    hasChanges = true;
                }
            });
            
            // Delete images
            collisions.imagesToDelete.forEach(imageId => {
                const imageIndex = syncedImages.findIndex(image => image.id === imageId);
                if (imageIndex !== -1) {
                    yImages.delete(imageIndex, 1);
                    hasChanges = true;
                }
            });
            
            // Delete texts
            collisions.textsToDelete.forEach(textId => {
                const textIndex = syncedTexts.findIndex(text => text.id === textId);
                if (textIndex !== -1) {
                    yTexts.delete(textIndex, 1);
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                saveToHistory();
            }
            
            // Clear the eraser path
            setEraserState(EraserTool.getInitialState());
        }
    }, [tool, currentLine, currentShape, saveToHistory, eraserState, syncedLines, syncedImages, syncedShapes, syncedTexts]);

    const handleDragEnd = useCallback((e: any) => {
        if (tool === 'pan' && !isDrawing.current) {
            PanTool.handleDragEnd(e, (x, y) => {
                yViewState.set('x', x);
                yViewState.set('y', y);
            });
        }
    }, [tool]);

    const handleImageUpload = useCallback(() => {
        ImageTool.handleImageUpload(stagePos, (image: ImageItem) => {
            yImages.push([JSON.stringify(image)]);
            saveToHistory();
        });
    }, [stagePos, saveToHistory]);

    const handleImageUpdate = useCallback((id: string, updates: Partial<ImageItem>) => {
        const imageIndex = syncedImages.findIndex(img => img.id === id);
        if (imageIndex !== -1) {
            const updatedImage = { ...syncedImages[imageIndex], ...updates };
            yImages.delete(imageIndex, 1);
            yImages.insert(imageIndex, [JSON.stringify(updatedImage)]);
            saveToHistory();
        }
    }, [syncedImages, saveToHistory]);

    const handleShapeUpdate = useCallback((id: string, updates: Partial<Shape>) => {
        const shapeIndex = syncedShapes.findIndex(shape => shape.id === id);
        if (shapeIndex !== -1) {
            const updatedShape = { ...syncedShapes[shapeIndex], ...updates };
            yShapes.delete(shapeIndex, 1);
            yShapes.insert(shapeIndex, [JSON.stringify(updatedShape)]);
            saveToHistory();
        }
    }, [syncedShapes, saveToHistory]);

    const handleTextUpdate = useCallback((id: string, updates: Partial<TextItem>) => {
        const textIndex = syncedTexts.findIndex(text => text.id === id);
        if (textIndex !== -1) {
            const updatedText = { ...syncedTexts[textIndex], ...updates };
            yTexts.delete(textIndex, 1);
            yTexts.insert(textIndex, [JSON.stringify(updatedText)]);
            saveToHistory();
        }
    }, [syncedTexts, saveToHistory]);

    const handleTransform = useCallback((target: any) => {
        if (selection.selectedType === 'image') {
            SelectionTool.handleTransform(target, 'image', handleImageUpdate);
        } else if (selection.selectedType === 'shape') {
            SelectionTool.handleTransform(target, 'shape', handleShapeUpdate);
        } else if (selection.selectedType === 'text') {
            SelectionTool.handleTransform(target, 'text', handleTextUpdate);
        }
    }, [selection, handleImageUpdate, handleShapeUpdate, handleTextUpdate]);

    const handleTextDoubleClick = useCallback((textId: string) => {
        TextTool.handleDoubleClick(
            { id: () => textId },
            syncedTexts,
            (updatedTexts) => {
                // Update Y.js
                yTexts.delete(0, yTexts.length);
                updatedTexts.forEach(text => {
                    yTexts.push([JSON.stringify(text)]);
                });
            }
        );
    }, [syncedTexts]);

    const handleTextEdit = useCallback((textId: string, newText: string) => {
        if (textId === 'new') {
            // Handle new text creation
            const lastTextId = lastCreatedTextId.current;
            if (lastTextId && newText.trim()) {
                // Update the last created text with the actual text
                const textIndex = syncedTexts.findIndex(text => text.id === lastTextId);
                if (textIndex !== -1) {
                    const updatedText = { ...syncedTexts[textIndex], text: newText, isEditing: false };
                    yTexts.delete(textIndex, 1);
                    yTexts.insert(textIndex, [JSON.stringify(updatedText)]);
                    saveToHistory();
                }
            } else if (lastTextId && !newText.trim()) {
                // Remove empty text
                const textIndex = syncedTexts.findIndex(text => text.id === lastTextId);
                if (textIndex !== -1) {
                    yTexts.delete(textIndex, 1);
                }
            }
            lastCreatedTextId.current = null;
        } else {
            // Handle existing text editing
            TextTool.finishEditing(
                textId,
                newText,
                syncedTexts,
                (updatedTexts) => {
                    // Update Y.js
                    yTexts.delete(0, yTexts.length);
                    updatedTexts.forEach(text => {
                        yTexts.push([JSON.stringify(text)]);
                    });
                    saveToHistory();
                }
            );
        }
    }, [syncedTexts, saveToHistory]);

    const undo = useCallback(() => {
        isUndoRedoOperation.current = true;
        const previousState = historyManager.undo();
        
        if (previousState) {
            // Temporarily unobserve all Y.js arrays to prevent triggering saveToHistory
            const { syncLines, syncImages, syncShapes, syncTexts } = observerRefs.current;
            
            // Safely unobserve only if the handlers exist
            try {
                if (syncLines) yLines.unobserve(syncLines);
            } catch (e) {
                console.warn('Could not unobserve syncLines:', e);
            }
            
            try {
                if (syncImages) yImages.unobserve(syncImages);
            } catch (e) {
                console.warn('Could not unobserve syncImages:', e);
            }
            
            try {
                if (syncShapes) yShapes.unobserve(syncShapes);
            } catch (e) {
                console.warn('Could not unobserve syncShapes:', e);
            }
            
            try {
                if (syncTexts) yTexts.unobserve(syncTexts);
            } catch (e) {
                console.warn('Could not unobserve syncTexts:', e);
            }
            
            // Update Y.js with previous state
            yLines.delete(0, yLines.length);
            yImages.delete(0, yImages.length);
            yShapes.delete(0, yShapes.length);
            yTexts.delete(0, yTexts.length);
            
            previousState.lines.forEach(line => yLines.push([JSON.stringify(line)]));
            previousState.images.forEach(image => yImages.push([JSON.stringify(image)]));
            previousState.shapes.forEach(shape => yShapes.push([JSON.stringify(shape)]));
            previousState.texts.forEach(text => yTexts.push([JSON.stringify(text)]));
            
            // Manually update React state without triggering observers
            setSyncedLines(previousState.lines);
            setSyncedImages(previousState.images);
            setSyncedShapes(previousState.shapes);
            setSyncedTexts(previousState.texts);
            
            // Re-observe Y.js arrays safely
            try {
                if (syncLines) yLines.observe(syncLines);
            } catch (e) {
                console.warn('Could not re-observe syncLines:', e);
            }
            
            try {
                if (syncImages) yImages.observe(syncImages);
            } catch (e) {
                console.warn('Could not re-observe syncImages:', e);
            }
            
            try {
                if (syncShapes) yShapes.observe(syncShapes);
            } catch (e) {
                console.warn('Could not re-observe syncShapes:', e);
            }
            
            try {
                if (syncTexts) yTexts.observe(syncTexts);
            } catch (e) {
                console.warn('Could not re-observe syncTexts:', e);
            }
        }
        isUndoRedoOperation.current = false;
    }, [syncedLines, syncedImages, syncedShapes, syncedTexts]);

    const redo = useCallback(() => {
        isUndoRedoOperation.current = true;
        const nextState = historyManager.redo();
        if (nextState) {
            // Temporarily unobserve all Y.js arrays to prevent triggering saveToHistory
            const { syncLines, syncImages, syncShapes, syncTexts } = observerRefs.current;
            
            // Safely unobserve only if the handlers exist
            try {
                if (syncLines) yLines.unobserve(syncLines);
            } catch (e) {
                console.warn('Could not unobserve syncLines:', e);
            }
            
            try {
                if (syncImages) yImages.unobserve(syncImages);
            } catch (e) {
                console.warn('Could not unobserve syncImages:', e);
            }
            
            try {
                if (syncShapes) yShapes.unobserve(syncShapes);
            } catch (e) {
                console.warn('Could not unobserve syncShapes:', e);
            }
            
            try {
                if (syncTexts) yTexts.unobserve(syncTexts);
            } catch (e) {
                console.warn('Could not unobserve syncTexts:', e);
            }
            
            // Update Y.js with next state
            yLines.delete(0, yLines.length);
            yImages.delete(0, yImages.length);
            yShapes.delete(0, yShapes.length);
            yTexts.delete(0, yTexts.length);
            
            nextState.lines.forEach(line => yLines.push([JSON.stringify(line)]));
            nextState.images.forEach(image => yImages.push([JSON.stringify(image)]));
            nextState.shapes.forEach(shape => yShapes.push([JSON.stringify(shape)]));
            nextState.texts.forEach(text => yTexts.push([JSON.stringify(text)]));
            
            // Manually update React state without triggering observers
            setSyncedLines(nextState.lines);
            setSyncedImages(nextState.images);
            setSyncedShapes(nextState.shapes);
            setSyncedTexts(nextState.texts);
            
            // Re-observe Y.js arrays safely
            try {
                if (syncLines) yLines.observe(syncLines);
            } catch (e) {
                console.warn('Could not re-observe syncLines:', e);
            }
            
            try {
                if (syncImages) yImages.observe(syncImages);
            } catch (e) {
                console.warn('Could not re-observe syncImages:', e);
            }
            
            try {
                if (syncShapes) yShapes.observe(syncShapes);
            } catch (e) {
                console.warn('Could not re-observe syncShapes:', e);
            }
            
            try {
                if (syncTexts) yTexts.observe(syncTexts);
            } catch (e) {
                console.warn('Could not re-observe syncTexts:', e);
            }
        }
        isUndoRedoOperation.current = false;
    }, []);

    const clearCanvas = useCallback(() => {
        ClearTool.clearCanvas(yLines, setSyncedLines, setCurrentLine);
        // Also clear images, shapes, and texts
        yImages.delete(0, yImages.length);
        yShapes.delete(0, yShapes.length);
        yTexts.delete(0, yTexts.length);
        setSyncedImages([]);
        setSyncedShapes([]);
        setSyncedTexts([]);
        setCurrentShape(null);
        setSelection(SelectionTool.getInitialState());
        historyManager.clear();
    }, []);

    // Combine synced lines with current drawing line
    const allLines = currentLine ? [...syncedLines, currentLine] : syncedLines;
    
    // Performance optimization: Only render visible lines
    const visibleLines = allLines.filter(line => 
        isLineInViewport(line, stagePos, viewport)
    );
    
    // Remove any potential duplicates based on ID
    const uniqueLines = visibleLines.filter((line, index, arr) => 
        arr.findIndex(l => l.id === line.id) === index
    );

    // Combine synced shapes with current drawing shape
    const allShapes = currentShape ? [...syncedShapes, currentShape] : syncedShapes;

    return { 
        lines: uniqueLines,
        images: syncedImages,
        shapes: allShapes,
        texts: syncedTexts,
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
        canUndo: historyManager.canUndo(),
        canRedo: historyManager.canRedo(),
        clearCanvas,
        lastCreatedTextId
    };
};
