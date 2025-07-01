class PenPlugin {
  constructor() {
    this.name = 'pen';
    this.icon = '/icons/pen.png'; // Make sure to include the leading slash
    this.isActive = false;
    this.color = '#000000';
    this.strokeWidth = 2;
    this.lines = [];
    this.currentLine = null;
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.currentLine = null;
    return this;
  }

  onMouseDown(stage, point, onLineCreated) {
    if (!this.isActive) return;
    
    this.currentLine = {
      tool: 'pen',
      points: [point.x, point.y],
      color: this.color,
      strokeWidth: this.strokeWidth,
      id: Date.now().toString()
    };
    
    if (onLineCreated) {
      onLineCreated(this.currentLine);
    }
  }

  onMouseMove(stage, point, onLineUpdated) {
    if (!this.isActive || !this.currentLine) return;
    
    // Add point smoothing by checking distance from last point
    const points = this.currentLine.points;
    if (points.length >= 2) {
      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      const distance = Math.sqrt((point.x - lastX) ** 2 + (point.y - lastY) ** 2);
      
      // Only add point if it's far enough from the last point (reduces noise)
      if (distance < 2) {
        return; // Skip this point to smooth the line
      }
    }
    
    this.currentLine.points = this.currentLine.points.concat([point.x, point.y]);
    
    if (onLineUpdated) {
      onLineUpdated(this.currentLine);
    }
  }

  onMouseUp(stage, onLineFinished) {
    if (!this.isActive || !this.currentLine) return;
    
    const finishedLine = { ...this.currentLine };
    this.lines.push(finishedLine);
    
    if (onLineFinished) {
      onLineFinished(finishedLine);
    }
    
    this.currentLine = null;
  }

  setColor(color) {
    this.color = color;
    return this;
  }

  setStrokeWidth(width) {
    this.strokeWidth = width;
    return this;
  }

  render(layer) {
    // This method would be called by the whiteboard component
    // to render all lines created by this plugin
    return null;
  }
}

export default PenPlugin;