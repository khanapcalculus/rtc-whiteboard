import React, { useCallback, useState } from 'react';
import { Rect } from 'react-konva';

const EraserTool = ({ 
  isActive, 
  onLineRemove, 
  stagePos, 
  stageScale, 
  lines 
}) => {
  const [isErasing, setIsErasing] = useState(false);

  const getRelativePointerPosition = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    return {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale,
    };
  }, [stagePos, stageScale]);

  const checkLineIntersection = useCallback((point, line, eraserSize = 20) => {
    if (!line.points || line.points.length < 4) return false;
    
    // Check if any point on the line is within eraser radius
    for (let i = 0; i < line.points.length; i += 2) {
      const lineX = line.points[i];
      const lineY = line.points[i + 1];
      const distance = Math.sqrt(
        Math.pow(point.x - lineX, 2) + Math.pow(point.y - lineY, 2)
      );
      if (distance <= eraserSize) {
        return true;
      }
    }
    return false;
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!isActive) return;
    
    setIsErasing(true);
    const relativePos = getRelativePointerPosition(e);
    
    // Find and remove intersecting lines
    lines.forEach(line => {
      if (checkLineIntersection(relativePos, line)) {
        onLineRemove(line.id);
      }
    });
  }, [isActive, getRelativePointerPosition, lines, checkLineIntersection, onLineRemove]);

  const handlePointerMove = useCallback((e) => {
    if (!isErasing || !isActive) return;

    const relativePos = getRelativePointerPosition(e);
    
    // Continue erasing while moving
    lines.forEach(line => {
      if (checkLineIntersection(relativePos, line)) {
        onLineRemove(line.id);
      }
    });
  }, [isErasing, isActive, getRelativePointerPosition, lines, checkLineIntersection, onLineRemove]);

  const handlePointerUp = useCallback(() => {
    setIsErasing(false);
  }, []);

  return (
    <>
      {/* Event capture overlay - only when eraser is active */}
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
    </>
  );
};

export default EraserTool; 