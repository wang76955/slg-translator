import React, { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'

interface Props {
  project: any
  filePath: string | null
  texts: any[]
  glossary: any[]
  settings: any | null
}

const TranslationEditor: React.FC<Props> = ({ project, filePath, texts, glossary, settings }) => {
  const { selectFile } = useProjectStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [translating, setTranslating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'untranslated' | 'translated'>('all')
  const [message, setMessage] = useState('')

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const filteredTexts = texts.filter(t => {
    if (filterMode === 'untranslated' && t.translatedText) return false
    if (filterMode === 'translated' && !t.translatedText) return false
    if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase()) && !t.keyPath.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const startEdit = (keyPath: string, currentText: string) => {
    setEditingId(keyPath)
    setEditValue(currentText)
  }

  const saveEdit = async () => {
    if (!editingId || !filePath) return
    const record = texts.find(t => t.keyPath === editingId)
    if (!record) return

    await window.electronAPI.saveTranslation({
      projectId: project.id,
      filePath,
      keyPath: editingId,
      sourceText: record.text,
      context: record.keyPath
    })
    const records = await window.electronAPI.getTranslations(project.id, filePath)
    const found = records.find(r => r.key_path === editingId)
    if (found) {
      await window.electronAPI.updateTranslation(found.id, editValue)
    }
    setEditingId(null)
    if (filePath) selectFile(filePath)
    showMsg('保存成功')
  }

  const handleBatchTranslate = async () => {
    if (!filePath || !settings) return
    const untranslated = texts.filter(t => !t.translatedText)
    if (untranslated.length === 0) { showMsg('没有需要翻译的文本'); return }
    if (!settings.api_key) { showMsg('请先在设置中填写 OpenAI API Key'); return }

    setTranslating(true)
    try {
      const result = await window.electronAPI.translateBatch({
        projectId: project.id,
        filePath,
        texts: untranslated.map(t => ({ keyPath: t.keyPath, text: t.text })),
        sourceLang: project.source_lang,
        targetLang: project.target_lang,
        glossary: glossary.map(g => ({ source: g.source_text, target: g.target_text })),
        apiKey: settings.api_key,
        model: settings.model || 'gpt-4o-mini'
      })
      if (result.success) {
        showMsg('翻译完成！共 ' + result.count + ' 条')
        selectFile(filePath)
      } else {
        showMsg('翻译失败: ' + result.error)
      }
    } catch (err: any) {
      showMsg('错误: ' + err.message)
    } finally {
      setTranslating(false)
    }
  }

  const handleExport = async () => {
    const result = await window.electronAPI.exportTranslations(project.id)
    if (result.success) {
      showMsg('导出成功！文件已生成')
    } else {
      showMsg('导出失败: ' + result.error)
    }
  }

  if (!filePath) {
    return (
      <div className='flex items-center justify-center h-full text-slate-400'>
        <div className='text-center'>
          <p className='text-4xl mb-3'>📂</p>
          <p>请从左侧选择一个 JSON 文件</p>
        </div>
      </div>
    )
  }

  const totalCount = texts.length
  const translatedCount = texts.filter(t => t.translatedText).length

  return (
    <div className='h-full flex flex-col'>
      <div className='bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 shrink-0'>
        <div className='flex-1 flex items-center gap-2'>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder='搜索文本...' className='px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400' />
          <div className='flex bg-slate-100 rounded-lg text-xs'>
            {(['all', 'untranslated', 'translated'] as const).map(m => (
              <button key={m} onClick={() => setFilterMode(m)}
                className={'px-3 py-1.5 rounded ' + (filterMode === m ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500')}>
                {m === 'all' ? '全部' : m === 'untranslated' ? '未翻译' : '已翻译'}
              </button>
            ))}
          </div>
        </div>
        <span className='text-xs text-slate-400'>{filteredTexts.length} / {totalCount} 条</span>
        <div className='w-48 h-2 bg-slate-100 rounded-full overflow-hidden'>
          <div className='h-full bg-green-400 rounded-full transition-all' style={{width: (totalCount > 0 ? (translatedCount/totalCount*100) : 0) + '%'}} />
        </div>
        <button onClick={handleBatchTranslate} disabled={translating}
          className='px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50'>
          {translating ? '翻译中...' : 'AI 批量翻译'}
        </button>
        <button onClick={handleExport} className='px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600'>
          导出
        </button>
      </div>

      {message && (
        <div className='bg-blue-50 text-blue-700 text-sm px-4 py-2 border-b border-blue-100'>{message}</div>
      )}

      <div className='flex-1 overflow-y-auto'>
        {filteredTexts.length === 0 ? (
          <div className='flex items-center justify-center h-full text-slate-400 text-sm'>
            {searchQuery ? '没有匹配的文本' : '暂无翻译条目'}
          </div>
        ) : (
          <div className='divide-y divide-slate-100'>
            {filteredTexts.map((entry) => (
              <div key={entry.keyPath} className='px-4 py-3 hover:bg-slate-50 transition-colors'>
                <div className='flex items-start gap-4'>
                  <div className='w-1/4 shrink-0'>
                    <p className='text-xs text-slate-400 font-mono truncate' title={entry.keyPath}>{entry.keyPath}</p>
                  </div>
                  <div className='w-1/3'>
                    <p className='text-sm text-slate-700'>{entry.text}</p>
                  </div>
                  <div className='w-1/3'>
                    {editingId === entry.keyPath ? (
                      <div className='flex gap-1'>
                        <textarea value={editValue} onChange={e => setEditValue(e.target.value)}
                          className='flex-1 px-2 py-1 border border-blue-300 rounded text-sm resize-none h-10 focus:outline-none focus:ring-2 focus:ring-blue-400' />
                        <div className='flex flex-col gap-1'>
                          <button onClick={saveEdit} className='px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600'>✓</button>
                          <button onClick={() => setEditingId(null)} className='px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300'>✕</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => startEdit(entry.keyPath, entry.translatedText || '')} className='cursor-pointer min-h-[24px]'>
                        {entry.translatedText ? (
                          <p className='text-sm text-slate-700'>{entry.translatedText}</p>
                        ) : (
                          <p className='text-sm text-slate-300 italic'>点击翻译...</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className='w-12 shrink-0'>
                    {glossary.some(g => entry.text.toLowerCase().includes(g.source_text.toLowerCase())) && (
                      <span className='text-xs text-amber-500' title='包含术语'>📖</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TranslationEditor
