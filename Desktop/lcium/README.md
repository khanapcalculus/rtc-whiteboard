# RTC Whiteboard

A fast, lag-free real-time collaborative whiteboard built with React and Konva.

## Features

- **High Performance**: Built with React Konva for smooth, lag-free drawing
- **Virtual Canvas**: Large pannable canvas space for unlimited drawing
- **Modular Tools**: Extensible tool architecture for easy addition of new tools
- **Modern UI**: Transparent toolbar with glassmorphism design
- **Smooth Drawing**: Anti-aliased pen tool with pressure-sensitive rendering

## Current Tools

- **Pen Tool**: Smooth drawing with customizable stroke width and color

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Architecture

- `src/App.js` - Main application component with canvas logic
- `src/components/Toolbar.js` - Modular toolbar component
- `src/tools/` - Individual tool components (PenTool, etc.)

## Usage

- **Drawing**: Select the pen tool and click/drag to draw
- **Panning**: Drag the canvas to move around the virtual space
- **Zooming**: Use mouse wheel to zoom in/out

## Adding New Tools

1. Create a new tool component in `src/tools/`
2. Add the tool to the toolbar in `src/components/Toolbar.js`
3. Handle the tool logic in `src/App.js`

## Performance Optimizations

- React.memo for component optimization
- useCallback for event handlers
- Efficient Konva rendering with minimal re-renders
- Virtual canvas with viewport culling 