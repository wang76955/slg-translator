const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  selectDirectory: () => ipcRenderer.invoke("dialog:selectDirectory"),
  scanDirectory: (dirPath) => ipcRenderer.invoke("translate:scan", dirPath),
  runTranslation: (data) => ipcRenderer.invoke("translate:run", data),
  selectShortcut: () => ipcRenderer.invoke("dialog:selectShortcut"),
  resolveShortcut: (lnkPath) => ipcRenderer.invoke("shortcut:resolve", lnkPath),
  findGameTexts: (gameDir) => ipcRenderer.invoke("shortcut:findTexts", gameDir),
})
