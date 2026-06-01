import React, { useState, useCallback } from 'react'
import type { AiProvider, GameInfo, ScanResult, TranslateResult, ProgressState } from './types'
import { AI_PROVIDERS, LANGUAGES } from './constants'
import Section from './components/Section'

const App: React.FC = () => {
  // === 状态 ===
  const [dirPath, setDirPath] = useState<string>('')
  const [sourceLang, setSourceLang] = useState('zh')
  const [targetLang, setTargetLang] = useState('en')
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<AiProvider>(AI_PROVIDERS[0])
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS[0].models[0].id)
  const [customBaseURL, setCustomBaseURL] = useState('')

  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)
  const [resolving, setResolving] = useState(false)
  const [detecting, setDetecting] = useState(false)

  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const [translating, setTranslating] = useState(false)
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, phase: '' })
  const [result, setResult] = useState<TranslateResult | null>(null)

  const [message, setMessage] = useState('')
  const showMsg = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }, [])

  // === 操作：选择目录 ===
  const handleSelectDir = async () => {
    try {
      const dir = await window.electronAPI.selectDirectory()
      if (dir) {
        setDirPath(dir)
        setGameInfo(null)
        setScanResult(null)
        setResult(null)
      }
    } catch (err: any) {
      showMsg('选择目录失败: ' + (err?.message || err))
    }
  }

  // === 操作：选择游戏程序 ===
  const handleSelectExe = async () => {
    const exePath = await window.electronAPI.selectExe()
    if (!exePath) return

    setResolving(true)
    setGameInfo(null)
    setScanResult(null)
    setResult(null)

    try {
      const { gameDir, error } = await window.electronAPI.resolveGameDir(exePath)
      if (!gameDir) {
        showMsg('解析失败：' + (error || '无法获取目标路径'))
        setResolving(false)
        return
      }

      setDetecting(true)
      const found = await window.electronAPI.findGameTexts(gameDir)

      if (found.totalFiles === 0) {
        showMsg('未在游戏目录中找到 JSON 文本文件')
      } else {
        const dirNames = found.textDirs.map(d => '\\' + d.textDir.slice(gameDir.length).replace(/^[\\/]/, '')).join(', ')
        showMsg('自动检测完成！在 [' + dirNames + '] 中共发现 ' + found.totalFiles + ' 个 JSON 文件')
      }

      setGameInfo({ exePath, gameDir, foundDirs: found.textDirs, totalFiles: found.totalFiles })

      if (found.textDirs.length > 0) {
        setDirPath(found.textDirs[0].textDir)
      } else {
        setDirPath(gameDir)
      }
    } catch (err: any) {
      showMsg('游戏程序处理失败: ' + err.message)
    } finally {
      setResolving(false)
      setDetecting(false)
    }
  }

  // === 操作：扫描 ===
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

  // === 操作：翻译 ===
  const handleTranslate = async () => {
    if (!dirPath || !apiKey) return
    if (!scanResult) { showMsg('请先扫描目录'); return }

    setTranslating(true)
    setProgress({ current: 0, total: scanResult.totalTexts, phase: 'translating' })
    setResult(null)

    try {
      const baseURL = provider.id === 'custom' ? customBaseURL : provider.baseURL
      const separator = (dirPath.endsWith('\\') || dirPath.endsWith('/')) ? '' : '_'
      const outputDir = dirPath + '_' + targetLang

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

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value
    const p = AI_PROVIDERS.find(x => x.id === pid)!
    setProvider(p)
    setSelectedModel(p.models[0].id)
  }

  const progressPct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  // === 渲染 ===
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🌐</span>
          <h1 className="text-lg font-bold text-slate-800">SLG 文本翻译工具</h1>
          <span className="text-xs text-slate-400 ml-auto">v2.0</span>
        </div>
      </header>

      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
          {message}
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-4 space-y-4">

          {/* === 第一步：选择文本来源 === */}
          <Section title="1. 选择文本来源">
            <div className="flex gap-2 mb-3">
              <button onClick={handleSelectDir}
                className="flex-1 py-2.5 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors">
                📁 选择游戏目录
              </button>
              <button onClick={handleSelectExe} disabled={resolving || detecting}
                className="flex-1 py-2.5 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-colors">
                🎯 选择游戏程序
              </button>
            </div>

            {dirPath && (
              <div className="mb-2 p-2.5 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-0.5">文本扫描目录：</p>
                <p className="text-sm text-slate-700 font-mono break-all">{dirPath}</p>
              </div>
            )}

            {gameInfo && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-green-600 font-medium">游戏程序解析成功</p>
                    <p className="text-xs text-green-500 mt-1 break-all">启动程序：{gameInfo.exePath}</p>
                    <p className="text-xs text-green-500 break-all">游戏目录：{gameInfo.gameDir}</p>
                    {gameInfo.foundDirs.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          自动检测到 {gameInfo.totalFiles} 个 JSON 文本文件：
                        </p>
                        {gameInfo.foundDirs.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-green-600 py-0.5">
                            <span>📄</span>
                            <span>{d.textDir.slice(gameInfo.gameDir.length) || '(根目录)'}</span>
                            <span className="text-green-400">({d.fileCount} 个文件)</span>
                          </div>
                        ))}
                        <p className="text-xs text-amber-600 mt-1">💡 已自动选中第一个文本目录</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button onClick={handleScan} disabled={!dirPath || resolving || detecting}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {(resolving || detecting) ? '正在检测...' : '🔍 扫描文本文件'}
              </button>

              {scanResult && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">扫描结果</p>
                  <p className="text-xs text-blue-600 mt-1">
                    共发现 {scanResult.files.length} 个 JSON 文件，包含 {scanResult.totalTexts} 条可翻译文本
                  </p>
                  <div className="mt-2 max-h-28 overflow-y-auto space-y-0.5">
                    {scanResult.files.slice(0, 20).map(f => (
                      <p key={f.filePath} className="text-xs text-blue-500 truncate">
                        {f.relativePath} <span className="text-blue-300">({f.textCount} 条)</span>
                      </p>
                    ))}
                    {scanResult.files.length > 20 && (
                      <p className="text-xs text-blue-400">...还有 {scanResult.files.length - 20} 个文件</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* === 第二步：API 配置 === */}
          <Section title="2. API 配置">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">源语言</label>
                  <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
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

          {/* === 第三步：执行翻译 === */}
          <Section title="3. 执行翻译">
            <button onClick={handleTranslate} disabled={translating || !dirPath || !apiKey}
              className="w-full py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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

export default App
