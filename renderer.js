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
    const renderBtn = document.getElementById('renderBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileInfo = document.getElementById('fileInfo');
    const watchStatus = document.getElementById('watchStatus');
    const diagramContainer = document.getElementById('diagram');
    
    let selectedFilePath = null;
    let fileContent = '';
    let autoRenderEnabled = true;

    // Add file selection button
    const selectFileBtn = document.createElement('button');
    selectFileBtn.textContent = '📁 Select File';
    selectFileBtn.style.marginRight = '10px';
    fileInput.parentNode.insertBefore(selectFileBtn, fileInput);

    // Add auto-render toggle
    const autoRenderToggle = document.createElement('label');
    autoRenderToggle.innerHTML = `
        <input type="checkbox" id="autoRender" checked style="margin-right: 5px;">
        🔄 Auto-render on file change
    `;
    autoRenderToggle.style.display = 'block';
    autoRenderToggle.style.marginTop = '10px';
    autoRenderToggle.style.fontSize = '14px';
    fileInput.parentNode.appendChild(autoRenderToggle);

    const autoRenderCheckbox = document.getElementById('autoRender');
    autoRenderCheckbox.addEventListener('change', (e) => {
        autoRenderEnabled = e.target.checked;
        if (autoRenderEnabled && selectedFilePath) {
            showStatus('Auto-render enabled. File changes will automatically update the diagram.', 'success');
        } else if (!autoRenderEnabled) {
            showStatus('Auto-render disabled. Use the render button to update manually.', 'success');
        }
    });

    // File selection via dialog
    selectFileBtn.addEventListener('click', async () => {
        try {
            const result = await window.electronAPI.selectFile();
            if (result.success) {
                selectedFilePath = result.filePath;
                fileContent = result.content;
                
                showFileInfo({
                    name: result.fileName,
                    size: result.size
                });
                
                renderBtn.disabled = false;
                showStatus(`File loaded: ${result.fileName} (${result.content.length} characters)`, 'success');
                
                // Start watching the file
                startFileWatching(result.filePath);
                showWatchStatus(true);
                
                // Auto-render if enabled
                if (autoRenderEnabled) {
                    setTimeout(() => renderDiagram(fileContent), 300);
                }
            } else if (!result.canceled) {
                showStatus('Error loading file: ' + result.error, 'error');
            }
        } catch (error) {
            showStatus('Error selecting file: ' + error.message, 'error');
        }
    });

    // Traditional file input (for drag and drop)
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            showFileInfo(file);
            readFileFromInput(file);
        }
    });

    // Render button handler
    renderBtn.addEventListener('click', () => {
        if (fileContent) {
            renderDiagram(fileContent);
        }
    });

    // Clear button handler
    clearBtn.addEventListener('click', () => {
        clearAll();
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
            showStatus('File updated. Click "Render Diagram" to see changes.', 'success');
        }
    });

    window.electronAPI.onFileWatchError((event, error) => {
        showStatus('File watching error: ' + error, 'error');
        showWatchStatus(false);
    });

    function showFileInfo(file) {
        const fileName = file.name || file;
        const fileSize = file.size || 0;
        const info = `📄 ${fileName} (${formatFileSize(fileSize)})`;
        fileInfo.textContent = info;
        fileInfo.style.display = 'block';
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

    function readFileFromInput(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            fileContent = e.target.result;
            renderBtn.disabled = false;
            showStatus(`File loaded successfully! ${fileContent.length} characters read.`, 'success');
            
            // Auto-render if enabled
            if (autoRenderEnabled) {
                setTimeout(() => renderDiagram(fileContent), 300);
            }
        };
        
        reader.onerror = () => {
            showStatus('Error reading file: ' + reader.error.message, 'error');
            renderBtn.disabled = true;
        };
        
        reader.readAsText(file);
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
        renderBtn.disabled = true;
        fileInfo.style.display = 'none';
        hideWatchStatus();
        diagramContainer.innerHTML = 'Select a file containing Mermaid code to get started';
        hideStatus();
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

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.backgroundColor = '#f5f5f5';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('fileInput');
        fileInput.files = files;
        fileInput.dispatchEvent(new Event('change'));
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