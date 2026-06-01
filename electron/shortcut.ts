import * as fs from 'fs'
import * as path from 'path'

/**
 * 在游戏目录中自动检索 JSON 文本文件
 * 按常见 SLG 游戏目录模式搜索，深度限制 5 层
 */
export function findGameTextFiles(gameDir: string): {
  textDir: string
  files: string[]
}[] {
  const results: { textDir: string; files: string[] }[] = []

  const searchPatterns = [
    '',
    'localization',
    'localize',
    'locales',
    'lang',
    'data',
    'Resources',
    'assets',
    'www/data',
    'www/assets',
  ]

  for (const pattern of searchPatterns) {
    const searchDir = pattern
      ? path.join(gameDir, pattern)
      : gameDir

    if (!fs.existsSync(searchDir)) continue
    if (!fs.statSync(searchDir).isDirectory()) continue

    const jsonFiles = findJsonFilesRecursive(searchDir, 0, 5)
    if (jsonFiles.length > 0) {
      results.push({
        textDir: searchDir,
        files: jsonFiles,
      })
    }
  }

  return results
}

function findJsonFilesRecursive(dir: string, depth: number, maxDepth: number): string[] {
  if (depth > maxDepth) return []

  const files: string[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...findJsonFilesRecursive(fullPath, depth + 1, maxDepth))
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath)
      }
    }
  } catch {
    // 跳过无权限目录
  }
  return files
}
