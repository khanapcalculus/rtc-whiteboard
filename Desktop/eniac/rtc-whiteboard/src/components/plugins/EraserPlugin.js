class EraserPlugin {
  constructor() {
    this.name = 'eraser';
    this.icon = '/icons/eraser.png';
    this.isActive = false;
    this.isErasing = false;
    this.erasedObjects = new Set(); // Track already erased objects to avoid duplicates
    this.eraserSize = 20; // Size of the eraser area
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.isErasing = false;
    this.erasedObjects.clear();
    return this;
  }

  // Required plugin interface methods (no-ops for eraser)
  setStrokeColor(color) {
    return this;
  }

  setFillColor(color) {
    return this;
  }

  setStrokeWidth(width) {
    return this;
  }

  // Check if point is inside an object (same logic as SelectPlugin but with larger tolerance)
  isPointInObject(point, object) {
    if (!object) return false;

    switch (object.type) {
      case 'image':
      case 'rectangle':
        return point.x >= object.x - this.eraserSize/2 && 
               point.x <= object.x + object.width + this.eraserSize/2 &&
               point.y >= object.y - this.eraserSize/2 && 
               point.y <= object.y + object.height + this.eraserSize/2;
      
      case 'circle':
        const dx = point.x - object.x;
        const dy = point.y - object.y;
        return Math.sqrt(dx * dx + dy * dy) <= object.radius + this.eraserSize/2;
      
      case 'line':
        // Handle line collision detection for pen drawings
        if (!object.points || object.points.length < 4) return false;
        const tolerance = this.eraserSize; // Use eraser size as tolerance
        for (let i = 0; i < object.points.length - 2; i += 2) {
          const x1 = object.points[i];
          const y1 = object.points[i + 1];
          const x2 = object.points[i + 2];
          const y2 = object.points[i + 3];
          
          const dist = this.distanceToLineSegment(point, {x: x1, y: y1}, {x: x2, y: y2});
          if (dist <= tolerance) return true;
        }
        return false;
      
      default:
        // For pen drawings that have tool: 'pen' or any object with points
        if ((object.tool === 'pen' || object.points) && object.points && object.points.length >= 4) {
          const tolerance = this.eraserSize;
          for (let i = 0; i < object.points.length - 2; i += 2) {
            const x1 = object.points[i];
            const y1 = object.points[i + 1];
            const x2 = object.points[i + 2];
            const y2 = object.points[i + 3];
            
            const dist = this.distanceToLineSegment(point, {x: x1, y: y1}, {x: x2, y: y2});
            if (dist <= tolerance) return true;
          }
        }
        return false;
    }
  }

  // Calculate distance from point to line segment
  distanceToLineSegment(point, lineStart, lineEnd) {
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
  }

  onMouseDown(stage, point, callback) {
    this.isErasing = true;
    this.erasedObjects.clear(); // Reset for new erasing session
    
    // Start erasing at the initial point
    this.eraseAtPoint(point, callback);
  }

  onMouseMove(stage, point, callback) {
    if (!this.isErasing) return;
    
    // Continue erasing while moving
    this.eraseAtPoint(point, callback);
  }

  onMouseUp(stage) {
    this.isErasing = false;
    this.erasedObjects.clear(); // Clear tracking set
  }

  // Helper method to erase objects at a specific point
  eraseAtPoint(point, callback) {
    // Find all objects at the current point
    const objectToDelete = callback({ action: 'findObject', point });
    
    if (objectToDelete && !this.erasedObjects.has(objectToDelete.id)) {
      // Mark as erased to avoid deleting the same object multiple times
      this.erasedObjects.add(objectToDelete.id);
      
      // Delete the found object
      callback({ action: 'delete', object: objectToDelete });
    }
  }
}

export default EraserPlugin; 