export interface Project {
  id: number
  name: string
  source_path: string
  source_lang: string
  target_lang: string
  created_at: string
  updated_at: string
}

export interface JsonFile {
  filePath: string
  relativePath: string
  size: number
}

export interface TextEntry {
  keyPath: string
  text: string
  context: string
}

export interface TranslationRecord {
  id: number
  project_id: number
  file_path: string
  key_path: string
  source_text: string
  translated_text: string
  context: string
  status: 'pending' | 'translated'
  updated_at: string
}

export interface GlossaryEntry {
  id?: number
  project_id: number
  source_text: string
  target_text: string
  category: string
  notes: string
  created_at?: string
}

export interface ProjectSettings {
  id?: number
  project_id: number
  api_key: string
  model: string
  batch_size: number
}

declare global {
  interface Window {
    electronAPI: {
      createProject: (data: any) => Promise<{ id: number }>
      getProjects: () => Promise<Project[]>
      getProject: (id: number) => Promise<Project>
      deleteProject: (id: number) => Promise<{ success: boolean }>
      updateProject: (id: number, data: any) => Promise<{ success: boolean }>
      scanJsonFiles: (dirPath: string) => Promise<JsonFile[]>
      parseJsonFile: (filePath: string) => Promise<{ texts: TextEntry[]; rawData: any }>
      translateBatch: (data: any) => Promise<{ success: boolean; count?: number; error?: string }>
      saveTranslation: (data: any) => Promise<{ id: number }>
      getTranslations: (projectId: number, filePath: string) => Promise<TranslationRecord[]>
      updateTranslation: (id: number, text: string) => Promise<{ success: boolean }>
      exportTranslations: (projectId: number) => Promise<{ success: boolean; data?: any; error?: string; sourcePath?: string }>
      addGlossaryEntry: (data: any) => Promise<{ id: number }>
      getGlossaryEntries: (projectId: number) => Promise<GlossaryEntry[]>
      deleteGlossaryEntry: (id: number) => Promise<{ success: boolean }>
      importGlossary: (projectId: number, entries: any[]) => Promise<{ success: boolean; count: number }>
      exportGlossary: (projectId: number) => Promise<GlossaryEntry[]>
      getSettings: (projectId: number) => Promise<ProjectSettings>
      saveSettings: (projectId: number, data: any) => Promise<{ success: boolean }>
      selectDirectory: () => Promise<string | null>
      selectFile: () => Promise<string | null>
    }
  }
}

export {}
