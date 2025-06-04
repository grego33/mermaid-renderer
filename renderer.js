// Use the secure electronAPI exposed by preload script

// Import mermaid - we'll load it from node_modules
let mermaid;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Dynamically import mermaid
        const mermaidModule = await import('./node_modules/mermaid/dist/mermaid.esm.min.mjs');
        mermaid = mermaidModule.default;
        
        // Initialize mermaid with configuration
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Arial, sans-serif',
            fontSize: 16
        });
        
        initializeApp();
    } catch (error) {
        showStatus('Failed to load Mermaid library: ' + error.message, 'error');
        console.error('Mermaid loading error:', error);
    }
});

function initializeApp() {
    const fileInput = document.getElementById('fileInput');
    const watchStatus = document.getElementById('watchStatus');
    const diagramContainer = document.getElementById('diagram');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    const zoomInfo = document.getElementById('zoomInfo');
    const controls = document.getElementById('controls');
    const toggleControls = document.getElementById('toggleControls');
    const toggleIcon = document.getElementById('toggleIcon');
    
    let selectedFilePath = null;
    let fileContent = '';
    let autoRenderEnabled = true;
    
    // Zoom and pan state
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const autoRenderCheckbox = document.getElementById('autoRender');
    autoRenderCheckbox.addEventListener('change', (e) => {
        autoRenderEnabled = e.target.checked;
        if (autoRenderEnabled && selectedFilePath) {
            showStatus('Auto-render enabled. File changes will automatically update the diagram.', 'success');
        } else if (!autoRenderEnabled) {
            showStatus('Auto-render disabled. Manual refresh required.', 'success');
        }
    });

    // Toggle controls visibility
    toggleControls.addEventListener('click', () => {
        controls.classList.toggle('collapsed');
        toggleIcon.textContent = controls.classList.contains('collapsed') ? '▼' : '▲';
    });

    // Handle file selection from input (for drag and drop)
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            readFileFromInput(file);
        }
    });

    // Handle file selection via dialog button (label click triggers this)
    document.querySelector('.file-label').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const result = await window.electronAPI.selectFile();
            if (result.success) {
                selectedFilePath = result.filePath;
                fileContent = result.content;
                
                showStatus(`File loaded: ${result.fileName} (${result.content.length} characters)`, 'success');
                
                // Start watching the file
                startFileWatching(result.filePath);
                showWatchStatus(true);
                
                // Auto-collapse controls when file is loaded
                setTimeout(() => {
                    controls.classList.add('collapsed');
                    toggleIcon.textContent = '▼';
                }, 1000);
                
                // Auto-render
                setTimeout(() => renderDiagram(fileContent), 300);
                
            } else if (!result.canceled) {
                showStatus('Error loading file: ' + result.error, 'error');
            }
        } catch (error) {
            showStatus('Error selecting file: ' + error.message, 'error');
        }
    });

    // Listen for file changes from main process
    window.electronAPI.onFileChanged((event, data) => {
        fileContent = data.content;
        showStatus('File changed detected. Content updated.', 'success');
        
        // Flash the watch indicator
        flashWatchIndicator();
        
        if (autoRenderEnabled) {
            showStatus('Auto-rendering updated diagram...', 'success');
            setTimeout(() => renderDiagram(fileContent), 200);
        } else {
            showStatus('File updated. Manual refresh required.', 'success');
        }
    });

    window.electronAPI.onFileWatchError((event, error) => {
        showStatus('File watching error: ' + error, 'error');
        showWatchStatus(false);
    });

    // Zoom controls
    zoomInBtn.addEventListener('click', () => zoomIn());
    zoomOutBtn.addEventListener('click', () => zoomOut());
    zoomResetBtn.addEventListener('click', () => resetZoom());

    // Mouse wheel zoom
    diagramContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        // Get mouse position relative to the diagram container
        const rect = diagramContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Smooth zoom delta
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        
        zoom(delta, mouseX, mouseY);
    });

    // Pan functionality
    diagramContainer.addEventListener('mousedown', (e) => {
        if (e.target.closest('#diagram svg')) {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            diagramContainer.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            panX += deltaX;
            panY += deltaY;
            updateDiagramTransform();
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            diagramContainer.style.cursor = 'grab';
        }
    });

    // Keyboard shortcuts for zoom
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    zoom(0.1);
                    break;
                case '-':
                    e.preventDefault();
                    zoom(-0.1);
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        }
        
        // Toggle controls with 'c' key
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
            controls.classList.toggle('collapsed');
            toggleIcon.textContent = controls.classList.contains('collapsed') ? '▼' : '▲';
        }
    });

    function readFileFromInput(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            fileContent = e.target.result;
            showStatus(`File loaded: ${file.name} (${fileContent.length} characters)`, 'success');
            
            // Auto-collapse controls when file is loaded
            setTimeout(() => {
                controls.classList.add('collapsed');
                toggleIcon.textContent = '▼';
            }, 1000);
            
            // Auto-render
            setTimeout(() => renderDiagram(fileContent), 300);
        };
        
        reader.onerror = () => {
            showStatus('Error reading file: ' + reader.error.message, 'error');
        };
        
        reader.readAsText(file);
    }

    function showWatchStatus(isActive) {
        if (isActive) {
            watchStatus.innerHTML = '<span class="indicator"></span>File watching active - changes will auto-refresh';
            watchStatus.className = 'watch-status active';
        } else {
            watchStatus.innerHTML = '⚠️ File watching inactive';
            watchStatus.className = 'watch-status';
        }
        watchStatus.style.display = 'block';
    }

    function hideWatchStatus() {
        watchStatus.style.display = 'none';
    }

    function flashWatchIndicator() {
        const indicator = watchStatus.querySelector('.indicator');
        if (indicator) {
            indicator.style.background = '#ffc107';
            setTimeout(() => {
                indicator.style.background = '#28a745';
            }, 300);
        }
    }

    async function renderDiagram(content) {
        try {
            showStatus('Rendering diagram...', 'success');
            
            // Clean the diagram container
            diagramContainer.innerHTML = '';
            
            // Extract mermaid code from the content
            const mermaidCode = extractMermaidCode(content);
            
            if (!mermaidCode) {
                throw new Error('No Mermaid diagram code found in the file. Please ensure the file contains valid Mermaid syntax.');
            }
            
            // Generate unique ID for the diagram
            const diagramId = 'diagram-' + Date.now();
            
            // Create a div for the diagram
            const diagramDiv = document.createElement('div');
            diagramDiv.id = diagramId;
            diagramContainer.appendChild(diagramDiv);
            
            // Render the mermaid diagram
            const { svg } = await mermaid.render(diagramId + '-svg', mermaidCode);
            diagramDiv.innerHTML = svg;
            
            // Reset zoom and pan for new diagram, then center it
            setTimeout(() => {
                resetZoom();
                centerDiagram();
            }, 100);
            
            showStatus('Diagram rendered successfully! 🎉', 'success');
            
        } catch (error) {
            console.error('Rendering error:', error);
            diagramContainer.innerHTML = `
                <div style="color: #dc3545; text-align: center; padding: 20px;">
                    <h3>❌ Rendering Error</h3>
                    <p>${error.message}</p>
                    <small>Please check that your file contains valid Mermaid syntax.</small>
                </div>
            `;
            showStatus('Error rendering diagram: ' + error.message, 'error');
        }
    }

    function extractMermaidCode(content) {
        // Try to extract mermaid code from markdown code blocks first
        const mermaidBlockMatch = content.match(/```mermaid\s*([\s\S]*?)\s*```/i);
        if (mermaidBlockMatch) {
            return mermaidBlockMatch[1].trim();
        }
        
        // Try to find mermaid code block without language specification
        const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            const code = codeBlockMatch[1].trim();
            // Check if it looks like mermaid code
            if (isMermaidCode(code)) {
                return code;
            }
        }
        
        // If no code blocks found, assume the entire content is mermaid code
        const trimmedContent = content.trim();
        if (isMermaidCode(trimmedContent)) {
            return trimmedContent;
        }
        
        return null;
    }

    function isMermaidCode(code) {
        // Common mermaid diagram types
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
            'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
            'gitgraph', 'requirementDiagram', 'mindmap', 'timeline'
        ];
        
        const firstLine = code.split('\n')[0].toLowerCase().trim();
        return mermaidKeywords.some(keyword => firstLine.startsWith(keyword));
    }

    async function startFileWatching(filePath) {
        try {
            const result = await window.electronAPI.startFileWatch(filePath);
            if (result.success) {
                showStatus('File watching enabled. Changes will auto-refresh the diagram.', 'success');
                showWatchStatus(true);
            } else {
                showStatus('File watching could not be enabled: ' + result.error, 'error');
                showWatchStatus(false);
            }
        } catch (error) {
            console.error('File watching error:', error);
            showStatus('File watching could not be enabled: ' + error.message, 'error');
            showWatchStatus(false);
        }
    }

    async function stopFileWatching() {
        try {
            await window.electronAPI.stopFileWatch();
        } catch (error) {
            console.error('Error stopping file watch:', error);
        }
    }

    function clearAll() {
        stopFileWatching();
        fileInput.value = '';
        fileContent = '';
        selectedFilePath = null;
        hideWatchStatus();
        diagramContainer.innerHTML = 'Select a file containing Mermaid code to get started';
        resetZoom();
        hideStatus();
        
        // Show controls when clearing
        controls.classList.remove('collapsed');
        toggleIcon.textContent = '▲';
    }

    // Zoom and pan functions
    function zoomIn() {
        zoom(0.1);
    }

    function zoomOut() {
        zoom(-0.1);
    }

    function zoom(delta, mouseX = null, mouseY = null) {
        const oldZoom = zoomLevel;
        const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
        
        // Only proceed if zoom level actually changed
        if (Math.abs(newZoom - zoomLevel) < 0.001) {
            return;
        }
        
        // If mouse position provided, zoom towards mouse position
        if (mouseX !== null && mouseY !== null) {
            const containerRect = diagramContainer.getBoundingClientRect();
            
            // Calculate the point in the diagram coordinate system before zoom
            const pointBeforeZoomX = (mouseX - containerRect.width / 2 - panX) / zoomLevel;
            const pointBeforeZoomY = (mouseY - containerRect.height / 2 - panY) / zoomLevel;
            
            // Update zoom level
            zoomLevel = newZoom;
            
            // Calculate where that point should be after zoom
            const pointAfterZoomX = pointBeforeZoomX * zoomLevel;
            const pointAfterZoomY = pointBeforeZoomY * zoomLevel;
            
            // Adjust pan to keep the point under the mouse
            panX = mouseX - containerRect.width / 2 - pointAfterZoomX;
            panY = mouseY - containerRect.height / 2 - pointAfterZoomY;
        } else {
            zoomLevel = newZoom;
        }
        
        updateDiagramTransform();
        updateZoomInfo();
        
        // Update zoom button states
        updateZoomButtons();
    }

    function resetZoom() {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        updateDiagramTransform();
        updateZoomInfo();
        updateZoomButtons();
    }

    function centerDiagram() {
        const diagram = document.getElementById('diagram');
        const svg = diagram.querySelector('svg');
        
        if (svg) {
            const containerRect = diagramContainer.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            
            // Calculate center offset
            const centerX = (containerRect.width - svgRect.width * zoomLevel) / 2;
            const centerY = (containerRect.height - svgRect.height * zoomLevel) / 2;
            
            panX = centerX;
            panY = centerY;
            updateDiagramTransform();
        }
    }

    function updateDiagramTransform() {
        const diagram = document.getElementById('diagram');
        diagram.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
        diagram.style.transition = isDragging ? 'none' : 'transform 0.1s ease-out';
    }

    function updateZoomInfo() {
        zoomInfo.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    function updateZoomButtons() {
        zoomInBtn.disabled = zoomLevel >= 5;
        zoomOutBtn.disabled = zoomLevel <= 0.1;
        
        if (zoomLevel >= 5) {
            zoomInBtn.style.opacity = '0.5';
            zoomInBtn.style.cursor = 'not-allowed';
        } else {
            zoomInBtn.style.opacity = '1';
            zoomInBtn.style.cursor = 'pointer';
        }
        
        if (zoomLevel <= 0.1) {
            zoomOutBtn.style.opacity = '0.5';
            zoomOutBtn.style.cursor = 'not-allowed';
        } else {
            zoomOutBtn.style.opacity = '1';
            zoomOutBtn.style.cursor = 'pointer';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideStatus();
        }, 3000);
    }
}

function hideStatus() {
    const status = document.getElementById('status');
    status.style.display = 'none';
}

// Handle drag and drop functionality
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.backgroundColor = '#e3f2fd';
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.backgroundColor = '#f5f5f5';
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.backgroundColor = '#f5f5f5';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        readFileFromInput(file);
    }
});

// Clean up file watcher when window is closed
window.addEventListener('beforeunload', async () => {
    try {
        await window.electronAPI.stopFileWatch();
        window.electronAPI.removeAllListeners();
    } catch (error) {
        console.error('Error cleaning up file watcher:', error);
    }
});