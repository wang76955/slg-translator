import React, { useEffect, useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import type { Project } from '../types'

interface Props {
  onSelectProject: (project: Project) => void
  showNew: boolean
  onShowNew: (v: boolean) => void
}

const HomePage: React.FC<Props> = ({ onSelectProject, showNew, onShowNew }) => {
  const { projects, loadProjects, createProject, deleteProject } = useProjectStore()
  const [name, setName] = useState('')
  const [sourcePath, setSourcePath] = useState('')
  const [sourceLang, setSourceLang] = useState('zh')
  const [targetLang, setTargetLang] = useState('en')

  useEffect(() => { loadProjects() }, [])

  const handleCreate = async () => {
    if (!name.trim() || !sourcePath.trim()) return
    const id = await createProject({ name, sourcePath, sourceLang, targetLang })
    onShowNew(false)
    const project = projects.find(p => p.id === id)
    if (project) onSelectProject(project)
  }

  const handleSelectDir = async () => {
    const dir = await window.electronAPI.selectDirectory()
    if (dir) setSourcePath(dir)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">🎮 SLG 文本翻译工具</h1>
        <p className="text-slate-500">管理、翻译和导出 SLG 游戏的本地化文本</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* 已有项目 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">已有项目</h2>
          {projects.length === 0 ? (
            <p className="text-slate-400 text-sm">还没有项目，点击下方创建</p>
          ) : (
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer"
                  onClick={() => onSelectProject(p)}>
                  <div>
                    <p className="font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.source_path} · {p.source_lang} → {p.target_lang}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('确定删除？')) deleteProject(p.id) }}
                    className="text-red-400 hover:text-red-600 text-sm">删除</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新建项目 */}
        {showNew && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">新建项目</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">项目名称</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="如：三国志战略版" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">源语言文件夹</label>
                <div className="flex gap-2">
                  <input value={sourcePath} readOnly placeholder="点击选择游戏文本目录" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
                  <button onClick={handleSelectDir} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">选择</button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 mb-1">源语言</label>
                  <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="zh">中文</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 mb-1">目标语言</label>
                  <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="en">English</option><option value="zh">中文</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="fr">Français</option><option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
              <button onClick={handleCreate} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                创建项目
              </button>
            </div>
          </div>
        )}

        {!showNew && (
          <button onClick={() => onShowNew(true)} className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
            + 新建项目
          </button>
        )}
      </div>
    </div>
  )
}

export default HomePage
