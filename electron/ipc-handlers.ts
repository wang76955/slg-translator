import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { getDatabase } from './database'
import util from 'util'

const execFileAsync = util.promisify(execFile)

export function registerIpcHandlers(): void {
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('project:create', (_, data) => {
    const db = getDatabase()
    const stmt = db.prepare('INSERT INTO projects (name, source_path, source_lang, target_lang) VALUES (?, ?, ?, ?)')
    const info = stmt.run(data.name, data.sourcePath, data.sourceLang || 'zh', data.targetLang || 'en')
    db.prepare('INSERT INTO project_settings (project_id) VALUES (?)').run(info.lastInsertRowid)
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('project:getAll', () => {
    return getDatabase().prepare('SELECT * FROM projects ORDER BY updated_at DESC').all()
  })

  ipcMain.handle('project:get', (_, id) => {
    return getDatabase().prepare('SELECT * FROM projects WHERE id = ?').get(id)
  })

  ipcMain.handle('project:delete', (_, id) => {
    getDatabase().prepare('DELETE FROM projects WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('project:update', (_, id, data) => {
    getDatabase().prepare("UPDATE projects SET name = ?, source_path = ?, source_lang = ?, target_lang = ?, updated_at = datetime('now') WHERE id = ?")
      .run(data.name, data.sourcePath, data.sourceLang, data.targetLang, id)
    return { success: true }
  })

  ipcMain.handle('json:scan', (_, dirPath) => {
    const results = []
    function scan(dir, baseDir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scan(fullPath, baseDir)
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          const stat = fs.statSync(fullPath)
          results.push({
            filePath: fullPath,
            relativePath: path.relative(baseDir, fullPath),
            size: stat.size
          })
        }
      }
    }
    scan(dirPath, dirPath)
    return results
  })

  ipcMain.handle('json:parse', (_, filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)
    const texts = []

    function extract(obj, prefix) {
      if (typeof obj === 'string') {
        if (/^\d+$/.test(obj)) return
        if (/^https?:\/\//.test(obj)) return
        if (/^\{[\w.]+\}$/.test(obj)) return
        texts.push({ keyPath: prefix, text: obj, context: prefix })
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => extract(item, prefix + '[' + i + ']'))
      } else if (obj !== null && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          extract(obj[key], prefix ? prefix + '.' + key : key)
        }
      }
    }

    extract(data, '')
    return { texts, rawData: data }
  })

  ipcMain.handle('translate:save', (_, data) => {
    const db = getDatabase()
    const existing = db.prepare('SELECT id FROM translation_records WHERE project_id = ? AND file_path = ? AND key_path = ?')
      .get(data.projectId, data.filePath, data.keyPath)
    if (existing) {
      db.prepare("UPDATE translation_records SET updated_at = datetime('now') WHERE id = ?").run(existing.id)
      return { id: existing.id }
    }
    const info = db.prepare('INSERT OR IGNORE INTO translation_records (project_id, file_path, key_path, source_text, context) VALUES (?, ?, ?, ?, ?)')
      .run(data.projectId, data.filePath, data.keyPath, data.sourceText, data.context)
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('translate:getAll', (_, projectId, filePath) => {
    return getDatabase().prepare('SELECT * FROM translation_records WHERE project_id = ? AND file_path = ? ORDER BY key_path').all(projectId, filePath)
  })

  ipcMain.handle('translate:update', (_, id, text) => {
    getDatabase().prepare("UPDATE translation_records SET translated_text = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(text, text ? 'translated' : 'pending', id)
    return { success: true }
  })

  ipcMain.handle('translate:batch', async (_, data) => {
    const pythonPath = path.join(__dirname, '../python/translator.py')
    const input = JSON.stringify({
      texts: data.texts,
      source_lang: data.sourceLang,
      target_lang: data.targetLang,
      glossary: data.glossary,
      api_key: data.apiKey,
      model: data.model
    })
    try {
      const { stdout } = await execFileAsync('python', [pythonPath, input])
      const result = JSON.parse(stdout)
      if (result.error) throw new Error(result.error)
      const db = getDatabase()
      const upsert = db.prepare('INSERT INTO translation_records (project_id, file_path, key_path, source_text, translated_text, status, context) VALUES (?, ?, ?, ?, ?, ' + "'translated'" + ', ?) ON CONFLICT(project_id, file_path, key_path) DO UPDATE SET translated_text = excluded.translated_text, status = ' + "'translated'" + ', updated_at = datetime(' + "'now'" + ')')
      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          upsert.run(data.projectId, data.filePath, row.keyPath, row.sourceText, row.translatedText, row.keyPath)
        }
      })
      insertMany(result.translations)
      return { success: true, count: result.translations.length }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('translate:export', (_, projectId) => {
    const db = getDatabase()
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
    if (!project) return { success: false, error: 'Project not found' }

    const records = db.prepare('SELECT DISTINCT file_path FROM translation_records WHERE project_id = ?').all(projectId)
    const result = {}

    for (const record of records) {
      const filePath = record.file_path
      const translations = db.prepare("SELECT * FROM translation_records WHERE project_id = ? AND file_path = ? AND status = 'translated'").all(projectId, filePath)
      const rawContent = fs.readFileSync(filePath, 'utf-8')
      const rawData = JSON.parse(rawContent)

      function applyTranslations(obj, prefix) {
        if (typeof obj === 'string') {
          const trans = translations.find(t => t.key_path === prefix)
          return trans ? trans.translated_text : obj
        } else if (Array.isArray(obj)) {
          return obj.map((item, i) => applyTranslations(item, prefix + '[' + i + ']'))
        } else if (obj !== null && typeof obj === 'object') {
          const newObj = {}
          for (const key of Object.keys(obj)) {
            newObj[key] = applyTranslations(obj[key], prefix ? prefix + '.' + key : key)
          }
          return newObj
        }
        return obj
      }

      const translatedData = applyTranslations(rawData, '')
      const relativePath = path.relative(project.source_path, filePath)
      result[relativePath] = { original: rawData, translated: translatedData }
    }
    return { success: true, data: result, sourcePath: project.source_path }
  })

  ipcMain.handle('glossary:add', (_, data) => {
    const db = getDatabase()
    const info = db.prepare('INSERT INTO glossary_entries (project_id, source_text, target_text, category, notes) VALUES (?, ?, ?, ?, ?)')
      .run(data.projectId, data.sourceText, data.targetText, data.category || 'general', data.notes || '')
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('glossary:getAll', (_, projectId) => {
    return getDatabase().prepare('SELECT * FROM glossary_entries WHERE project_id = ? ORDER BY category, source_text').all(projectId)
  })

  ipcMain.handle('glossary:delete', (_, id) => {
    getDatabase().prepare('DELETE FROM glossary_entries WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('glossary:import', (_, projectId, entries) => {
    const db = getDatabase()
    const stmt = db.prepare('INSERT INTO glossary_entries (project_id, source_text, target_text, category, notes) VALUES (?, ?, ?, ?, ?)')
    const importMany = db.transaction((rows) => {
      for (const row of rows) {
        stmt.run(projectId, row.source_text || row.source, row.target_text || row.target, row.category || 'general', row.notes || '')
      }
    })
    importMany(entries)
    return { success: true, count: entries.length }
  })

  ipcMain.handle('glossary:export', (_, projectId) => {
    return getDatabase().prepare('SELECT source_text, target_text, category, notes FROM glossary_entries WHERE project_id = ?').all(projectId)
  })

  ipcMain.handle('settings:get', (_, projectId) => {
    return getDatabase().prepare('SELECT * FROM project_settings WHERE project_id = ?').get(projectId)
  })

  ipcMain.handle('settings:save', (_, projectId, data) => {
    const db = getDatabase()
    const existing = db.prepare('SELECT id FROM project_settings WHERE project_id = ?').get(projectId)
    if (existing) {
      db.prepare('UPDATE project_settings SET api_key = ?, model = ?, batch_size = ? WHERE project_id = ?')
        .run(data.apiKey || '', data.model || 'gpt-4o-mini', data.batchSize || 20, projectId)
    } else {
      db.prepare('INSERT INTO project_settings (project_id, api_key, model, batch_size) VALUES (?, ?, ?, ?)')
        .run(projectId, data.apiKey || '', data.model || 'gpt-4o-mini', data.batchSize || 20)
    }
    return { success: true }
  })
}
