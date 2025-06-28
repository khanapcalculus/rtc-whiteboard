import React, { useCallback, useState } from 'react';
import { Line, Rect } from 'react-konva';

const PenTool = ({ 
  isActive, 
  onLineAdd, 
  onLineUpdate, 
  stagePos, 
  stageScale, 
  lines 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLineId, setCurrentLineId] = useState(null);

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
    
    const newLine = {
      id: Date.now(),
      points: [relativePos.x, relativePos.y],
      stroke: '#000000',
      strokeWidth: 2,
      tool: 'pen'
    };
    
    setCurrentLineId(newLine.id);
    onLineAdd(newLine);
  }, [isActive, getRelativePointerPosition, onLineAdd]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !isActive || !currentLineId) return;

    const relativePos = getRelativePointerPosition(e);
    
    onLineUpdate(currentLineId, (line) => ({
      ...line,
      points: [...line.points, relativePos.x, relativePos.y]
    }));
  }, [isDrawing, isActive, currentLineId, getRelativePointerPosition, onLineUpdate]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setCurrentLineId(null);
  }, []);

  // Render all pen lines
  const renderLines = () => {
    return lines
      .filter(line => line.tool === 'pen')
      .map((line) => (
        <Line
          key={line.id}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
          perfectDrawEnabled={false}
          listening={false}
        />
      ));
  };

  return (
    <>
      {/* Event capture overlay - only when pen is active */}
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
      
      {/* Render all pen lines */}
      {renderLines()}
    </>
  );
};

export default PenTool; 