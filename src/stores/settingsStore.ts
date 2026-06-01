import { create } from 'zustand'
import type { ProjectSettings } from '../types'

interface SettingsState {
  settings: ProjectSettings | null
  loading: boolean
  loadSettings: (projectId: number) => Promise<void>
  saveSettings: (projectId: number, data: Partial<ProjectSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,

  loadSettings: async (projectId) => {
    set({ loading: true })
    try {
      const settings = await window.electronAPI.getSettings(projectId)
      set({ settings })
    } finally {
      set({ loading: false })
    }
  },

  saveSettings: async (projectId, data) => {
    await window.electronAPI.saveSettings(projectId, data)
    await get().loadSettings(projectId)
  },
}))
