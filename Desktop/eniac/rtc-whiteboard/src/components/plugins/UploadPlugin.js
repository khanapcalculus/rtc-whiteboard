import { v4 as uuidv4 } from 'uuid';

class UploadPlugin {
  constructor() {
    this.name = 'upload';
    this.icon = '/icons/image.png';
    this.isActive = false;
    this.fileInput = null;
    this.addShapeCallback = null;
    this.isProcessing = false;
    this.isTouchDevice = false;
  }

  activate() {
    this.isActive = true;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.createFileInput();
    
    // For tablets, wait for callback to be set before triggering
    if (this.isTouchDevice) {
      // Wait longer for callback to be available on touch devices
      this.waitForCallbackAndTrigger();
    } else {
      // Desktop can trigger immediately
      setTimeout(() => {
        this.triggerFilePicker();
      }, 100);
    }
    
    return this;
  }

  waitForCallbackAndTrigger() {
    const checkCallback = () => {
      if (this.addShapeCallback && this.isActive) {
        this.triggerFilePicker();
      } else if (this.isActive) {
        // Keep checking every 50ms for up to 2 seconds
        setTimeout(checkCallback, 50);
      }
    };
    
    // Start checking after a short delay
    setTimeout(checkCallback, 150);
  }

  deactivate() {
    this.isActive = false;
    this.addShapeCallback = null;
    this.isProcessing = false;
    this.removeFileInput();
    return this;
  }

  setAddShapeCallback(callback) {
    this.addShapeCallback = callback;
    
    // If this is a touch device and we're waiting, trigger now
    if (this.isTouchDevice && this.isActive && !this.isProcessing) {
      setTimeout(() => {
        this.triggerFilePicker();
      }, 50);
    }
  }

  createFileInput() {
    this.removeFileInput();

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.position = 'fixed';
    this.fileInput.style.left = '-9999px';
    this.fileInput.style.top = '-9999px';
    this.fileInput.style.opacity = '0';
    this.fileInput.style.pointerEvents = 'none';
    this.fileInput.style.zIndex = '-1000';
    this.fileInput.style.width = '1px';
    this.fileInput.style.height = '1px';
    
    document.body.appendChild(this.fileInput);
    
    // Single change handler - don't add duplicate listeners
    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelection(e);
      // Hide input after selection for mobile
      if (this.isTouchDevice) {
        this.hideFileInput();
      }
    });
  }

  hideFileInput() {
    if (this.fileInput) {
      this.fileInput.style.position = 'fixed';
      this.fileInput.style.left = '-9999px';
      this.fileInput.style.top = '-9999px';
      this.fileInput.style.opacity = '0';
      this.fileInput.style.pointerEvents = 'none';
      this.fileInput.style.zIndex = '-1000';
      this.fileInput.style.width = '1px';
      this.fileInput.style.height = '1px';
      this.fileInput.style.backgroundColor = 'transparent';
      this.fileInput.style.color = 'initial';
      this.fileInput.style.border = 'none';
      this.fileInput.style.borderRadius = '0';
      this.fileInput.style.fontSize = 'initial';
      this.fileInput.style.padding = '0';
      this.fileInput.style.transform = 'none';
    }
  }

  removeFileInput() {
    if (this.fileInput) {
      if (this.fileInput.parentNode) {
        this.fileInput.parentNode.removeChild(this.fileInput);
      }
      this.fileInput = null;
    }
  }

  triggerFilePicker() {
    if (!this.isActive || this.isProcessing) {
      return;
    }

    if (this.isTouchDevice) {
      // For touch devices, make file input visible and clickable
      if (this.fileInput) {
        // Make file input temporarily visible and clickable for mobile
        this.fileInput.style.position = 'fixed';
        this.fileInput.style.top = '50%';
        this.fileInput.style.left = '50%';
        this.fileInput.style.transform = 'translate(-50%, -50%)';
        this.fileInput.style.width = '200px';
        this.fileInput.style.height = '60px';
        this.fileInput.style.opacity = '1';
        this.fileInput.style.pointerEvents = 'auto';
        this.fileInput.style.zIndex = '10000';
        this.fileInput.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.fileInput.style.color = 'white';
        this.fileInput.style.border = '2px solid white';
        this.fileInput.style.borderRadius = '10px';
        this.fileInput.style.fontSize = '16px';
        this.fileInput.style.cursor = 'pointer';
        this.fileInput.style.padding = '10px';
        
        // Add cancel handler for clicking outside
        const cancelHandler = (e) => {
          if (this.fileInput && !this.fileInput.contains(e.target)) {
            this.hideFileInput();
            document.removeEventListener('click', cancelHandler);
          }
        };
        
        setTimeout(() => {
          document.addEventListener('click', cancelHandler);
        }, 100);
        
        // Try to focus the input
        this.fileInput.focus();
      }
    } else {
      // For desktop, direct file input trigger
      if (this.fileInput) {
        this.fileInput.click();
      }
    }
  }

  handleFileSelection(event) {
    if (!this.isActive || this.isProcessing) {
      return;
    }

    const file = event.target.files[0];
    if (!file) {
      return;
    }

    this.isProcessing = true;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!this.isActive) {
          this.isProcessing = false;
          return;
        }

        // Scale image if too large
        let width = img.width;
        let height = img.height;
        const maxSize = 400;
        
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width *= scale;
          height *= scale;
        }

        // Place image at center of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Create image shape
        const imageShape = {
          id: uuidv4(),
          type: 'image',
          x: centerX - width / 2,
          y: centerY - height / 2,
          width: width,
          height: height,
          src: e.target.result,
          rotation: 0,
          scaleX: 1,
          scaleY: 1
        };

        // Use direct callback to add shape
        if (this.addShapeCallback) {
          this.addShapeCallback(imageShape);
        }
        
        // Reset state
        this.isProcessing = false;
        
        // Clear the file input value
        event.target.value = '';
      };

      img.onerror = () => {
        console.error('Failed to load image');
        this.isProcessing = false;
        event.target.value = '';
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      console.error('Failed to read file');
      this.isProcessing = false;
      event.target.value = '';
    };

    reader.readAsDataURL(file);
  }

  setStrokeColor(color) {
    return this;
  }

  setFillColor(color) {
    return this;
  }

  setStrokeWidth(width) {
    return this;
  }

  onMouseDown(stage, point, callback) {
    // Not needed anymore - file picker triggers on activation
  }

  onMouseMove() {
    // No movement handling needed
  }

  onMouseUp() {
    // No up handling needed
  }
}

export default UploadPlugin;