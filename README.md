# Mermaid Diagram Renderer

A desktop application built with Electron that allows you to select Mermaid.js files from your computer and render beautiful diagrams.

## Features

- 📁 **File Selection**: Choose files containing Mermaid.js code from your computer
- 🎨 **Live Rendering**: Automatically renders diagrams when files are loaded
- 🔄 **Auto-Refresh**: Automatically updates diagrams when files change
- 🔍 **Zoom & Pan**: Zoom in/out and pan around large diagrams
- 📱 **Drag & Drop**: Drag files directly onto the application window
- 🔍 **Smart Detection**: Automatically detects Mermaid code in various file formats
- 👁️ **File Watching**: Real-time monitoring of file changes with visual indicators
- ⌨️ **Keyboard Shortcuts**: Quick access to zoom and navigation functions
- 📐 **Maximized Viewport**: Full-screen diagram viewing with collapsible controls
- 📊 **Multiple Diagram Types**: Supports all Mermaid diagram types

## Supported File Formats

- `.md` - Markdown files (with ```mermaid code blocks)
- `.txt` - Plain text files
- `.mmd` - Mermaid files
- `.mermaid` - Mermaid files

## Supported Diagram Types

- Flowcharts
- Sequence Diagrams
- Class Diagrams
- State Diagrams
- Entity Relationship Diagrams
- User Journey Diagrams
- Gantt Charts
- Pie Charts
- Git Graphs
- Requirement Diagrams
- Mindmaps
- Timelines

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the application:
   ```bash
   npm start
   ```

2. **Select a file**: 
   - Click the "📁 Select File" button to open a file dialog
   - Or drag and drop a file containing Mermaid code onto the application

3. **Auto-refresh**: The diagram will automatically update when you save changes to the file
   - Toggle auto-refresh on/off using the "🔄 Auto-render on file change" checkbox
   - Watch status indicator shows when file monitoring is active

4. **Maximized viewing**: 
   - Controls automatically collapse after file selection for maximum diagram space
   - Click "Controls" button or press 'C' key to show/hide controls
   - Full viewport is dedicated to diagram viewing

5. **Navigate diagrams**: 
   - Use mouse wheel to zoom in/out
   - Click and drag to pan around large diagrams
   - Use zoom controls in top-right corner
   - Reset zoom with the home button or Ctrl/Cmd + 0

## Example Files

The `examples/` folder contains sample Mermaid files you can use to test the application:

- `flowchart.md` - A flowchart showing a debugging process
- `sequence.mmd` - A sequence diagram showing user authentication
- `class-diagram.txt` - A class diagram for an e-commerce system

## File Format Examples

### Markdown with Mermaid Code Block
```markdown
# My Diagram

```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```
```

### Plain Mermaid Code
```
flowchart LR
    A[Input] --> B[Process]
    B --> C[Output]
```

## Auto-Refresh Feature

The application includes real-time file monitoring that automatically updates diagrams when you save changes to the source file. This is perfect for:

- **Live editing**: Edit your Mermaid files in any text editor and see changes instantly
- **Iterative design**: Quickly refine diagrams without manual refresh
- **Real-time collaboration**: Share your screen while editing for live demonstrations

### File Watching Indicators

- 🟢 **Green indicator**: File watching is active and monitoring changes
- ⚠️ **Warning**: File watching is inactive or encountered an error
- 💛 **Flash**: File change detected and diagram updated

### Auto-Refresh Controls

- Use the checkbox to enable/disable automatic rendering
- Manual render button remains available when auto-refresh is disabled
- File watching continues even when auto-refresh is off

## Zoom & Navigation Features

The application includes powerful zoom and pan capabilities for viewing large or complex diagrams:

### Zoom Controls

- **Mouse Wheel**: Scroll to zoom in/out at cursor position
- **Zoom Buttons**: Use +/- buttons in the top-right corner
- **Reset Button**: Click the home button to reset zoom to 100%
### Keyboard Shortcuts:
  - `Ctrl/Cmd + +` - Zoom in
  - `Ctrl/Cmd + -` - Zoom out  
  - `Ctrl/Cmd + 0` - Reset zoom
  - `C` - Toggle controls visibility

### Pan Controls

- **Click & Drag**: Click and drag on the diagram to pan around
- **Visual Feedback**: Cursor changes to indicate pan mode
- **Smooth Transitions**: Smooth animations for better user experience

### Zoom Information

- **Zoom Level**: Current zoom percentage displayed in bottom-left
- **Zoom Range**: 10% to 500% zoom levels supported
- **Smart Zoom**: Zoom centers on mouse position for precise control

## Interface Design

The application features a **maximized viewport design** optimized for diagram viewing:

- **Collapsible Controls**: The control panel automatically hides after file selection to maximize diagram space
- **Full-Screen Viewing**: Diagrams occupy the entire viewport for better visibility of complex diagrams
- **Quick Access**: Toggle controls with the 'C' key or click the "Controls" button
- **Minimal UI**: Clean, distraction-free interface focused on diagram content

## Troubleshooting

- **Diagram not rendering**: Ensure your Mermaid syntax is correct
- **File not loading**: Check that the file contains valid Mermaid code
- **Auto-refresh not working**: Try selecting the file again using the "Select File" button
- **File watching error**: Check that the file still exists and is accessible
- **Zoom not working**: Ensure the diagram is fully loaded before attempting to zoom
- **Pan not responding**: Try clicking directly on the diagram SVG content
- **Controls hidden**: Press 'C' key or click the "Controls" button to show/hide
- **Application won't start**: Make sure all dependencies are installed with `npm install`

## Development

- Built with Electron
- Uses Mermaid.js for diagram rendering
- Node.js integration enabled for file system access

## License

ISC