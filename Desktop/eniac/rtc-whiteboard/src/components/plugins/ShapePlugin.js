import { v4 as uuidv4 } from 'uuid';

class ShapePlugin {
  constructor(name, icon) {
    this.name = name;
    this.icon = icon;
    this.isActive = false;
    this.currentShape = null;
    this.strokeColor = '#000000'; // Default stroke color
    this.fillColor = 'transparent'; // Default fill color
    this.strokeWidth = 2; // Default stroke width
  }

  // Add methods to update colors and stroke width
  setStrokeColor(color) {
    this.strokeColor = color;
    return this;
  }

  setFillColor(color) {
    this.fillColor = color;
    return this;
  }

  setStrokeWidth(width) {
    this.strokeWidth = width;
    return this;
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.currentShape = null;
    return this;
  }

  onMouseDown(stage, point, callback) {
    // To be implemented by subclasses
  }

  onMouseMove(stage, point, callback) {
    // To be implemented by subclasses
  }

  onMouseUp(stage, callback) {
    // To be implemented by subclasses
    this.currentShape = null;
  }
}

export default ShapePlugin;