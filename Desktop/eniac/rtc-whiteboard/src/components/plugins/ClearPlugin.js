class ClearPlugin {
  constructor() {
    this.name = 'clear';
    this.icon = '/icons/clear.png';
    this.isActive = false;
    this.clearCallback = null;
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    return this;
  }

  // Add required plugin interface methods (no-ops for clear plugin)
  setStrokeColor(color) {
    // Clear plugin doesn't need stroke color
    return this;
  }

  setFillColor(color) {
    // Clear plugin doesn't need fill color
    return this;
  }

  setStrokeWidth(width) {
    // Clear plugin doesn't need stroke width
    return this;
  }

  setClearCallback(callback) {
    this.clearCallback = callback;
  }

  onMouseDown(stage, point, callback) {
    // Trigger clear when clicked
    if (this.clearCallback) {
      this.clearCallback();
    }
  }

  onMouseMove() {
    // No movement handling needed for clear
  }

  onMouseUp() {
    // No up handling needed for clear
  }
}

export default ClearPlugin; 