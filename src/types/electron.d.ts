// Electron preload 暴露的 API 类型声明

interface ElectronAPI {
  selectDirectory: () => Promise<string | null>
  scanDirectory: (dirPath: string) => Promise<{
    files: { filePath: string; relativePath: string; textCount: number }[]
    totalTexts: number
  }>
  runTranslation: (data: {
    dirPath: string
    sourceLang: string
    targetLang: string
    apiKey: string
    baseURL: string
    model: string
    outputDir: string
    glossary?: { source: string; target: string }[]
  }) => Promise<{ success: boolean; count: number; outputDir: string; error?: string }>

  // 选择游戏 exe → 自动检测文本
  selectExe: () => Promise<string | null>
  resolveGameDir: (exePath: string) => Promise<{ gameDir: string | null; error?: string }>
  findGameTexts: (gameDir: string) => Promise<{
    textDirs: { textDir: string; fileCount: number }[]
    totalFiles: number
    error?: string
  }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
