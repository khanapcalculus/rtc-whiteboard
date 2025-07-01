import ShapePlugin from './ShapePlugin';
import { v4 as uuidv4 } from 'uuid';

class CirclePlugin extends ShapePlugin {
  constructor() {
    super('circle', '/icons/circle.png'); // Use .png instead of .svg
    this.startPoint = null;
  }

  onMouseDown(stage, point, callback) {
    this.startPoint = { x: point.x, y: point.y };
    
    this.currentShape = {
      id: uuidv4(),
      type: 'circle',
      x: point.x,
      y: point.y,
      radius: 0,
      color: this.strokeColor,       // Use inherited property
      strokeWidth: this.strokeWidth, // Use inherited property
      fill: this.fillColor           // Use inherited property
    };
    
    callback(this.currentShape);
  }

  onMouseMove(stage, point, callback) {
    if (!this.currentShape || !this.startPoint) return;
    
    // Calculate radius based on distance from start point
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    // Update circle radius
    this.currentShape = {
      ...this.currentShape,
      radius: radius
    };
    
    callback(this.currentShape);
  }

  onMouseUp(stage, callback) {
    if (!this.currentShape) return;
    
    // Finalize the shape
    const finalShape = { ...this.currentShape };
    callback(finalShape);
    
    this.currentShape = null;
    this.startPoint = null;
  }
}

export default CirclePlugin;