import { ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { scanDirectory, exportTranslatedFiles } from '../core/scanner'
import { translateBatch } from '../core/translator'
import { findGameTextFiles } from './shortcut'
import type { GlossaryEntry } from '../core/types'

export function registerIpcHandlers(): void {
  // ===== 选择游戏目录 =====
  ipcMain.handle('dialog:selectDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      return result.canceled ? null : result.filePaths[0]
    } catch {
      return null
    }
  })

  // ===== 选择游戏 .exe 主程序 =====
  ipcMain.handle('game:selectExe', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: '应用程序', extensions: ['exe'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })
      return result.canceled ? null : result.filePaths[0]
    } catch {
      return null
    }
  })

  // ===== 从 exe 路径获取游戏安装目录 =====
  ipcMain.handle('game:resolveDir', async (_, exePath: string): Promise<{
    gameDir: string | null
    error?: string
  }> => {
    try {
      if (!fs.existsSync(exePath)) return { gameDir: null, error: '文件不存在' }
      const dir = fs.statSync(exePath).isFile()
        ? path.dirname(exePath)
        : exePath
      return { gameDir: dir }
    } catch (err: any) {
      return { gameDir: null, error: err.message }
    }
  })

  // ===== 在游戏目录中自动检索 JSON 文本文件 =====
  ipcMain.handle('game:findTexts', async (_, gameDir: string): Promise<{
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

  // ===== 扫描目录下的 JSON 文件 =====
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
