import ShapePlugin from './ShapePlugin';
import { v4 as uuidv4 } from 'uuid';

class LinePlugin extends ShapePlugin {
  constructor() {
    super('line', '/icons/line.png'); // Use .png instead of .svg
    this.startPoint = null;
  }

  onMouseDown(stage, point, callback) {
    this.startPoint = { x: point.x, y: point.y };
    
    this.currentShape = {
      id: uuidv4(),
      type: 'line',
      points: [point.x, point.y, point.x, point.y],
      color: this.strokeColor,       // Use inherited property
      strokeWidth: this.strokeWidth  // Use inherited property
    };
    
    callback(this.currentShape);
  }

  onMouseMove(stage, point, callback) {
    if (!this.currentShape || !this.startPoint) return;
    
    // Update end point of the line
    this.currentShape = {
      ...this.currentShape,
      points: [this.startPoint.x, this.startPoint.y, point.x, point.y]
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

export default LinePlugin;