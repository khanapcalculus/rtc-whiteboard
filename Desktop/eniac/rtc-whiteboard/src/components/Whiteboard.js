import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Image as KonvaImage, Layer, Line, Rect, Stage } from 'react-konva';
import socketService from '../services/socketService';
import '../styles/Whiteboard.css';

const Whiteboard = ({ activePlugin, ipAddress, selectedObject, setSelectedObject, onSaveSession, onClearSession }) => {
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [imageCache, setImageCache] = useState(new Map());
  const [eraserCursor, setEraserCursor] = useState({ visible: false, x: 0, y: 0 });
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Throttle real-time updates for better performance
  const lastEmitTime = useRef(0);
  const THROTTLE_DELAY = 16; // ~60fps throttling

  const throttledEmit = useCallback((event, data) => {
    const now = Date.now();
    
    // Always allow creation and finish events, only throttle updates
    if (event.includes('created') || event.includes('finished') || now - lastEmitTime.current >= THROTTLE_DELAY) {
      socketService.emit(event, data);
      lastEmitTime.current = now;
    }
  }, []);

  // Optimize socket event handlers with useCallback
  const handleLineCreated = useCallback((line) => {
    setLines(prevLines => [...prevLines, line]);
  }, []);

  const handleLineUpdated = useCallback((updatedLine) => {
    setLines(prevLines => 
      prevLines.map(line => line.id === updatedLine.id ? updatedLine : line)
    );
  }, []);

  const handleLineFinished = useCallback((finishedLine) => {
    setLines(prevLines => 
      prevLines.map(line => line.id === finishedLine.id ? finishedLine : line)
    );
  }, []);

  const handleShapeCreated = useCallback((shape) => {
    // Remove console.log for performance
    setShapes(prevShapes => [...prevShapes, shape]);
  }, []);

  const handleShapeUpdated = useCallback((updatedShape) => {
    // Remove console.log for performance
    setShapes(prevShapes => 
      prevShapes.map(shape => shape.id === updatedShape.id ? updatedShape : shape)
    );
  }, []);

  const handleShapeFinished = useCallback((finishedShape) => {
    // Remove console.log for performance
    setShapes(prevShapes => 
      prevShapes.map(shape => shape.id === finishedShape.id ? finishedShape : shape)
    );
  }, []);

  // Handle session loading - load existing drawings when connecting
  const handleSessionLoaded = useCallback((sessionData) => {
    setLines(sessionData.lines || []);
    setShapes(sessionData.shapes || []);
  }, []);

  // Handle session cleared
  const handleSessionCleared = useCallback(() => {
    setLines([]);
    setShapes([]);
    setSelectedObject(null);
  }, [setSelectedObject]);

  // Handle object deleted
  const handleObjectDeleted = useCallback((deletedObject) => {
    if (!deletedObject) return;

    // Check if it's a pen drawing (has tool: 'pen' or type: 'line')
    if (deletedObject.tool === 'pen' || deletedObject.type === 'line') {
      // Remove from lines array
      setLines(prevLines => 
        prevLines.filter(line => line.id !== deletedObject.id)
      );
    } else {
      // Remove from shapes array
      setShapes(prevShapes => 
        prevShapes.filter(shape => shape.id !== deletedObject.id)
      );
    }

    // Clear selection if deleted object was selected
    if (selectedObject && selectedObject.id === deletedObject.id) {
      setSelectedObject(null);
    }
  }, [selectedObject, setSelectedObject]);

  // Manual save/clear functions
  const saveSession = useCallback((sessionId = 'default') => {
    socketService.emit('save-session', sessionId);
  }, []);

  const clearSession = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all drawings? This cannot be undone.')) {
      socketService.emit('clear-session');
    }
  }, []);

  // Expose functions to parent component
  useEffect(() => {
    if (onSaveSession) onSaveSession.current = saveSession;
    if (onClearSession) onClearSession.current = clearSession;
  }, [saveSession, clearSession, onSaveSession, onClearSession]);

  useEffect(() => {
    // Connect to socket server
    socketService.connect(ipAddress);

    // Listen for drawing events from other users
    socketService.on('line-created', handleLineCreated);
    socketService.on('line-updated', handleLineUpdated);
    socketService.on('line-finished', handleLineFinished);
    socketService.on('shape-created', handleShapeCreated);
    socketService.on('shape-updated', handleShapeUpdated);
    socketService.on('shape-finished', handleShapeFinished);
    socketService.on('object-deleted', handleObjectDeleted);

    // Listen for session events
    socketService.on('session-loaded', handleSessionLoaded);
    socketService.on('session-cleared', handleSessionCleared);

    // Listen for save responses
    socketService.on('save-response', (response) => {
      // You could add a toast notification here if needed
    });

    // Session data loading
    socketService.on('session-data', (sessionDrawings) => {
      console.log('📦 Loading session data:', sessionDrawings);
      
      // Load lines (pen drawings)
      if (sessionDrawings.lines && Array.isArray(sessionDrawings.lines)) {
        console.log('📝 Loading', sessionDrawings.lines.length, 'lines');
        setLines(sessionDrawings.lines);
      }
      
      // Load shapes (rectangles, circles, etc.)
      if (sessionDrawings.shapes && Array.isArray(sessionDrawings.shapes)) {
        console.log('🔷 Loading', sessionDrawings.shapes.length, 'shapes');
        setShapes(sessionDrawings.shapes);
      }
    });

    return () => {
      socketService.off('line-created', handleLineCreated);
      socketService.off('line-updated', handleLineUpdated);
      socketService.off('line-finished', handleLineFinished);
      socketService.off('shape-created', handleShapeCreated);
      socketService.off('shape-updated', handleShapeUpdated);
      socketService.off('shape-finished', handleShapeFinished);
      socketService.off('object-deleted', handleObjectDeleted);
      socketService.off('session-loaded', handleSessionLoaded);
      socketService.off('session-cleared', handleSessionCleared);
      socketService.off('save-response');
      socketService.off('session-data');
    };
  }, [ipAddress, handleLineCreated, handleLineUpdated, handleLineFinished, 
      handleShapeCreated, handleShapeUpdated, handleShapeFinished,
      handleSessionLoaded, handleSessionCleared, handleObjectDeleted]);

  // Add this useEffect hook INSIDE the component
  // Add dependencies to the useEffect to avoid lint warnings
  useEffect(() => {
    // Add pointer event listeners for better stylus support
    const container = containerRef.current;
    
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [stagePos, scale, activePlugin, isPanning, startPos]); // Add isPanning and startPos as dependencies

  const handlePointerDown = (e) => {
    // Implement palm rejection - only respond to pen or mouse, ignore touch if pen is available
    if (e.pointerType === 'pen') {
      // Don't prevent default for upload plugin - it needs native behavior for file input
      if (!activePlugin || activePlugin.name !== 'upload') {
        e.preventDefault();
      }
      
      if (!stageRef.current) return;
      
      const rect = stageRef.current.container().getBoundingClientRect();
      const point = {
        x: (e.clientX - rect.left - stagePos.x) / scale,
        y: (e.clientY - rect.top - stagePos.y) / scale
      };
      
      // Handle pan plugin for pen input
      if (activePlugin && activePlugin.name === 'pan') {
        setIsPanning(true);
        setStartPos({
          x: e.clientX,
          y: e.clientY
        });
        return;
      }
      
      if (activePlugin && activePlugin.isActive) {
        if (activePlugin.name === 'pen') {
          activePlugin.onMouseDown(stageRef.current, point, (newLine) => {
            setLines(prevLines => [...prevLines, newLine]);
            throttledEmit('line-created', newLine);
          });
        } else if (activePlugin.name === 'upload') {
          // Handle image upload for pen
          activePlugin.onMouseDown(stageRef.current, point, (newImage) => {
            setShapes(prevShapes => [...prevShapes, newImage]);
            throttledEmit('shape-created', newImage);
          });
        } else if (activePlugin.name === 'select') {
          // Handle selection for pen
          activePlugin.onMouseDown(stageRef.current, point, (action) => {
            if (action.action === 'findObject') {
              return findObjectAtPoint(action.point);
            } else if (action.action === 'getCurrentSelected') {
              return selectedObject;
            } else if (action.action === 'select') {
              setSelectedObject(action.object);
            } else if (action.action === 'deselect') {
              setSelectedObject(null);
            } else if (action.action === 'update') {
              // Update object during drag/resize
              updateObject(action.object);
            } else if (action.action === 'finishUpdate') {
              // Finish update and emit to server
              updateObject(action.object);
              throttledEmit('shape-updated', action.object);
            }
          });
        } else if (activePlugin.name === 'eraser') {
          // Handle eraser
          activePlugin.onMouseDown(stageRef.current, point, (action) => {
            if (action.action === 'findObject') {
              return findObjectAtPoint(action.point);
            } else if (action.action === 'delete') {
              deleteObject(action.object);
            }
          });
        } else {
          // Handle other shape plugins
          activePlugin.onMouseDown(stageRef.current, point, (newShape) => {
            setShapes(prevShapes => [...prevShapes, newShape]);
            throttledEmit('shape-created', newShape);
          });
        }
      }
    } else if (e.pointerType === 'mouse') {
      // Handle mouse input normally
      // Mouse handling is already done by handleMouseDown
    } else if (e.pointerType === 'touch') {
      // Don't prevent default for upload plugin - it needs native behavior for file input
      if (!activePlugin || activePlugin.name !== 'upload') {
        e.preventDefault();
      }
      
      if (!stageRef.current) return;
      
      const rect = stageRef.current.container().getBoundingClientRect();
      const point = {
        x: (e.clientX - rect.left - stagePos.x) / scale,
        y: (e.clientY - rect.top - stagePos.y) / scale
      };
      
      // Handle pan plugin for touch input
      if (activePlugin && activePlugin.name === 'pan') {
        setIsPanning(true);
        setStartPos({
          x: e.clientX,
          y: e.clientY
        });
        return;
      }
      
      // Handle drawing for touch input (tablets)
      if (activePlugin && activePlugin.isActive) {
        if (activePlugin.name === 'pen') {
          activePlugin.onMouseDown(stageRef.current, point, (newLine) => {
            setLines(prevLines => [...prevLines, newLine]);
            throttledEmit('line-created', newLine);
          });
        } else if (activePlugin.name === 'upload') {
          // Handle image upload for touch pointer
          activePlugin.onMouseDown(stageRef.current, point, (newImage) => {
            setShapes(prevShapes => [...prevShapes, newImage]);
            throttledEmit('shape-created', newImage);
          });
        } else if (activePlugin.name === 'select') {
          // Handle selection for touch pointer
          activePlugin.onMouseDown(stageRef.current, point, (action) => {
            if (action.action === 'findObject') {
              return findObjectAtPoint(action.point);
            } else if (action.action === 'getCurrentSelected') {
              return selectedObject;
            } else if (action.action === 'select') {
              setSelectedObject(action.object);
            } else if (action.action === 'deselect') {
              setSelectedObject(null);
            } else if (action.action === 'update') {
              // Update object during drag/resize
              updateObject(action.object);
            } else if (action.action === 'finishUpdate') {
              // Finish update and emit to server
              updateObject(action.object);
              throttledEmit('shape-updated', action.object);
            }
          });
        } else if (activePlugin.name === 'eraser') {
          // Handle eraser
          activePlugin.onMouseDown(stageRef.current, point, (action) => {
            if (action.action === 'findObject') {
              return findObjectAtPoint(action.point);
            } else if (action.action === 'delete') {
              deleteObject(action.object);
            }
          });
        } else {
          // Handle other shape plugins for touch pointer
          activePlugin.onMouseDown(stageRef.current, point, (newShape) => {
            setShapes(prevShapes => [...prevShapes, newShape]);
            throttledEmit('shape-created', newShape);
          });
        }
      }
    }
  };

  const handlePointerMove = (e) => {
    // Handle panning for pen and touch when pan is active
    if (isPanning && startPos) {
      e.preventDefault();
      
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      
      setStagePos({
        x: stagePos.x + dx,
        y: stagePos.y + dy
      });
      
      setStartPos({
        x: e.clientX,
        y: e.clientY
      });
      
      return;
    }
    
    // Handle drawing for pen and touch
    if ((e.pointerType === 'pen' || e.pointerType === 'touch') && activePlugin && activePlugin.isActive) {
      // Don't prevent default for upload plugin - it needs native behavior for file input
      if (activePlugin.name !== 'upload') {
        e.preventDefault();
      }
      
      if (!stageRef.current) return;
      
      const rect = stageRef.current.container().getBoundingClientRect();
      const point = {
        x: (e.clientX - rect.left - stagePos.x) / scale,
        y: (e.clientY - rect.top - stagePos.y) / scale
      };
      
      // Update eraser cursor position
      if (activePlugin.name === 'eraser') {
        setEraserCursor({ visible: true, x: point.x, y: point.y });
      } else {
        setEraserCursor(prev => ({ ...prev, visible: false }));
      }
      
      if (activePlugin.name === 'pen') {
        activePlugin.onMouseMove(stageRef.current, point, (updatedLine) => {
          setLines(prevLines => 
            prevLines.map(line => line.id === updatedLine.id ? updatedLine : line)
          );
          throttledEmit('line-updated', updatedLine);
        });
      } else if (activePlugin.name === 'select') {
        // Handle selection move (drag/resize) for pointer
        activePlugin.onMouseMove(stageRef.current, point, (action) => {
          if (action.action === 'getCurrentSelected') {
            return selectedObject;
          } else if (action.action === 'update') {
            updateObject(action.object);
            // Emit real-time updates during drag/resize for pointer
            throttledEmit('shape-updated', action.object);
          }
        });
      } else if (activePlugin.name === 'eraser') {
        // Handle eraser move (continuous erasing) for pointer
        activePlugin.onMouseMove(stageRef.current, point, (action) => {
          if (action.action === 'findObject') {
            return findObjectAtPoint(action.point);
          } else if (action.action === 'delete') {
            deleteObject(action.object);
          }
        });
      } else {
        // Handle other shape plugins for pen input
        activePlugin.onMouseMove(stageRef.current, point, (updatedShape) => {
          setShapes(prevShapes => 
            prevShapes.map(shape => shape.id === updatedShape.id ? updatedShape : shape)
          );
          throttledEmit('shape-updated', updatedShape);
        });
      }
    }
  };

  const handlePointerUp = (e) => {
    // Handle end of panning
    if (isPanning) {
      e.preventDefault();
      setIsPanning(false);
      setStartPos(null);
      return;
    }
    
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
      // Don't prevent default for upload plugin - it needs native behavior for file input
      if (!activePlugin || activePlugin.name !== 'upload') {
        e.preventDefault();
      }
      
      if (!activePlugin || !activePlugin.isActive) return;
      
      if (activePlugin.name === 'pen') {
        activePlugin.onMouseUp(stageRef.current, (finishedLine) => {
          throttledEmit('line-finished', finishedLine);
        });
      } else if (activePlugin.name === 'select') {
        // Handle selection end for pointer
        activePlugin.onMouseUp(stageRef.current, (action) => {
          if (action.action === 'getCurrentSelected') {
            return selectedObject;
          } else if (action.action === 'finishUpdate') {
            updateObject(action.object);
            throttledEmit('shape-updated', action.object);
          }
        });
      } else if (activePlugin.name === 'eraser') {
        // Handle eraser end for pointer
        activePlugin.onMouseUp(stageRef.current);
      } else if (activePlugin.name !== 'upload') {
        // Handle other shape plugins for pen/touch input (not upload)
        activePlugin.onMouseUp(stageRef.current, (finishedShape) => {
          throttledEmit('shape-finished', finishedShape);
        });
      }
    }
  };

  const getRelativePointerPosition = (e) => {
    if (!stageRef.current) return { x: 0, y: 0 };
    
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    
    if (!pointerPosition) return { x: 0, y: 0 };
    
    return {
      x: (pointerPosition.x - stagePos.x) / scale,
      y: (pointerPosition.y - stagePos.y) / scale
    };
  };

  // Handle mouse down for plugins
  const handleMouseDown = (e) => {
    if (!activePlugin) return;
    
    // If pan plugin is active, handle panning
    if (activePlugin.name === 'pan') {
      setIsPanning(true);
      setStartPos(stageRef.current.getPointerPosition());
      return;
    }
    
    // Right mouse button or middle mouse button for panning (keep this for mouse users)
    if (e.evt.button === 2 || e.evt.button === 1) {
      setIsPanning(true);
      setStartPos(stageRef.current.getPointerPosition());
      return;
    }
    
    // Left mouse button for drawing (only if not using pan plugin)
    const point = getRelativePointerPosition(e);
    
    if (activePlugin.name === 'pen') {
      activePlugin.onMouseDown(stageRef.current, point, (newLine) => {
        setLines(prevLines => [...prevLines, newLine]);
        throttledEmit('line-created', newLine);
      });
    } else if (activePlugin.name === 'upload') {
      // Handle image upload
      activePlugin.onMouseDown(stageRef.current, point, (newImage) => {
        setShapes(prevShapes => [...prevShapes, newImage]);
        throttledEmit('shape-created', newImage);
      });
    } else if (activePlugin.name === 'select') {
      // Handle selection
      activePlugin.onMouseDown(stageRef.current, point, (action) => {
        if (action.action === 'findObject') {
          return findObjectAtPoint(action.point);
        } else if (action.action === 'getCurrentSelected') {
          return selectedObject;
        } else if (action.action === 'select') {
          setSelectedObject(action.object);
        } else if (action.action === 'deselect') {
          setSelectedObject(null);
        } else if (action.action === 'update') {
          // Update object during drag/resize
          updateObject(action.object);
        } else if (action.action === 'finishUpdate') {
          // Finish update and emit to server
          updateObject(action.object);
          throttledEmit('shape-updated', action.object);
        }
      });
    } else if (activePlugin.name === 'eraser') {
      // Handle eraser
      activePlugin.onMouseDown(stageRef.current, point, (action) => {
        if (action.action === 'findObject') {
          return findObjectAtPoint(action.point);
        } else if (action.action === 'delete') {
          deleteObject(action.object);
        }
      });
    } else {
      // Handle other shape plugins
      activePlugin.onMouseDown(stageRef.current, point, (newShape) => {
        setShapes(prevShapes => [...prevShapes, newShape]);
        throttledEmit('shape-created', newShape);
      });
    }
  };

  // Provide upload plugin with direct access to add shapes
  useEffect(() => {
    if (activePlugin && activePlugin.name === 'upload') {
      // Give upload plugin direct access to add shapes
      activePlugin.setAddShapeCallback((newShape) => {
        setShapes(prevShapes => [...prevShapes, newShape]);
        throttledEmit('shape-created', newShape);
      });
    }
  }, [activePlugin, throttledEmit]);

  // Update object in shapes array
  const updateObject = useCallback((updatedObject) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => 
        shape.id === updatedObject.id ? updatedObject : shape
      )
    );
    setSelectedObject(updatedObject);
  }, [setSelectedObject]);

  // Delete object from shapes or lines array
  const deleteObject = useCallback((objectToDelete) => {
    if (!objectToDelete) return;

    // Check if it's a pen drawing (has tool: 'pen' or type: 'line')
    if (objectToDelete.tool === 'pen' || objectToDelete.type === 'line') {
      // Remove from lines array
      setLines(prevLines => 
        prevLines.filter(line => line.id !== objectToDelete.id)
      );
    } else {
      // Remove from shapes array (rectangles, circles, images)
      setShapes(prevShapes => 
        prevShapes.filter(shape => shape.id !== objectToDelete.id)
      );
    }

    // Clear selection if deleted object was selected
    if (selectedObject && selectedObject.id === objectToDelete.id) {
      setSelectedObject(null);
    }

    // Emit deletion event for real-time collaboration
    throttledEmit('object-deleted', objectToDelete);
  }, [selectedObject, setSelectedObject, throttledEmit]);

  const handleMouseMove = (e) => {
    if (isPanning && startPos) {
      const newPos = stageRef.current.getPointerPosition();
      setStagePos({
        x: stagePos.x + (newPos.x - startPos.x),
        y: stagePos.y + (newPos.y - startPos.y)
      });
      setStartPos(newPos);
      return;
    }
    
    if (!activePlugin || !activePlugin.isActive) return;
    
    const point = getRelativePointerPosition(e);
    
    // Update eraser cursor position
    if (activePlugin.name === 'eraser') {
      setEraserCursor({ visible: true, x: point.x, y: point.y });
    } else {
      setEraserCursor(prev => ({ ...prev, visible: false }));
    }
    
    if (activePlugin.name === 'pen') {
      activePlugin.onMouseMove(stageRef.current, point, (updatedLine) => {
        setLines(prevLines => 
          prevLines.map(line => line.id === updatedLine.id ? updatedLine : line)
        );
        throttledEmit('line-updated', updatedLine);
      });
    } else if (activePlugin.name === 'select') {
      // Handle selection move (drag/resize)
      activePlugin.onMouseMove(stageRef.current, point, (action) => {
        if (action.action === 'getCurrentSelected') {
          return selectedObject;
        } else if (action.action === 'update') {
          updateObject(action.object);
          // Emit real-time updates during drag/resize
          throttledEmit('shape-updated', action.object);
        }
      });
    } else if (activePlugin.name === 'eraser') {
      // Handle eraser move (continuous erasing)
      activePlugin.onMouseMove(stageRef.current, point, (action) => {
        if (action.action === 'findObject') {
          return findObjectAtPoint(action.point);
        } else if (action.action === 'delete') {
          deleteObject(action.object);
        }
      });
    } else {
      // Handle other shape plugins
      activePlugin.onMouseMove(stageRef.current, point, (updatedShape) => {
        setShapes(prevShapes => 
          prevShapes.map(shape => shape.id === updatedShape.id ? updatedShape : shape)
        );
        throttledEmit('shape-updated', updatedShape);
      });
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      setStartPos(null);
      return;
    }
    
    if (!activePlugin || !activePlugin.isActive) return;
    
    if (activePlugin.name === 'pen') {
      activePlugin.onMouseUp(stageRef.current, (finishedLine) => {
        throttledEmit('line-finished', finishedLine);
      });
    } else if (activePlugin.name === 'select') {
      // Handle selection end
      const point = getRelativePointerPosition(e);
      activePlugin.onMouseUp(stageRef.current, (action) => {
        if (action.action === 'getCurrentSelected') {
          return selectedObject;
        } else if (action.action === 'finishUpdate') {
          updateObject(action.object);
          throttledEmit('shape-updated', action.object);
        }
      });
    } else if (activePlugin.name === 'eraser') {
      // Handle eraser end
      activePlugin.onMouseUp(stageRef.current);
    } else if (activePlugin.name !== 'upload') {
      // Handle other shape plugins (not upload)
      activePlugin.onMouseUp(stageRef.current, (finishedShape) => {
        throttledEmit('shape-finished', finishedShape);
      });
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = scale;
    
    const pointerPos = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointerPos.x - stagePos.x) / oldScale,
      y: (pointerPos.y - stagePos.y) / oldScale,
    };
    
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setScale(newScale);
    setStagePos({
      x: pointerPos.x - mousePointTo.x * newScale,
      y: pointerPos.y - mousePointTo.y * newScale,
    });
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    // Don't prevent default for upload plugin - it needs native touch behavior for file input
    if (activePlugin && activePlugin.name !== 'upload') {
      // Prevent default to avoid scrolling (except for upload)
      e.evt.preventDefault();
    }
    
    // If pan plugin is active, handle all touch events as panning
    if (activePlugin && activePlugin.name === 'pan') {
      setIsPanning(true);
      setStartPos({
        x: e.evt.touches[0].clientX,
        y: e.evt.touches[0].clientY
      });
      return;
    }
    
    // Check if we have two or more touches (for panning)
    if (e.evt.touches.length >= 2) {
      // Set panning mode immediately with two fingers
      setIsPanning(true);
      setStartPos({
        x: e.evt.touches[0].clientX,
        y: e.evt.touches[0].clientY
      });
      return;
    }
    
    // Only proceed if we're not panning and have a single touch
    if (!isPanning && e.evt.touches.length === 1 && activePlugin) {
      const point = getRelativePointerPosition(e);
      
      if (activePlugin.name === 'pen') {
        activePlugin.onMouseDown(stageRef.current, point, (newLine) => {
          setLines(prevLines => [...prevLines, newLine]);
          throttledEmit('line-created', newLine);
        });
      } else if (activePlugin.name === 'upload') {
        // Handle image upload for touch
        activePlugin.onMouseDown(stageRef.current, point, (newImage) => {
          setShapes(prevShapes => [...prevShapes, newImage]);
          throttledEmit('shape-created', newImage);
        });
      } else if (activePlugin.name === 'select') {
        // Handle selection for touch
        activePlugin.onMouseDown(stageRef.current, point, (action) => {
          if (action.action === 'findObject') {
            return findObjectAtPoint(action.point);
          } else if (action.action === 'getCurrentSelected') {
            return selectedObject;
          } else if (action.action === 'select') {
            setSelectedObject(action.object);
          } else if (action.action === 'deselect') {
            setSelectedObject(null);
          } else if (action.action === 'update') {
            // Update object during drag/resize
            updateObject(action.object);
          } else if (action.action === 'finishUpdate') {
            // Finish update and emit to server
            updateObject(action.object);
            throttledEmit('shape-updated', action.object);
          }
        });
      } else if (activePlugin.name === 'eraser') {
        // Handle eraser
        activePlugin.onMouseDown(stageRef.current, point, (action) => {
          if (action.action === 'findObject') {
            return findObjectAtPoint(action.point);
          } else if (action.action === 'delete') {
            deleteObject(action.object);
          }
        });
      } else if (activePlugin.name !== 'save' && activePlugin.name !== 'clear') {
        // Handle other shape plugins for touch input (excluding save/clear)
        activePlugin.onMouseDown(stageRef.current, point, (newShape) => {
          setShapes(prevShapes => [...prevShapes, newShape]);
          throttledEmit('shape-created', newShape);
        });
      }
    }
  };

  const handleTouchMove = (e) => {
    // Don't prevent default for upload plugin - it needs native touch behavior for file input
    if (activePlugin && activePlugin.name !== 'upload') {
      // Prevent default to avoid scrolling (except for upload)
      e.evt.preventDefault();
    }
    
    // If we're panning (either with pan tool or two fingers)
    if (isPanning) {
      const newPos = {
        x: e.evt.touches[0].clientX,
        y: e.evt.touches[0].clientY
      };
      
      // Calculate the delta movement
      const dx = newPos.x - startPos.x;
      const dy = newPos.y - startPos.y;
      
      // Update stage position with a controlled movement
      setStagePos({
        x: stagePos.x + dx,
        y: stagePos.y + dy
      });
      
      // Update start position for next move
      setStartPos(newPos);
      return;
    }
    
    // If a second finger is added during drawing, cancel drawing and switch to panning
    if (e.evt.touches.length >= 2) {
      // If we weren't already panning, cancel any ongoing operation
      if (!isPanning && activePlugin && activePlugin.isActive) {
        if (activePlugin.name === 'pen') {
          activePlugin.onMouseUp(stageRef.current, (finishedLine) => {
            throttledEmit('line-finished', finishedLine);
          });
        } else if (activePlugin.name === 'select') {
          // Finish any selection operation
          activePlugin.onMouseUp(stageRef.current, (action) => {
            if (action.action === 'getCurrentSelected') {
              return selectedObject;
            } else if (action.action === 'finishUpdate') {
              updateObject(action.object);
              throttledEmit('shape-updated', action.object);
            }
          });
        } else if (activePlugin.name === 'eraser') {
          // Finish any eraser operation
          activePlugin.onMouseUp(stageRef.current);
        } else if (activePlugin.name !== 'save' && activePlugin.name !== 'clear' && activePlugin.name !== 'upload') {
          activePlugin.onMouseUp(stageRef.current, (finishedShape) => {
            throttledEmit('shape-finished', finishedShape);
          });
        }
      }
      
      // Switch to panning mode
      setIsPanning(true);
      setStartPos({
        x: e.evt.touches[0].clientX,
        y: e.evt.touches[0].clientY
      });
      return;
    }
    
    // Only handle movement if we're not panning and have a single touch
    if (!isPanning && e.evt.touches.length === 1 && activePlugin && activePlugin.isActive) {
      const point = getRelativePointerPosition(e);
      
      // Update eraser cursor position for touch
      if (activePlugin.name === 'eraser') {
        setEraserCursor({ visible: true, x: point.x, y: point.y });
      } else {
        setEraserCursor(prev => ({ ...prev, visible: false }));
      }
      
      if (activePlugin.name === 'pen') {
        activePlugin.onMouseMove(stageRef.current, point, (updatedLine) => {
          setLines(prevLines => 
            prevLines.map(line => line.id === updatedLine.id ? updatedLine : line)
          );
          throttledEmit('line-updated', updatedLine);
        });
      } else if (activePlugin.name === 'select') {
        // Handle selection move (drag/resize) for touch
        activePlugin.onMouseMove(stageRef.current, point, (action) => {
          if (action.action === 'getCurrentSelected') {
            return selectedObject;
          } else if (action.action === 'update') {
            updateObject(action.object);
            // Emit real-time updates during drag/resize for touch
            throttledEmit('shape-updated', action.object);
          }
        });
      } else if (activePlugin.name === 'eraser') {
        // Handle eraser move (continuous erasing) for touch
        activePlugin.onMouseMove(stageRef.current, point, (action) => {
          if (action.action === 'findObject') {
            return findObjectAtPoint(action.point);
          } else if (action.action === 'delete') {
            deleteObject(action.object);
          }
        });
      } else if (activePlugin.name !== 'save' && activePlugin.name !== 'clear' && activePlugin.name !== 'upload') {
        // Handle other shape plugins for touch input (excluding save/clear/upload)
        activePlugin.onMouseMove(stageRef.current, point, (updatedShape) => {
          setShapes(prevShapes => 
            prevShapes.map(shape => shape.id === updatedShape.id ? updatedShape : shape)
          );
          throttledEmit('shape-updated', updatedShape);
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    // If we were panning and now have fewer than 2 touches, stop panning
    if (isPanning && (!e.evt.touches || e.evt.touches.length < 2)) {
      setIsPanning(false);
      setStartPos(null);
      return;
    }
    
    // Hide eraser cursor when touch ends
    setEraserCursor(prev => ({ ...prev, visible: false }));
    
    // Only finish operations if we're not panning and have no touches left
    if (!isPanning && (!e.evt.touches || e.evt.touches.length === 0) && activePlugin && activePlugin.isActive) {
      if (activePlugin.name === 'pen') {
        activePlugin.onMouseUp(stageRef.current, (finishedLine) => {
          throttledEmit('line-finished', finishedLine);
        });
      } else if (activePlugin.name === 'select') {
        // Handle selection end for touch
        activePlugin.onMouseUp(stageRef.current, (action) => {
          if (action.action === 'getCurrentSelected') {
            return selectedObject;
          } else if (action.action === 'finishUpdate') {
            updateObject(action.object);
            throttledEmit('shape-updated', action.object);
          }
        });
      } else if (activePlugin.name === 'eraser') {
        // Handle eraser end for touch
        activePlugin.onMouseUp(stageRef.current);
      } else if (activePlugin.name !== 'save' && activePlugin.name !== 'clear' && activePlugin.name !== 'upload') {
        // Handle other shape plugins for touch input (excluding save/clear/upload)
        activePlugin.onMouseUp(stageRef.current, (finishedShape) => {
          throttledEmit('shape-finished', finishedShape);
        });
      }
    }
  };

  // Load image and cache it
  const loadImage = useCallback((src) => {
    if (imageCache.has(src)) {
      return imageCache.get(src);
    }

    const imageObj = new window.Image();
    imageObj.crossOrigin = 'Anonymous';
    imageObj.src = src;
    
    imageCache.set(src, imageObj);
    setImageCache(new Map(imageCache));
    
    return imageObj;
  }, [imageCache]);

  // Find object at point
  const findObjectAtPoint = useCallback((point) => {
    // Check shapes first (they're on top)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (isPointInObject(point, shape)) {
        return shape;
      }
    }

    // Check lines (pen drawings)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (isPointInObject(point, line)) {
        return line;
      }
    }

    return null;
  }, [shapes, lines, activePlugin?.name]);

  // Check if point is inside an object
  const isPointInObject = (point, object) => {
    if (!object) return false;

    // Use larger tolerance for eraser tool
    const tolerance = activePlugin?.name === 'eraser' ? 20 : 15;

    switch (object.type) {
      case 'image':
      case 'rectangle':
        if (activePlugin?.name === 'eraser') {
          // Larger detection area for eraser
          return point.x >= object.x - tolerance/2 && 
                 point.x <= object.x + object.width + tolerance/2 &&
                 point.y >= object.y - tolerance/2 && 
                 point.y <= object.y + object.height + tolerance/2;
        }
        return point.x >= object.x && 
               point.x <= object.x + object.width &&
               point.y >= object.y && 
               point.y <= object.y + object.height;
      
      case 'circle':
        const dx = point.x - object.x;
        const dy = point.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (activePlugin?.name === 'eraser') {
          return distance <= object.radius + tolerance/2;
        }
        return distance <= object.radius;
      
      case 'line':
        // Handle line collision detection for pen drawings
        if (!object.points || object.points.length < 4) return false;
        for (let i = 0; i < object.points.length - 2; i += 2) {
          const x1 = object.points[i];
          const y1 = object.points[i + 1];
          const x2 = object.points[i + 2];
          const y2 = object.points[i + 3];
          
          const dist = distanceToLineSegment(point, {x: x1, y: y1}, {x: x2, y: y2});
          if (dist <= tolerance) {
            return true;
          }
        }
        return false;
      
      default:
        // For pen drawings that have tool: 'pen' or any object with points
        if ((object.tool === 'pen' || object.points) && object.points && object.points.length >= 4) {
          for (let i = 0; i < object.points.length - 2; i += 2) {
            const x1 = object.points[i];
            const y1 = object.points[i + 1];
            const x2 = object.points[i + 2];
            const y2 = object.points[i + 3];
            
            const dist = distanceToLineSegment(point, {x: x1, y: y1}, {x: x2, y: y2});
            if (dist <= tolerance) {
              return true;
            }
          }
        }
        return false;
    }
  };

  // Helper function for line distance calculation
  const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div 
      ref={containerRef} 
      className="whiteboard-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        position={stagePos}
        scale={{ x: scale, y: scale }}
        draggable={false}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={line.id || i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
              perfectDrawEnabled={false}
              shadowForStrokeEnabled={false}
            />
          ))}
          
          {shapes.map((shape, i) => {
            if (shape.type === 'rectangle') {
              return (
                <Rect
                  key={shape.id || i}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                />
              );
            } else if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id || i}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                />
              );
            } else if (shape.type === 'line') {
              return (
                <Line
                  key={shape.id || i}
                  points={shape.points}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={false}
                />
              );
            } else if (shape.type === 'image') {
              const imageObj = loadImage(shape.src);
              return (
                <KonvaImage
                  key={shape.id || i}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  image={imageObj}
                  draggable={false}
                />
              );
            }
            return null;
          })}

          {/* Selection handles for selected object */}
          {selectedObject && activePlugin?.name === 'select' && (
            <>
              {/* Selection outline */}
              {(selectedObject.type === 'image' || selectedObject.type === 'rectangle') && (
                <Rect
                  x={selectedObject.x - 2}
                  y={selectedObject.y - 2}
                  width={selectedObject.width + 4}
                  height={selectedObject.height + 4}
                  stroke="#4a90e2"
                  strokeWidth={2}
                  fill="transparent"
                  dash={[5, 5]}
                />
              )}
              
              {selectedObject.type === 'circle' && (
                <Circle
                  x={selectedObject.x}
                  y={selectedObject.y}
                  radius={selectedObject.radius + 2}
                  stroke="#4a90e2"
                  strokeWidth={2}
                  fill="transparent"
                  dash={[5, 5]}
                />
              )}

              {/* Resize handles for rectangles and images */}
              {(selectedObject.type === 'image' || selectedObject.type === 'rectangle') && (
                <>
                  {/* Corner handles - larger for better touch support */}
                  <Rect x={selectedObject.x - 8} y={selectedObject.y - 8} width={16} height={16} fill="#4a90e2" stroke="#ffffff" strokeWidth={2} />
                  <Rect x={selectedObject.x + selectedObject.width - 8} y={selectedObject.y - 8} width={16} height={16} fill="#4a90e2" stroke="#ffffff" strokeWidth={2} />
                  <Rect x={selectedObject.x - 8} y={selectedObject.y + selectedObject.height - 8} width={16} height={16} fill="#4a90e2" stroke="#ffffff" strokeWidth={2} />
                  <Rect x={selectedObject.x + selectedObject.width - 8} y={selectedObject.y + selectedObject.height - 8} width={16} height={16} fill="#4a90e2" stroke="#ffffff" strokeWidth={2} />
                </>
              )}
            </>
          )}

          {/* Eraser cursor */}
          {eraserCursor.visible && activePlugin?.name === 'eraser' && (
            <Circle
              x={eraserCursor.x}
              y={eraserCursor.y}
              radius={10} // Half of eraserSize from plugin
              stroke="#ff6b6b"
              strokeWidth={2}
              fill="rgba(255, 107, 107, 0.1)"
              dash={[3, 3]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default React.memo(Whiteboard);