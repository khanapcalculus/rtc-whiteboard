import React, { useEffect, useMemo, useRef, useState } from 'react';
import ColorPalette from './components/ColorPalette';
import StrokePalette from './components/StrokePalette';
import Toolbar from './components/Toolbar';
import Whiteboard from './components/Whiteboard';
import CirclePlugin from './components/plugins/CirclePlugin';
import ClearPlugin from './components/plugins/ClearPlugin';
import EraserPlugin from './components/plugins/EraserPlugin';
import LinePlugin from './components/plugins/LinePlugin';
import PanPlugin from './components/plugins/PanPlugin';
import PenPlugin from './components/plugins/PenPlugin';
import RectanglePlugin from './components/plugins/RectanglePlugin';
import SavePlugin from './components/plugins/SavePlugin';
import SelectPlugin from './components/plugins/SelectPlugin';
import UploadPlugin from './components/plugins/UploadPlugin';
import './styles/App.css';

function App() {
  const [plugins, setPlugins] = useState([]);
  const [activePlugin, setActivePlugin] = useState(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedObject, setSelectedObject] = useState(null);
  
  // Dynamic server URL for production and development
  const getServerUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      // In production, WebSocket server runs on the same domain
      return window.location.host;
    } else {
      // Development - use your local IP
      return '192.168.31.158:3001';
    }
  };
  
  const ipAddress = getServerUrl();

  // Refs for persistence functions
  const saveSessionRef = useRef(null);
  const clearSessionRef = useRef(null);

  // Memoize plugins initialization for better performance
  const pluginsArray = useMemo(() => {
    const penPlugin = new PenPlugin();
    penPlugin.name = 'pen'; 
    
    const rectanglePlugin = new RectanglePlugin();
    const circlePlugin = new CirclePlugin();
    const linePlugin = new LinePlugin();
    const panPlugin = new PanPlugin();
    
    // Add save, clear, upload, select and eraser plugins
    const savePlugin = new SavePlugin();
    const clearPlugin = new ClearPlugin();
    const uploadPlugin = new UploadPlugin();
    const selectPlugin = new SelectPlugin();
    const eraserPlugin = new EraserPlugin();

    return [
      penPlugin,
      rectanglePlugin,
      circlePlugin,
      linePlugin,
      panPlugin,
      uploadPlugin,
      selectPlugin,
      eraserPlugin,
      savePlugin,
      clearPlugin
    ];
  }, []);

  useEffect(() => {
    setPlugins(pluginsArray);
    setActivePlugin(pluginsArray[0].activate());
    
    // Set up save and clear callbacks
    const savePlugin = pluginsArray.find(p => p.name === 'save');
    const clearPlugin = pluginsArray.find(p => p.name === 'clear');
    
    if (savePlugin) {
      savePlugin.setSaveCallback(() => {
        if (saveSessionRef.current) {
          saveSessionRef.current();
        }
      });
    }
    
    if (clearPlugin) {
      clearPlugin.setClearCallback(() => {
        if (clearSessionRef.current) {
          clearSessionRef.current();
        }
      });
    }
    
    // Prevent page scrolling and bouncing
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
  }, [pluginsArray]);

  // Update active plugin with current colors and stroke width
  useEffect(() => {
    if (activePlugin) {
      if (activePlugin.name === 'pen') {
        // PenPlugin uses setColor() method
        activePlugin.setColor(strokeColor);
        activePlugin.setStrokeWidth(strokeWidth);
      } else {
        // ShapePlugins use setStrokeColor() and setFillColor() methods
        activePlugin.setStrokeColor(strokeColor);
        activePlugin.setFillColor(fillColor);
        activePlugin.setStrokeWidth(strokeWidth);
      }
    }
  }, [activePlugin, strokeColor, fillColor, strokeWidth]);

  return (
    <div className="app">
      {/* Toolbar at top with palettes on the right */}
      <div className="toolbar-wrapper">
        <div className="toolbar-container">
          <div className="toolbar-section tools-section">
            <Toolbar 
              plugins={plugins} 
              activePlugin={activePlugin} 
              setActivePlugin={setActivePlugin} 
            />
          </div>
          
          {/* Palettes on right side of toolbar */}
          <div className="palette-sidebar">
            <div className="palette-item">
              <ColorPalette 
                type="stroke" 
                activeColor={strokeColor} 
                onColorSelect={setStrokeColor} 
              />
            </div>
            <div className="palette-item">
              <ColorPalette 
                type="fill" 
                activeColor={fillColor} 
                onColorSelect={setFillColor} 
              />
            </div>
            <div className="palette-item">
              <StrokePalette 
                activeStrokeWidth={strokeWidth} 
                onStrokeWidthSelect={setStrokeWidth} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Logo in top right corner */}
      <div className="logo-container">
        <img 
          src="/icons/logo.png" 
          alt="Logo" 
          className="app-logo"
        />
      </div>
      
      {/* Whiteboard area - full viewport minus toolbar */}
      <div className="whiteboard-container">
        <Whiteboard 
          activePlugin={activePlugin}
          ipAddress={ipAddress}
          strokeColor={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          onSaveSession={saveSessionRef}
          onClearSession={clearSessionRef}
        />
      </div>
    </div>
  );
}

export default App;
