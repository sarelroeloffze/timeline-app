/**
 * Timeline App — Electron preload script
 * Exposes safe IPC bridges to the renderer (index.html).
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey:          ()                                => ipcRenderer.invoke('get-api-key'),
  setApiKey:          (key)                             => ipcRenderer.invoke('set-api-key', key),
  showOpenDialog:     (options)                         => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog:     (options)                         => ipcRenderer.invoke('show-save-dialog', options),
  chooseBackupFolder: ()                                => ipcRenderer.invoke('choose-backup-folder'),
  writeBackupFile:    (folder, filename, json)          => ipcRenderer.invoke('write-backup-file', folder, filename, json),
  listBackupFiles:    (folder, timelineName)            => ipcRenderer.invoke('list-backup-files', folder, timelineName),
  deleteBackupFiles:  (filePaths)                       => ipcRenderer.invoke('delete-backup-files', filePaths),
  isElectron:         true,
});
