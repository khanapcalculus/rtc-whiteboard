import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import './App.css';
import RoomManager from './components/RoomManager';
import Toolbar from './components/Toolbar';
import socketService from './services/socketService';
import CircleTool from './tools/CircleTool';
import EraserTool from './tools/EraserTool';
import PenTool from './tools/PenTool';
import RectangleTool from './tools/RectangleTool';

function App() {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const stageRef = useRef();
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  // Initialize Socket.IO connection
  useEffect(() => {
    socketService.connect();

    // Set up event listeners
    socketService.onRoomState((data) => {
      console.log('📥 Room state received:', data);
      setLines(data.lines || []);
      setShapes(data.shapes || []);
      setConnectedUsers(data.users || []);
    });

    socketService.onUserJoined((data) => {
      console.log('👋 User joined:', data);
      setConnectedUsers(prev => [...prev, { id: data.userId, color: data.userColor }]);
    });

    socketService.onUserLeft((data) => {
      console.log('👋 User left:', data);
      setConnectedUsers(prev => prev.filter(user => user.socketId !== data.userId));
    });

    socketService.onLineAdd((line) => {
      console.log('📝 Remote line added:', line);
      setLines(prev => [...prev, line]);
    });

    socketService.onLineUpdate((lineData) => {
      console.log('📝 Remote line updated:', lineData);
      setLines(prevLines => {
        const newLines = [...prevLines];
        const lineIndex = newLines.findIndex(line => line.id === lineData.id);
        if (lineIndex >= 0) {
          newLines[lineIndex] = { ...newLines[lineIndex], ...lineData };
        }
        return newLines;
      });
    });

    socketService.onLineRemove((lineId) => {
      console.log('🗑️ Remote line removed:', lineId);
      setLines(prev => prev.filter(line => line.id !== lineId));
    });

    socketService.onShapeAdd((shape) => {
      console.log('📐 Remote shape added:', shape);
      setShapes(prev => [...prev, shape]);
    });

    socketService.onShapeUpdate((shapeData) => {
      console.log('📐 Remote shape updated:', shapeData);
      setShapes(prevShapes => {
        const newShapes = [...prevShapes];
        const shapeIndex = newShapes.findIndex(shape => shape.id === shapeData.id);
        if (shapeIndex >= 0) {
          newShapes[shapeIndex] = { ...newShapes[shapeIndex], ...shapeData };
        }
        return newShapes;
      });
    });

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  // Line management for drawing tools
  const handleLineAdd = useCallback((newLine) => {
    setLines(prevLines => [...prevLines, newLine]);
    // Emit to other users
    socketService.emitLineAdd(newLine);
  }, []);

  const handleLineUpdate = useCallback((lineId, updateFn) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
      const lineIndex = newLines.findIndex(line => line.id === lineId);
      if (lineIndex >= 0) {
        const updatedLine = updateFn(newLines[lineIndex]);
        newLines[lineIndex] = updatedLine;
        // Emit to other users
        socketService.emitLineUpdate(updatedLine);
      }
      return newLines;
    });
  }, []);

  const handleLineRemove = useCallback((lineId) => {
    setLines(prevLines => prevLines.filter(line => line.id !== lineId));
    // Emit to other users
    socketService.emitLineRemove(lineId);
  }, []);

  // Shape management for shape tools
  const handleShapeAdd = useCallback((newShape) => {
    setShapes(prevShapes => [...prevShapes, newShape]);
    // Emit to other users
    socketService.emitShapeAdd(newShape);
  }, []);

  const handleShapeUpdate = useCallback((shapeId, updateFn) => {
    setShapes(prevShapes => {
      const newShapes = [...prevShapes];
      const shapeIndex = newShapes.findIndex(shape => shape.id === shapeId);
      if (shapeIndex >= 0) {
        const updatedShape = updateFn(newShapes[shapeIndex]);
        newShapes[shapeIndex] = updatedShape;
        // Emit to other users
        socketService.emitShapeUpdate(updatedShape);
      }
      return newShapes;
    });
  }, []);

  // Room management
  const handleRoomJoined = useCallback((roomId) => {
    setCurrentRoom(roomId);
    if (!roomId) {
      // Reset state when leaving room
      setLines([]);
      setShapes([]);
      setConnectedUsers([]);
    }
  }, []);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  // Pinch-to-zoom for tablets (when not drawing)
  const handleTouchMove = useCallback((e) => {
    if (!['pen', 'eraser', 'rectangle', 'circle'].includes(tool) && e.evt.touches?.length === 2) {
      e.evt.preventDefault();
      
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];
      
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (!stageRef.current.lastDist) {
        stageRef.current.lastDist = dist;
        return;
      }
      
      const scale = stageScale * (dist / stageRef.current.lastDist);
      setStageScale(Math.max(0.1, Math.min(5, scale)));
      stageRef.current.lastDist = dist;
    }
  }, [stageScale, tool]);

  const handleTouchEnd = useCallback(() => {
    if (stageRef.current) {
      stageRef.current.lastDist = 0;
    }
  }, []);

  return (
    <div className="app">
      <Toolbar activeTool={tool} onToolChange={setTool} />
      
      <RoomManager 
        onRoomJoined={handleRoomJoined}
        currentRoom={currentRoom}
        connectedUsers={connectedUsers}
      />
      
      <div className="canvas-container">
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={tool === 'pan'}
        >
          <Layer>
            {/* Drawing Tools */}
            <PenTool
              isActive={tool === 'pen'}
              onLineAdd={handleLineAdd}
              onLineUpdate={handleLineUpdate}
              stagePos={stagePos}
              stageScale={stageScale}
              lines={lines}
            />
            
            <EraserTool
              isActive={tool === 'eraser'}
              onLineRemove={handleLineRemove}
              stagePos={stagePos}
              stageScale={stageScale}
              lines={lines}
            />
            
            {/* Shape Tools */}
            <RectangleTool
              isActive={tool === 'rectangle'}
              onShapeAdd={handleShapeAdd}
              onShapeUpdate={handleShapeUpdate}
              stagePos={stagePos}
              stageScale={stageScale}
              shapes={shapes}
            />
            
            <CircleTool
              isActive={tool === 'circle'}
              onShapeAdd={handleShapeAdd}
              onShapeUpdate={handleShapeUpdate}
              stagePos={stagePos}
              stageScale={stageScale}
              shapes={shapes}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default App; 