import React, { useState, useCallback } from 'react'

// === 类型定义 ===
interface AiModel {
  id: string
  name: string
  supportsJsonMode: boolean
}

interface AiProvider {
  id: string
  name: string
  baseURL: string
  models: AiModel[]
}

// === 预定义 AI 服务提供商 ===
const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o-mini（推荐，性价比高）', supportsJsonMode: true },
      { id: 'gpt-4o', name: 'GPT-4o（质量最高）', supportsJsonMode: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supportsJsonMode: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo（速度快）', supportsJsonMode: true },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat（推荐，性价比高）', supportsJsonMode: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner（推理模型）', supportsJsonMode: false },
    ],
  },
  {
    id: 'custom',
    name: '自定义 API',
    baseURL: '',
    models: [
      { id: 'custom', name: '自定义模型', supportsJsonMode: true },
    ],
  },
]

// 语言选项
const LANGUAGES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

// === 全局类型声明 ===
declare global {
  interface Window {
    electronAPI: {
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
      }) => Promise<{ success: boolean; count: number; outputDir: string; error?: string }>
    }
  }
}

const App: React.FC = () => {
  // === 状态 ===
  const [dirPath, setDirPath] = useState<string>('')
  const [sourceLang, setSourceLang] = useState('zh')
  const [targetLang, setTargetLang] = useState('en')
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<AiProvider>(AI_PROVIDERS[0])
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS[0].models[0].id)
  const [customBaseURL, setCustomBaseURL] = useState('')

  // 扫描结果
  const [scanResult, setScanResult] = useState<{
    files: { filePath: string; relativePath: string; textCount: number }[]
    totalTexts: number
  } | null>(null)

  // 翻译状态
  const [translating, setTranslating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' })
  const [result, setResult] = useState<{ success: boolean; count: number; outputDir: string; error?: string } | null>(null)

  // 消息
  const [message, setMessage] = useState('')
  const showMsg = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }, [])

  // === 操作 ===
  const handleSelectDir = async () => {
    const dir = await window.electronAPI.selectDirectory()
    if (dir) {
      setDirPath(dir)
      setScanResult(null)
      setResult(null)
    }
  }

  const handleScan = async () => {
    if (!dirPath) return
    try {
      const res = await window.electronAPI.scanDirectory(dirPath)
      setScanResult(res)
      showMsg('扫描完成：发现 ' + res.files.length + ' 个文件，共 ' + res.totalTexts + ' 条文本')
    } catch (err: any) {
      showMsg('扫描失败: ' + err.message)
    }
  }

  const handleTranslate = async () => {
    if (!dirPath || !apiKey) return
    if (!scanResult) {
      showMsg('请先扫描目录')
      return
    }

    setTranslating(true)
    setProgress({ current: 0, total: scanResult.totalTexts, phase: 'translating' })
    setResult(null)

    try {
      const baseURL = provider.id === 'custom' ? customBaseURL : provider.baseURL
      const separator = (dirPath.endsWith('\\') || dirPath.endsWith('/')) ? '' : '_'
      const outputDir = dirPath + separator + targetLang

      const res = await window.electronAPI.runTranslation({
        dirPath, sourceLang, targetLang, apiKey,
        baseURL, model: selectedModel, outputDir,
      })

      setResult(res)
      if (res.success) {
        showMsg('翻译完成！共 ' + res.count + ' 条文本已导出到：' + res.outputDir)
      } else {
        showMsg('翻译失败: ' + (res.error || '未知错误'))
      }
    } catch (err: any) {
      showMsg('错误: ' + err.message)
    } finally {
      setTranslating(false)
      setProgress({ current: 0, total: 0, phase: '' })
    }
  }

  // 提供商切换
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = AI_PROVIDERS.find(p => p.id === e.target.value) ?? AI_PROVIDERS[0]
    setProvider(p)
    setSelectedModel(p.models[0].id)
  }

  const progressPct = progress.total > 0
    ? Math.min(Math.round(progress.current / progress.total * 100), 100)
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-800">SLG 文本翻译</h1>
        <p className="text-xs text-slate-400 mt-0.5">选择游戏目录，一键翻译全部文本</p>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-5">
          {message && (
            <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
              {message}
            </div>
          )}

          {/* 第一步：选择目录 + 扫描 */}
          <Section title="选择游戏文本目录">
            <div className="flex gap-2">
              <input value={dirPath} readOnly
                placeholder="点击右侧按钮选择目录..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600" />
              <button onClick={handleSelectDir}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 shrink-0">
                选择
              </button>
            </div>
            {dirPath && !scanResult && (
              <button onClick={handleScan}
                className="mt-2 text-sm text-blue-500 hover:text-blue-700">
                扫描此目录
              </button>
            )}
          </Section>

          {/* 扫描结果 */}
          {scanResult && (
            <Section title={'扫描结果（' + scanResult.files.length + ' 个文件，' + scanResult.totalTexts + ' 条文本）'}>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {scanResult.files.map((f, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-500 py-0.5">
                    <span className="truncate">{f.relativePath}</span>
                    <span className="shrink-0 ml-2">{f.textCount} 条</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* 第二步：翻译设置 */}
          <Section title="翻译设置">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">源语言</label>
                  <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <span className="text-slate-300 text-lg">&rarr;</span>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">目标语言</label>
                  <select value={targetLang} onChange={e => setTargetLang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">API 提供商</label>
                <select value={provider.id} onChange={handleProviderChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {AI_PROVIDERS.filter(p => p.id !== 'custom').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="custom">自定义 API</option>
                </select>
              </div>

              {provider.id === 'custom' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">自定义 Base URL</label>
                  <input value={customBaseURL} onChange={e => setCustomBaseURL(e.target.value)}
                    placeholder="https://your-api.com/v1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-500 mb-1">翻译模型</label>
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {provider.models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder={provider.id === 'openai' ? 'sk-...' : '输入 API Key'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <p className="text-xs text-slate-400 mt-0.5">密钥仅保存在本机，不会上传</p>
              </div>
            </div>
          </Section>

          {/* 第三步：翻译 */}
          <Section title="执行翻译">
            <button onClick={handleTranslate}
              disabled={translating || !dirPath || !apiKey}
              className="w-full py-3 bg-blue-500 text-white rounded-lg text-sm font-medium
                hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {translating ? '翻译中...' : '开始翻译'}
            </button>

            {translating && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>翻译进度</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-300"
                    style={{ width: progressPct + '%' }} />
                </div>
              </div>
            )}

            {result && result.success && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">翻译完成</p>
                <p className="text-xs text-green-600 mt-1">
                  共翻译 {result.count} 条文本<br />
                  输出目录：<code className="bg-green-100 px-1 rounded">{result.outputDir}</code>
                </p>
              </div>
            )}
            {result && !result.success && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">翻译失败</p>
                <p className="text-xs text-red-600 mt-1">{result.error}</p>
              </div>
            )}
          </Section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400 shrink-0">
        SLG 文本翻译工具 2.0 &middot; 开源免费 &middot; 支持 OpenAI / DeepSeek
      </footer>
    </div>
  )
}

// === Section 组件 ===
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
    {children}
  </div>
)

export default App
