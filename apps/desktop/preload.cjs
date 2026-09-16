const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('mccodeDesktop', {
  openFolder: () => ipcRenderer.invoke('mccode:openFolder'),
  openFolderPath: (dirPath) => ipcRenderer.invoke('mccode:openFolderPath', dirPath),
  getRecentFolders: () => ipcRenderer.invoke('mccode:getRecentFolders'),
  readDir: (dirPath) => ipcRenderer.invoke('mccode:readDir', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('mccode:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('mccode:writeFile', filePath, data),
  mkdir: (dirPath) => ipcRenderer.invoke('mccode:mkdir', dirPath),
  remove: (target, recursive) => ipcRenderer.invoke('mccode:remove', target, recursive),
  rename: (oldPath, newPath) => ipcRenderer.invoke('mccode:rename', oldPath, newPath),
  copy: (sourcePath, targetPath) => ipcRenderer.invoke('mccode:copy', sourcePath, targetPath),
  stat: (target) => ipcRenderer.invoke('mccode:stat', target),
  reveal: (target) => ipcRenderer.invoke('mccode:reveal', target),
  setDirty: (dirty) => ipcRenderer.send('mccode:set-dirty', Boolean(dirty)),
  windowMinimize: () => ipcRenderer.send('mccode:window-minimize'),
  windowToggleMaximize: () => ipcRenderer.send('mccode:window-toggle-maximize'),
  windowClose: () => ipcRenderer.send('mccode:window-close'),
  windowReload: () => ipcRenderer.send('mccode:window-reload'),
  windowToggleDevTools: () => ipcRenderer.send('mccode:window-toggle-devtools'),
  windowIsMaximized: () => ipcRenderer.invoke('mccode:window-is-maximized'),
  onWindowMaximized: (callback) => {
    const listener = (_event, value) => callback(Boolean(value))
    ipcRenderer.on('mccode:window-maximized', listener)
    return () => ipcRenderer.removeListener('mccode:window-maximized', listener)
  },
  onFilesChanged: (callback) => {
    const listener = (_event, paths) => callback(Array.isArray(paths) ? paths : [])
    ipcRenderer.on('mccode:files-changed', listener)
    return () => ipcRenderer.removeListener('mccode:files-changed', listener)
  },
})
