import { create } from 'zustand'
import type { GlossaryEntry } from '../types'

interface GlossaryState {
  entries: GlossaryEntry[]
  loading: boolean
  loadEntries: (projectId: number) => Promise<void>
  addEntry: (data: any) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  importEntries: (projectId: number, entries: any[]) => Promise<number>
  exportEntries: (projectId: number) => Promise<GlossaryEntry[]>
}

export const useGlossaryStore = create<GlossaryState>((set, get) => ({
  entries: [],
  loading: false,

  loadEntries: async (projectId) => {
    set({ loading: true })
    try {
      const entries = await window.electronAPI.getGlossaryEntries(projectId)
      set({ entries })
    } finally {
      set({ loading: false })
    }
  },

  addEntry: async (data) => {
    await window.electronAPI.addGlossaryEntry(data)
    await get().loadEntries(data.projectId)
  },

  deleteEntry: async (id) => {
    await window.electronAPI.deleteGlossaryEntry(id)
  },

  importEntries: async (projectId, entries) => {
    const result = await window.electronAPI.importGlossary(projectId, entries)
    await get().loadEntries(projectId)
    return result.count
  },

  exportEntries: async (projectId) => {
    return await window.electronAPI.exportGlossary(projectId)
  },
}))
