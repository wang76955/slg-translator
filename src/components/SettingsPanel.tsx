import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import type { ProjectSettings } from '../types'

interface Props {
  projectId: number
  settings: ProjectSettings | null
}

const SettingsPanel: React.FC<Props> = ({ projectId, settings }) => {
  const { saveSettings, loadSettings } = useSettingsStore()
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [batchSize, setBatchSize] = useState(20)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (settings) {
      setApiKey(settings.api_key || '')
      setModel(settings.model || 'gpt-4o-mini')
      setBatchSize(settings.batch_size || 20)
    }
  }, [settings])

  const handleSave = async () => {
    await saveSettings(projectId, { api_key: apiKey, model, batch_size: batchSize })
    setMessage('设置已保存')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">项目设置</h2>

      <div className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">OpenAI API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <p className="text-xs text-slate-400 mt-1">密钥仅存储在本地数据库中</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">翻译模型</label>
          <select value={model} onChange={e => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="gpt-4o-mini">GPT-4o-mini（推荐，性价比高）</option>
            <option value="gpt-4o">GPT-4o（质量最高）</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo（速度快，质量稍低）</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">每批翻译条数</label>
          <input type="number" value={batchSize} onChange={e => setBatchSize(parseInt(e.target.value) || 20)}
            min={1} max={100} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <p className="text-xs text-slate-400 mt-1">批量越大，速度越快但可能影响质量</p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">当前项目语言</h3>
          <div className="flex gap-4">
            <div className="flex-1 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400">源语言</p>
              <p className="text-sm font-medium text-slate-700">{settings ? '中文 (zh)' : '-'}</p>
            </div>
            <div className="flex-1 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400">目标语言</p>
              <p className="text-sm font-medium text-slate-700">{settings ? 'English (en)' : '-'}</p>
            </div>
          </div>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}

        <button onClick={handleSave} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
          保存设置
        </button>
      </div>
    </div>
  )
}

export default SettingsPanel
