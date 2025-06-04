const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  startFileWatch: (filePath) => ipcRenderer.invoke('start-file-watch', filePath),
  stopFileWatch: () => ipcRenderer.invoke('stop-file-watch'),
  onFileChanged: (callback) => ipcRenderer.on('file-changed', callback),
  onFileWatchError: (callback) => ipcRenderer.on('file-watch-error', callback),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('file-changed')
    ipcRenderer.removeAllListeners('file-watch-error')
  }
})