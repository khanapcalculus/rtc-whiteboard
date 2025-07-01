class SavePlugin {
  constructor() {
    this.name = 'save';
    this.icon = '/icons/save.png';
    this.isActive = false;
    this.saveCallback = null;
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    return this;
  }

  // Add required plugin interface methods (no-ops for save plugin)
  setStrokeColor(color) {
    // Save plugin doesn't need stroke color
    return this;
  }

  setFillColor(color) {
    // Save plugin doesn't need fill color
    return this;
  }

  setStrokeWidth(width) {
    // Save plugin doesn't need stroke width
    return this;
  }

  setSaveCallback(callback) {
    this.saveCallback = callback;
  }

  onMouseDown(stage, point, callback) {
    // Trigger save when clicked
    if (this.saveCallback) {
      this.saveCallback();
    }
  }

  onMouseMove() {
    // No movement handling needed for save
  }

  onMouseUp() {
    // No up handling needed for save
  }
}

export default SavePlugin; 