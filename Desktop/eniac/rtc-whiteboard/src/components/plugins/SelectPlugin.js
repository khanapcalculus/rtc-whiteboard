class SelectPlugin {
  constructor() {
    this.name = 'select';
    this.icon = '/icons/pointer.png';
    this.isActive = false;
    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = null;
    this.resizeHandle = null;
    this.resizeStartSize = null;
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = null;
    this.resizeHandle = null;
    this.resizeStartSize = null;
    return this;
  }

  // Add required plugin interface methods (no-ops for select plugin)
  setStrokeColor(color) {
    return this;
  }

  setFillColor(color) {
    return this;
  }

  setStrokeWidth(width) {
    return this;
  }

  // Check if point is inside an object
  isPointInObject(point, object) {
    if (!object) return false;

    switch (object.type) {
      case 'image':
      case 'rectangle':
        return point.x >= object.x && 
               point.x <= object.x + object.width &&
               point.y >= object.y && 
               point.y <= object.y + object.height;
      
      case 'circle':
        const dx = point.x - object.x;
        const dy = point.y - object.y;
        return Math.sqrt(dx * dx + dy * dy) <= object.radius;
      
      case 'line':
        // Simple line collision (can be improved)
        if (!object.points || object.points.length < 4) return false;
        const tolerance = 10;
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

  // Check if point is on a resize handle
  getResizeHandle(point, object) {
    if (!object || (object.type !== 'image' && object.type !== 'rectangle')) return null;
    
    const handleSize = 16; // Larger handles for better touch support
    const tolerance = 8; // Extra tolerance for easier clicking
    
    const handles = [
      { name: 'nw', x: object.x - handleSize/2, y: object.y - handleSize/2 },
      { name: 'ne', x: object.x + object.width - handleSize/2, y: object.y - handleSize/2 },
      { name: 'sw', x: object.x - handleSize/2, y: object.y + object.height - handleSize/2 },
      { name: 'se', x: object.x + object.width - handleSize/2, y: object.y + object.height - handleSize/2 },
    ];

    for (const handle of handles) {
      if (point.x >= handle.x - tolerance && point.x <= handle.x + handleSize + tolerance &&
          point.y >= handle.y - tolerance && point.y <= handle.y + handleSize + tolerance) {
        return handle.name;
      }
    }
    return null;
  }

  onMouseDown(stage, point, callback) {
    // Get the currently selected object from Whiteboard state
    const currentSelected = callback({ action: 'getCurrentSelected' });
    
    // First check if we're clicking on a resize handle of selected object
    if (currentSelected) {
      const handle = this.getResizeHandle(point, currentSelected);
      if (handle) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.dragStart = { ...point };
        this.resizeStartSize = { 
          width: currentSelected.width, 
          height: currentSelected.height,
          x: currentSelected.x,
          y: currentSelected.y
        };
        return;
      }
    }

    // Use Whiteboard's object detection (more reliable)
    const objectFound = callback({ action: 'findObject', point });
    
    // Check if we're clicking on the currently selected object (for dragging)
    if (currentSelected && objectFound && currentSelected.id === objectFound.id) {
      this.isDragging = true;
      this.dragStart = { 
        x: point.x - currentSelected.x, 
        y: point.y - currentSelected.y 
      };
      return;
    }

    // Select new object or deselect
    if (objectFound) {
      callback({ action: 'select', object: objectFound });
      // If we just selected this object, prepare for potential dragging
      this.dragStart = { 
        x: point.x - objectFound.x, 
        y: point.y - objectFound.y 
      };
    } else {
      // Deselect if clicking on empty space
      callback({ action: 'deselect' });
    }
  }

  onMouseMove(stage, point, callback) {
    const currentSelected = callback({ action: 'getCurrentSelected' });
    if (!currentSelected) return;

    if (this.isResizing && this.dragStart && this.resizeStartSize) {
      // Handle resizing with better logic
      const newObject = { ...currentSelected };
      const deltaX = point.x - this.dragStart.x;
      const deltaY = point.y - this.dragStart.y;

      switch (this.resizeHandle) {
        case 'nw':
          newObject.width = Math.max(20, this.resizeStartSize.width - deltaX);
          newObject.height = Math.max(20, this.resizeStartSize.height - deltaY);
          newObject.x = this.resizeStartSize.x + (this.resizeStartSize.width - newObject.width);
          newObject.y = this.resizeStartSize.y + (this.resizeStartSize.height - newObject.height);
          break;
        case 'ne':
          newObject.width = Math.max(20, this.resizeStartSize.width + deltaX);
          newObject.height = Math.max(20, this.resizeStartSize.height - deltaY);
          newObject.x = this.resizeStartSize.x;
          newObject.y = this.resizeStartSize.y + (this.resizeStartSize.height - newObject.height);
          break;
        case 'sw':
          newObject.width = Math.max(20, this.resizeStartSize.width - deltaX);
          newObject.height = Math.max(20, this.resizeStartSize.height + deltaY);
          newObject.x = this.resizeStartSize.x + (this.resizeStartSize.width - newObject.width);
          newObject.y = this.resizeStartSize.y;
          break;
        case 'se':
          newObject.width = Math.max(20, this.resizeStartSize.width + deltaX);
          newObject.height = Math.max(20, this.resizeStartSize.height + deltaY);
          newObject.x = this.resizeStartSize.x;
          newObject.y = this.resizeStartSize.y;
          break;
      }

      callback({ action: 'update', object: newObject });
      
    } else if (this.isDragging && this.dragStart) {
      // Handle dragging with bounds checking
      const newObject = {
        ...currentSelected,
        x: Math.max(0, point.x - this.dragStart.x),
        y: Math.max(0, point.y - this.dragStart.y)
      };
      
      callback({ action: 'update', object: newObject });
    }
  }

  onMouseUp(stage, callback) {
    const currentSelected = callback({ action: 'getCurrentSelected' });
    
    if ((this.isDragging || this.isResizing) && currentSelected) {
      callback({ action: 'finishUpdate', object: currentSelected });
    }
    
    // Reset all states
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.dragStart = null;
    this.resizeStartSize = null;
  }
}

export default SelectPlugin;