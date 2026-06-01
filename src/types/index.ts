// 共享类型定义

export interface AiModel {
  id: string
  name: string
  supportsJsonMode: boolean
}

export interface AiProvider {
  id: string
  name: string
  baseURL: string
  models: AiModel[]
}

export interface GameInfo {
  exePath: string
  gameDir: string
  foundDirs: { textDir: string; fileCount: number }[]
  totalFiles: number
}

export interface ScanResult {
  files: { filePath: string; relativePath: string; textCount: number }[]
  totalTexts: number
}

export interface TranslateResult {
  success: boolean
  count: number
  outputDir: string
  error?: string
}

export interface ProgressState {
  current: number
  total: number
  phase: string
}
