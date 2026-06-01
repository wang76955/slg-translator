import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 项目管理
  createProject: (data: any) => ipcRenderer.invoke('project:create', data),
  getProjects: () => ipcRenderer.invoke('project:getAll'),
  getProject: (id: number) => ipcRenderer.invoke('project:get', id),
  deleteProject: (id: number) => ipcRenderer.invoke('project:delete', id),
  updateProject: (id: number, data: any) => ipcRenderer.invoke('project:update', id, data),

  // JSON 扫描
  scanJsonFiles: (dirPath: string) => ipcRenderer.invoke('json:scan', dirPath),
  parseJsonFile: (filePath: string) => ipcRenderer.invoke('json:parse', filePath),

  // 翻译
  translateBatch: (data: any) => ipcRenderer.invoke('translate:batch', data),
  saveTranslation: (data: any) => ipcRenderer.invoke('translate:save', data),
  getTranslations: (projectId: number, filePath: string) => ipcRenderer.invoke('translate:getAll', projectId, filePath),
  updateTranslation: (id: number, text: string) => ipcRenderer.invoke('translate:update', id, text),
  exportTranslations: (projectId: number) => ipcRenderer.invoke('translate:export', projectId),

  // 术语表
  addGlossaryEntry: (data: any) => ipcRenderer.invoke('glossary:add', data),
  getGlossaryEntries: (projectId: number) => ipcRenderer.invoke('glossary:getAll', projectId),
  deleteGlossaryEntry: (id: number) => ipcRenderer.invoke('glossary:delete', id),
  importGlossary: (projectId: number, entries: any[]) => ipcRenderer.invoke('glossary:import', projectId, entries),
  exportGlossary: (projectId: number) => ipcRenderer.invoke('glossary:export', projectId),

  // 设置
  getSettings: (projectId: number) => ipcRenderer.invoke('settings:get', projectId),
  saveSettings: (projectId: number, data: any) => ipcRenderer.invoke('settings:save', projectId, data),

  // 文件对话框
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
})

export {}
