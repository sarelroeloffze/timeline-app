/**
 * Timeline App — Electron preload script
 * Exposes safe IPC bridges to the renderer (index.html).
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey:       ()          => ipcRenderer.invoke('get-api-key'),
  setApiKey:       (key)       => ipcRenderer.invoke('set-api-key', key),
  showOpenDialog:  (options)   => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog:  (options)   => ipcRenderer.invoke('show-save-dialog', options),
  isElectron:      true,
});
