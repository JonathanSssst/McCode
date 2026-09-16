const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')

const DIST = app.isPackaged
  ? path.join(process.resourcesPath, 'web', 'dist')
  : path.join(__dirname, '..', 'web', 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
      const target = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '')
      let filePath = path.join(DIST, target)
      if (!filePath.startsWith(DIST)) {
        res.statusCode = 403
        res.end('Forbidden')
        return
      }
      fs.readFile(filePath, (error, data) => {
        if (error) {
          fs.readFile(path.join(DIST, 'index.html'), (fallbackError, fallback) => {
            if (fallbackError) {
              res.statusCode = 404
              res.end('Not found')
              return
            }
            res.setHeader('Content-Type', MIME['.html'])
            res.end(fallback)
          })
          return
        }
        res.setHeader(
          'Content-Type',
          MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        )
        res.end(data)
      })
    })
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

let serverPort = null
let hasUnsaved = false
let watcher = null
let watchTimer = null

function startWatching(dir, webContents) {
  if (watcher) {
    try {
      watcher.close()
    } catch {
      // ignore
    }
    watcher = null
  }
  if (!dir) return
  let pending = new Set()
  const notify = (_eventType, filename) => {
    if (filename) pending.add(path.join(dir, filename))
    if (watchTimer) clearTimeout(watchTimer)
    watchTimer = setTimeout(() => {
      watchTimer = null
      const paths = [...pending]
      pending = new Set()
      if (!webContents.isDestroyed()) webContents.send('mccode:files-changed', paths)
    }, 300)
  }
  try {
    watcher = fs.watch(dir, { recursive: true }, notify)
  } catch (error) {
    console.error('[mccode] recursive watch failed, falling back', error)
    try {
      watcher = fs.watch(dir, notify)
    } catch (fallbackError) {
      console.error('[mccode] watch failed', fallbackError)
    }
  }
}

const storePath = (name) => path.join(app.getPath('userData'), name)

function readStore(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(storePath(name), 'utf8'))
  } catch {
    return fallback
  }
}

function writeStore(name, value) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    fs.writeFileSync(storePath(name), JSON.stringify(value))
  } catch {
    // ignore
  }
}

let recent = []
function loadRecent() {
  const value = readStore('recent.json', [])
  recent = Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}
function addRecent(dir) {
  recent = [dir, ...recent.filter((item) => item !== dir)].slice(0, 10)
  writeStore('recent.json', recent)
}

function registerIpc() {
  ipcMain.handle('mccode:openFolder', async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    addRecent(result.filePaths[0])
    startWatching(result.filePaths[0], event.sender)
    return { path: result.filePaths[0] }
  })
  ipcMain.handle('mccode:openFolderPath', async (event, dir) => {
    try {
      const stats = await fsp.stat(dir)
      if (!stats.isDirectory()) return null
    } catch {
      return null
    }
    addRecent(dir)
    startWatching(dir, event.sender)
    return { path: dir }
  })
  ipcMain.handle('mccode:getRecentFolders', () => recent)
  ipcMain.handle('mccode:readDir', async (_event, dirPath) => {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter((entry) => !['.git', 'node_modules', '.DS_Store', 'Thumbs.db'].includes(entry.name))
      .map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() }))
  })
  ipcMain.handle('mccode:readFile', async (_event, filePath) => {
    return fsp.readFile(filePath)
  })
  ipcMain.handle('mccode:writeFile', async (_event, filePath, data) => {
    await fsp.mkdir(path.dirname(filePath), { recursive: true })
    if (typeof data === 'string') await fsp.writeFile(filePath, data, 'utf8')
    else await fsp.writeFile(filePath, Buffer.from(data))
  })
  ipcMain.handle('mccode:mkdir', async (_event, dirPath) => {
    await fsp.mkdir(dirPath, { recursive: true })
  })
  ipcMain.handle('mccode:remove', async (_event, target, recursive) => {
    await fsp.rm(target, { recursive: Boolean(recursive), force: true })
  })
  ipcMain.handle('mccode:rename', async (_event, oldPath, newPath) => {
    await fsp.rename(oldPath, newPath)
  })
  ipcMain.handle('mccode:copy', async (_event, sourcePath, targetPath) => {
    await fsp.cp(sourcePath, targetPath, { recursive: true })
  })
  ipcMain.handle('mccode:stat', async (_event, target) => {
    const stats = await fsp.stat(target)
    return { isDirectory: stats.isDirectory(), isFile: stats.isFile() }
  })
  ipcMain.handle('mccode:reveal', async (_event, target) => {
    shell.showItemInFolder(target)
  })
  ipcMain.on('mccode:set-dirty', (_event, dirty) => {
    hasUnsaved = Boolean(dirty)
  })
  ipcMain.on('mccode:window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.on('mccode:window-toggle-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })
  ipcMain.on('mccode:window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.on('mccode:window-reload', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.webContents.reload()
  })
  ipcMain.on('mccode:window-toggle-devtools', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.webContents.toggleDevTools()
  })
  ipcMain.handle('mccode:window-is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })
}

async function createWindow() {
  if (serverPort === null) {
    serverPort = await startServer()
  }
  const saved = readStore('window.json', null)
  const window = new BrowserWindow({
    width: saved?.width ?? 1360,
    height: saved?.height ?? 860,
    x: typeof saved?.x === 'number' ? saved.x : undefined,
    y: typeof saved?.y === 'number' ? saved.y : undefined,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  if (saved?.maximized) window.maximize()
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('did-finish-load', () => {
    console.log(`[mccode] renderer loaded from http://127.0.0.1:${serverPort}/`)
  })
  window.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('[mccode] load failed', code, description)
  })
  window.on('maximize', () => window.webContents.send('mccode:window-maximized', true))
  window.on('unmaximize', () => window.webContents.send('mccode:window-maximized', false))
  let stateTimer = null
  const persistState = () => {
    if (stateTimer) clearTimeout(stateTimer)
    stateTimer = setTimeout(() => {
      stateTimer = null
      if (window.isDestroyed()) return
      writeStore('window.json', {
        ...window.getBounds(),
        maximized: window.isMaximized(),
      })
    }, 400)
  }
  window.on('resize', persistState)
  window.on('move', persistState)
  window.on('maximize', persistState)
  window.on('unmaximize', persistState)
  window.on('close', (event) => {
    if (!hasUnsaved) return
    event.preventDefault()
    dialog
      .showMessageBox(window, {
        type: 'warning',
        buttons: ['取消', '退出'],
        defaultId: 0,
        cancelId: 0,
        message: '有未保存的更改',
        detail: '确定要退出吗？未保存的更改将会丢失。',
      })
      .then(({ response }) => {
        if (response === 1) {
          hasUnsaved = false
          window.destroy()
        }
      })
  })
  window.on('closed', () => {
    if (watcher) {
      try {
        watcher.close()
      } catch {
        // ignore
      }
      watcher = null
    }
  })
  await window.loadURL(`http://127.0.0.1:${serverPort}/`)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const existing = BrowserWindow.getAllWindows()[0]
    if (existing) {
      if (existing.isMinimized()) existing.restore()
      existing.focus()
    }
  })

  app
    .whenReady()
    .then(() => {
      loadRecent()
      registerIpc()
      return createWindow()
    })
    .catch((error) => {
      console.error('[mccode] failed to start:', error)
      app.quit()
    })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow()
})
