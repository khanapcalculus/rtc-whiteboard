import React, { useCallback, useState } from 'react';
import { Rect } from 'react-konva';

const RectangleTool = ({ 
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
      type: 'rectangle',
      x: relativePos.x,
      y: relativePos.y,
      width: 0,
      height: 0,
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'transparent',
      tool: 'rectangle'
    };
    
    setCurrentShapeId(newShape.id);
    onShapeAdd(newShape);
  }, [isActive, getRelativePointerPosition, onShapeAdd]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !isActive || !currentShapeId || !startPos) return;

    const relativePos = getRelativePointerPosition(e);
    
    const width = relativePos.x - startPos.x;
    const height = relativePos.y - startPos.y;
    
    onShapeUpdate(currentShapeId, (shape) => ({
      ...shape,
      width: width,
      height: height
    }));
  }, [isDrawing, isActive, currentShapeId, startPos, getRelativePointerPosition, onShapeUpdate]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setCurrentShapeId(null);
    setStartPos(null);
  }, []);

  // Render all rectangle shapes
  const renderShapes = () => {
    return shapes
      .filter(shape => shape.tool === 'rectangle')
      .map((shape) => (
        <Rect
          key={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill}
          listening={false}
        />
      ));
  };

  return (
    <>
      {/* Event capture overlay - only when rectangle tool is active */}
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
      
      {/* Render all rectangle shapes */}
      {renderShapes()}
    </>
  );
};

export default RectangleTool; 