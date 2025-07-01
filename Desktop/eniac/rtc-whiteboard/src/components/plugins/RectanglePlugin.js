import ShapePlugin from './ShapePlugin';
import { v4 as uuidv4 } from 'uuid';

class RectanglePlugin extends ShapePlugin {
  constructor() {
    super('rectangle', '/icons/rectangle.png'); // Use .png instead of .svg
    this.startPoint = null;
  }

  // Make sure your RectanglePlugin is correctly implementing the required methods
  onMouseDown(stage, point, callback) {
    this.startPoint = { x: point.x, y: point.y };
    
    this.currentShape = {
      id: uuidv4(), // Make sure you're generating a unique ID
      type: 'rectangle',
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      color: this.strokeColor,       // Use inherited property
      strokeWidth: this.strokeWidth, // Use inherited property
      fill: this.fillColor           // Use inherited property
    };
    
    // Call the callback with the new shape
    if (callback) callback(this.currentShape);
  }

  onMouseMove(stage, point, callback) {
    if (!this.currentShape || !this.startPoint) return;
    
    const width = point.x - this.startPoint.x;
    const height = point.y - this.startPoint.y;
    
    // Update rectangle dimensions
    this.currentShape = {
      ...this.currentShape,
      width: width,
      height: height
    };
    
    // Call the callback with the updated shape
    if (callback) callback(this.currentShape);
  }

  onMouseUp(stage, callback) {
    if (!this.currentShape) return;
    
    // Finalize the shape
    const finalShape = { ...this.currentShape };
    
    // Call the callback with the finalized shape
    if (callback) callback(finalShape);
    
    this.currentShape = null;
    this.startPoint = null;
  }
}

export default RectanglePlugin;