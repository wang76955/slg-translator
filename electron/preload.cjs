const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  selectDirectory: () => ipcRenderer.invoke("dialog:selectDirectory"),
  scanDirectory: (dirPath) => ipcRenderer.invoke("translate:scan", dirPath),
  runTranslation: (data) => ipcRenderer.invoke("translate:run", data),

  // 选择游戏 exe 程序 → 自动检测文本
  selectExe: () => ipcRenderer.invoke("game:selectExe"),
  resolveGameDir: (exePath) => ipcRenderer.invoke("game:resolveDir", exePath),
  findGameTexts: (gameDir) => ipcRenderer.invoke("game:findTexts", gameDir),
})
