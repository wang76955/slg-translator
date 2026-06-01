import { ipcMain, dialog } from 'electron'
import { scanDirectory, exportTranslatedFiles } from '../core/scanner'
import { translateBatch } from '../core/translator'
import { resolveGameDir, findGameTextFiles } from './shortcut'
import type { ScanResult, GlossaryEntry } from '../core/types'

/**
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
  console.log("[SLG] registerIpcHandlers called")

  // ===== 目录选择 =====
  ipcMain.handle('dialog:selectDirectory', async () => {
    console.log("[SLG] dialog:selectDirectory handler invoked")
    try {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      console.log("[SLG] dialog result:", result)
      return result.canceled ? null : result.filePaths[0]
    } catch (err) {
      console.error("[SLG] dialog error:", err)
      return null
    }
  })

  // ===== 快捷方式选择 =====
  ipcMain.handle('dialog:selectShortcut', async () => {
    console.log("[SLG] dialog:selectShortcut handler invoked")
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: '快捷方式', extensions: ['lnk'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })
      console.log("[SLG] shortcut dialog result:", result)
      return result.canceled ? null : result.filePaths[0]
    } catch (err) {
      console.error("[SLG] shortcut dialog error:", err)
      return null
    }
  })

  // ===== 解析快捷方式 =====
  ipcMain.handle('shortcut:resolve', async (_, lnkPath: string): Promise<{
    gameDir: string | null
    error?: string
  }> => {
    try {
      const gameDir = resolveGameDir(lnkPath)
      return { gameDir }
    } catch (err: any) {
      return { gameDir: null, error: err.message }
    }
  })

  // ===== 自动检索文本 =====
  ipcMain.handle('shortcut:findTexts', async (_, gameDir: string): Promise<{
    textDirs: { textDir: string; fileCount: number }[]
    totalFiles: number
    error?: string
  }> => {
    try {
      const found = findGameTextFiles(gameDir)
      return {
        textDirs: found.map(f => ({ textDir: f.textDir, fileCount: f.files.length })),
        totalFiles: found.reduce((sum, f) => sum + f.files.length, 0),
      }
    } catch (err: any) {
      return { textDirs: [], totalFiles: 0, error: err.message }
    }
  })

  // ===== 扫描目录 =====
  ipcMain.handle('translate:scan', async (_, dirPath: string): Promise<{
    files: { filePath: string; relativePath: string; textCount: number }[]
    totalTexts: number
  }> => {
    const results = scanDirectory(dirPath)
    return {
      files: results.map(r => ({
        filePath: r.filePath,
        relativePath: r.relativePath,
        textCount: r.texts.length,
      })),
      totalTexts: results.reduce((sum, r) => sum + r.texts.length, 0),
    }
  })

  // ===== 执行翻译 =====
  ipcMain.handle('translate:run', async (_, data: {
    dirPath: string
    sourceLang: string
    targetLang: string
    apiKey: string
    baseURL: string
    model: string
    outputDir: string
    glossary?: GlossaryEntry[]
  }): Promise<{ success: boolean; count: number; outputDir: string; error?: string }> => {
    try {
      const results = scanDirectory(data.dirPath)
      const allTranslations = new Map<string, Map<string, string>>()

      for (const result of results) {
        const { translations } = await translateBatch({
          texts: result.texts,
          sourceLang: data.sourceLang,
          targetLang: data.targetLang,
          baseURL: data.baseURL,
          apiKey: data.apiKey,
          model: data.model,
          glossary: data.glossary,
        })
        allTranslations.set(result.filePath, translations)
      }

      exportTranslatedFiles(results, allTranslations, data.outputDir)

      const translatedCount = Array.from(allTranslations.values())
        .reduce((sum, m) => sum + m.size, 0)

      return { success: true, count: translatedCount, outputDir: data.outputDir }
    } catch (err: any) {
      return { success: false, count: 0, outputDir: data.outputDir, error: err.message }
    }
  })
}
