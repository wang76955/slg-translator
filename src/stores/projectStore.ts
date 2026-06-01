import { create } from 'zustand'
import type { Project, JsonFile, TextEntry } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  jsonFiles: JsonFile[]
  selectedFile: string | null
  fileTexts: TextEntry[]
  loading: boolean

  loadProjects: () => Promise<void>
  createProject: (data: any) => Promise<number>
  selectProject: (project: Project) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  scanFiles: (dirPath: string) => Promise<void>
  selectFile: (filePath: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  jsonFiles: [],
  selectedFile: null,
  fileTexts: [],
  loading: false,

  loadProjects: async () => {
    const projects = await window.electronAPI.getProjects()
    set({ projects })
  },

  createProject: async (data) => {
    const result = await window.electronAPI.createProject(data)
    await get().loadProjects()
    return result.id
  },

  selectProject: async (project) => {
    set({ currentProject: project, jsonFiles: [], selectedFile: null, fileTexts: [] })
    await get().scanFiles(project.source_path)
  },

  deleteProject: async (id) => {
    await window.electronAPI.deleteProject(id)
    if (get().currentProject?.id === id) {
      set({ currentProject: null, jsonFiles: [], selectedFile: null, fileTexts: [] })
    }
    await get().loadProjects()
  },

  scanFiles: async (dirPath) => {
    set({ loading: true })
    try {
      const files = await window.electronAPI.scanJsonFiles(dirPath)
      set({ jsonFiles: files })
    } finally {
      set({ loading: false })
    }
  },

  selectFile: async (filePath) => {
    set({ loading: true, selectedFile: filePath })
    try {
      const result = await window.electronAPI.parseJsonFile(filePath)
      // 加载已有翻译
      const project = get().currentProject
      if (project) {
        const translations = await window.electronAPI.getTranslations(project.id, filePath)
        // 合并已有翻译到 texts
        const textsWithTranslations = result.texts.map(t => {
          const existing = translations.find(r => r.key_path === t.keyPath)
          return { ...t, translatedText: existing?.translated_text || '' }
        })
        set({ fileTexts: textsWithTranslations })
      } else {
        set({ fileTexts: result.texts })
      }
    } finally {
      set({ loading: false })
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project, jsonFiles: [], selectedFile: null, fileTexts: [] })
  },
}))
