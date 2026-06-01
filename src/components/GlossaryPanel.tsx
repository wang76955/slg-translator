import React, { useState, useRef } from 'react'
import { useGlossaryStore } from '../stores/glossaryStore'
import type { GlossaryEntry } from '../types'

interface Props {
  projectId: number
  entries: GlossaryEntry[]
}

const CATEGORIES = ['general', 'character', 'skill', 'item', 'location', 'quest']

const GlossaryPanel: React.FC<Props> = ({ projectId, entries }) => {
  const { addEntry, deleteEntry, importEntries, exportEntries } = useGlossaryStore()
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [category, setCategory] = useState('general')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleAdd = async () => {
    if (!sourceText.trim() || !targetText.trim()) return
    await addEntry({ projectId, sourceText, targetText, category, notes })
    setSourceText(''); setTargetText(''); setNotes('')
    showMsg('已添加术语')
  }

  const handleDelete = async (id: number) => {
    await deleteEntry(id)
    showMsg('已删除')
  }

  const handleExport = async () => {
    const data = await exportEntries(projectId)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'glossary.json'; a.click()
    URL.revokeObjectURL(url)
    showMsg('导出成功')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const count = await importEntries(projectId, data)
      showMsg(`成功导入 ${count} 条术语`)
    } catch {
      showMsg('导入失败，请检查文件格式')
    }
    e.target.value = ''
  }

  const filtered = entries.filter(e => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false
    if (searchQuery && !e.source_text.toLowerCase().includes(searchQuery.toLowerCase()) && !e.target_text.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, GlossaryEntry[]>)

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 shrink-0">
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索术语..." className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="all">全部分类</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800">导出</button>
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800">导入</button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <span className="text-xs text-slate-400">{entries.length} 条术语</span>
      </div>

      {message && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 border-b border-green-100">{message}</div>}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-slate-200 p-4 bg-white overflow-y-auto shrink-0">
          <h3 className="text-sm font-medium text-slate-700 mb-3">添加术语</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">原文</label>
              <input value={sourceText} onChange={e => setSourceText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500">译文</label>
              <input value={targetText} onChange={e => setTargetText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500">分类</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mt-1">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">备注</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button onClick={handleAdd} disabled={!sourceText.trim() || !targetText.trim()}
              className="w-full py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50">
              添加
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">暂无术语</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">{cat} ({items.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{item.source_text}</p>
                          <p className="text-sm text-slate-400">&rarr; {item.target_text}</p>
                          {item.notes && <p className="text-xs text-slate-300">{item.notes}</p>}
                        </div>
                        <button onClick={() => item.id && handleDelete(item.id)}
                          className="text-red-400 hover:text-red-600 text-xs">删除</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlossaryPanel
