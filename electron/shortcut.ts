import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 解析 Windows .lnk 快捷方式，返回目标路径
 * 通过 PowerShell COM 对象实现，无需额外依赖
 * 使用 -EncodedCommand 避免参数传递和引号问题
 */
export function resolveShortcut(lnkPath: string): string | null {
  try {
    const escapedPath = lnkPath.replace(/'/g, "''")
    const psScript = [
      `$path = '${escapedPath}'`,
      '$shell = New-Object -ComObject WScript.Shell',
      '$sc = $shell.CreateShortcut($path)',
      'Write-Output $sc.TargetPath',
    ].join('; ')

    // PowerShell -EncodedCommand 需要 UTF16-LE 编码
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64')

    const result = execFileSync('powershell', [
      '-NoProfile', '-NonInteractive',
      '-EncodedCommand', encoded,
    ], { encoding: 'utf-8', timeout: 5000 })

    const target = result.trim().split(/\r?\n/)[0]?.trim()
    return target && fs.existsSync(target) ? target : null
  } catch {
    return null
  }
}

/**
 * 从快捷方式中解析出游戏安装目录
 * 对于 exe 路径，取所在目录作为游戏根目录
 */
export function resolveGameDir(lnkPath: string): string | null {
  const exePath = resolveShortcut(lnkPath)
  if (!exePath) return null

  const dir = fs.statSync(exePath).isFile()
    ? path.dirname(exePath)
    : exePath

  return dir
}

/**
 * 在游戏目录中自动检索 JSON 文本文件
 * 深度限制为 5 层，避免扫描过深
 */
export function findGameTextFiles(gameDir: string): {
  textDir: string
  files: string[]
}[] {
  const results: { textDir: string; files: string[] }[] = []

  // 常见 SLG 游戏文本目录模式
  const searchPatterns = [
    '',                          // 根目录
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

/**
 * 递归查找 JSON 文件，有深度限制
 */
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
    // 跳过无权限的目录
  }
  return files
}
