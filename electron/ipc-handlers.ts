import { ipcMain, dialog } from 'electron'
import { scanDirectory, exportTranslatedFiles } from '../core/scanner'
import { translateBatch } from '../core/translator'
import type { ScanResult, GlossaryEntry } from '../core/types'

/**
 * 简化的 IPC 处理器 — 只保留核心功能
 */
export function registerIpcHandlers(): void {
  // 选择目录
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  // 扫描目录下的 JSON 文件，提取文本
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

  // 执行翻译：扫描 → 翻译 → 导出，一站式完成
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
      // 1. 扫描
      const results = scanDirectory(data.dirPath)

      // 2. 收集所有文本
      const allTexts = results.flatMap(r => r.texts.map(t => ({ ...t, filePath: r.filePath })))

      // 3. 逐文件翻译
      const scanResultsMap = new Map<string, ScanResult>()
      for (const r of results) {
        scanResultsMap.set(r.filePath, r)
      }

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

      // 4. 导出
      exportTranslatedFiles(results, allTranslations, data.outputDir)

      const totalCount = allTexts.length
      const translatedCount = Array.from(allTranslations.values())
        .reduce((sum, m) => sum + m.size, 0)

      return { success: true, count: translatedCount, outputDir: data.outputDir }
    } catch (err: any) {
      return { success: false, count: 0, outputDir: data.outputDir, error: err.message }
    }
  })
}
