import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db = null

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'slg-translator.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_path TEXT NOT NULL,
      source_lang TEXT NOT NULL DEFAULT 'zh',
      target_lang TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS glossary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS translation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      key_path TEXT NOT NULL,
      source_text TEXT NOT NULL,
      translated_text TEXT DEFAULT '',
      context TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, file_path, key_path)
    );

    CREATE TABLE IF NOT EXISTS project_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL UNIQUE,
      api_key TEXT DEFAULT '',
      model TEXT DEFAULT 'gpt-4o-mini',
      batch_size INTEGER DEFAULT 20,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `)
}

export function getDatabase() {
  if (!db) throw new Error('Database not initialized')
  return db
}
