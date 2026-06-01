import * as fs from 'fs'
import * as path from 'path'
import type { ScanResult, TextItem, ProgressCallback } from './types'

/**
 * 扫描目录下所有 JSON 文件，递归提取可翻译文本
 * 平台无关：只需文件系统访问（fs）
 */
export function scanDirectory(dirPath: string, onProgress?: ProgressCallback): ScanResult[] {
  const results: ScanResult[] = []
  const files = findJsonFiles(dirPath)
  const total = files.length

  files.forEach((file, i) => {
    onProgress?.(i + 1, total, 'scanning')
    const content = fs.readFileSync(file, 'utf-8')
    const rawData = JSON.parse(content)
    const texts = extractTexts(rawData)
    results.push({
      filePath: file,
      relativePath: path.relative(dirPath, file),
      texts,
      rawData,
    })
  })

  return results
}

/**
 * 递归查找所有 JSON 文件
 */
function findJsonFiles(dirPath: string): string[] {
  const results: string[] = []
  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(fullPath)
      }
    }
  }
  scan(dirPath)
  return results
}

/**
 * 从 JSON 对象中递归提取所有字符串值
 * 自动过滤数字、URL、占位符
 */
export function extractTexts(obj: any, prefix = ''): TextItem[] {
  const texts: TextItem[] = []
  if (typeof obj === 'string') {
    if (/^\d+$/.test(obj)) return texts
    if (/^https?:\/\//.test(obj)) return texts
    if (/^\{[\w.]+\}$/.test(obj)) return texts
    if (/^%[\w.]+%$/.test(obj)) return texts
    texts.push({ keyPath: prefix, text: obj })
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => texts.push(...extractTexts(item, `${prefix}[${i}]`)))
  } else if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      texts.push(...extractTexts(obj[key], newPrefix))
    }
  }
  return texts
}

/**
 * 将翻译结果应用到原始 JSON，保持结构不变
 */
export function applyTranslations(obj: any, translations: Map<string, string>, prefix = ''): any {
  if (typeof obj === 'string') {
    return translations.get(prefix) ?? obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item, i) => applyTranslations(item, translations, `${prefix}[${i}]`))
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      result[key] = applyTranslations(obj[key], translations, newPrefix)
    }
    return result
  }
  return obj
}

/**
 * 写入翻译后的 JSON 文件，保持原始目录结构
 */
export function exportTranslatedFiles(
  results: ScanResult[],
  translationsMap: Map<string, Map<string, string>>,
  outputDir: string,
  onProgress?: ProgressCallback
): ExportResult[] {
  const exports: ExportResult[] = []
  const total = results.length

  results.forEach((result, i) => {
    onProgress?.(i + 1, total, 'exporting')
    const fileTranslations = translationsMap.get(result.filePath) ?? new Map()
    const translated = applyTranslations(result.rawData, fileTranslations)

    const outputPath = path.join(outputDir, result.relativePath)
    const outputDirPath = path.dirname(outputPath)
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true })
    }
    fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2), 'utf-8')
    exports.push({ filePath: outputPath, translated })
  })

  return exports
}
