import ShapePlugin from './ShapePlugin';

class PanPlugin extends ShapePlugin {
  constructor() {
    super('pan', '/icons/pan.png');
  }

  // Pan plugin doesn't need to create shapes, but we need to implement these methods
  onMouseDown(stage, point, callback) {
    // Pan functionality is handled in the Whiteboard component
  }

  onMouseMove(stage, point, callback) {
    // Pan functionality is handled in the Whiteboard component
  }

  onMouseUp(stage, callback) {
    // Pan functionality is handled in the Whiteboard component
  }
}

export default PanPlugin;