const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')

  // Handle file selection dialog
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Mermaid Files', extensions: ['md', 'txt', 'mmd', 'mermaid'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        return {
          success: true,
          filePath: filePath,
          fileName: path.basename(filePath),
          content: content,
          size: fs.statSync(filePath).size
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    }

    return { success: false, canceled: true }
  })

  // Handle file watching
  let fileWatcher = null
  
  ipcMain.handle('start-file-watch', (event, filePath) => {
    if (fileWatcher) {
      fileWatcher.close()
    }

    try {
      fileWatcher = fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            win.webContents.send('file-changed', {
              content: content,
              filePath: filePath
            })
          } catch (error) {
            win.webContents.send('file-watch-error', error.message)
          }
        }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('stop-file-watch', () => {
    if (fileWatcher) {
      fileWatcher.close()
      fileWatcher = null
    }
    return { success: true }
  })
}

app.whenReady().then(() => {
  createWindow()
})
