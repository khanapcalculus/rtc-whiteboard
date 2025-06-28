import React, { useCallback, useState } from 'react';
import { Circle, Rect } from 'react-konva';

const CircleTool = ({ 
  isActive, 
  onShapeAdd, 
  onShapeUpdate, 
  stagePos, 
  stageScale, 
  shapes 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShapeId, setCurrentShapeId] = useState(null);
  const [startPos, setStartPos] = useState(null);

  const getRelativePointerPosition = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    return {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale,
    };
  }, [stagePos, stageScale]);

  const handlePointerDown = useCallback((e) => {
    if (!isActive) return;
    
    setIsDrawing(true);
    const relativePos = getRelativePointerPosition(e);
    setStartPos(relativePos);
    
    const newShape = {
      id: Date.now(),
      type: 'circle',
      x: relativePos.x,
      y: relativePos.y,
      radius: 0,
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'transparent',
      tool: 'circle'
    };
    
    setCurrentShapeId(newShape.id);
    onShapeAdd(newShape);
  }, [isActive, getRelativePointerPosition, onShapeAdd]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !isActive || !currentShapeId || !startPos) return;

    const relativePos = getRelativePointerPosition(e);
    
    const radius = Math.sqrt(
      Math.pow(relativePos.x - startPos.x, 2) + 
      Math.pow(relativePos.y - startPos.y, 2)
    );
    
    onShapeUpdate(currentShapeId, (shape) => ({
      ...shape,
      radius: radius
    }));
  }, [isDrawing, isActive, currentShapeId, startPos, getRelativePointerPosition, onShapeUpdate]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setCurrentShapeId(null);
    setStartPos(null);
  }, []);

  // Render all circle shapes
  const renderShapes = () => {
    return shapes
      .filter(shape => shape.tool === 'circle')
      .map((shape) => (
        <Circle
          key={shape.id}
          x={shape.x}
          y={shape.y}
          radius={shape.radius}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill}
          listening={false}
        />
      ));
  };

  return (
    <>
      {/* Event capture overlay - only when circle tool is active */}
      {isActive && (
        <Rect
          x={-50000}
          y={-50000}
          width={100000}
          height={100000}
          fill="transparent"
          listening={true}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      )}
      
      {/* Render all circle shapes */}
      {renderShapes()}
    </>
  );
};

export default CircleTool; 