import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

  scanDirectory: (dirPath: string) =>
    ipcRenderer.invoke('translate:scan', dirPath),

  runTranslation: (data: {
    dirPath: string
    sourceLang: string
    targetLang: string
    apiKey: string
    baseURL: string
    model: string
    outputDir: string
    glossary?: { source: string; target: string }[]
  }) => ipcRenderer.invoke('translate:run', data),
})

export {}
