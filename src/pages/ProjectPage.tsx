import React, { useEffect, useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { useGlossaryStore } from '../stores/glossaryStore'
import { useSettingsStore } from '../stores/settingsStore'
import FileTree from '../components/FileTree'
import TranslationEditor from '../components/TranslationEditor'
import GlossaryPanel from '../components/GlossaryPanel'
import SettingsPanel from '../components/SettingsPanel'

interface Props {
  onBack: () => void
}

const ProjectPage: React.FC<Props> = ({ onBack }) => {
  const { currentProject, jsonFiles, selectedFile, fileTexts, selectFile, scanFiles } = useProjectStore()
  const { entries, loadEntries } = useGlossaryStore()
  const { settings, loadSettings } = useSettingsStore()
  const [activeTab, setActiveTab] = React.useState<'editor' | 'glossary' | 'settings'>('editor')

  useEffect(() => {
    if (currentProject) {
      loadEntries(currentProject.id)
      loadSettings(currentProject.id)
    }
  }, [currentProject])

  if (!currentProject) return null

  const totalCount = fileTexts.length
  const translatedCount = fileTexts.filter((t: any) => t.translatedText).length

  return (
    <div className='h-screen flex flex-col'>
      <header className='bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-4'>
          <button onClick={onBack} className='text-slate-400 hover:text-slate-600'>&larr; 返回</button>
          <h1 className='text-lg font-semibold text-slate-800'>{currentProject.name}</h1>
          <span className='text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded'>{currentProject.source_lang} → {currentProject.target_lang}</span>
        </div>
        <div className='flex items-center gap-4'>
          {selectedFile && (
            <span className='text-sm text-slate-500'>
              翻译进度: {translatedCount}/{totalCount} ({totalCount > 0 ? Math.round(translatedCount/totalCount*100) : 0}%)
            </span>
          )}
          <div className='flex bg-slate-100 rounded-lg p-1 text-sm'>
            <button onClick={() => setActiveTab('editor')} className={'px-3 py-1 rounded ' + (activeTab === 'editor' ? 'bg-white shadow-sm' : '')}>翻译</button>
            <button onClick={() => setActiveTab('glossary')} className={'px-3 py-1 rounded ' + (activeTab === 'glossary' ? 'bg-white shadow-sm' : '')}>术语表</button>
            <button onClick={() => setActiveTab('settings')} className={'px-3 py-1 rounded ' + (activeTab === 'settings' ? 'bg-white shadow-sm' : '')}>设置</button>
          </div>
        </div>
      </header>

      <div className='flex flex-1 overflow-hidden'>
        <div className='w-64 border-r border-slate-200 bg-white overflow-y-auto shrink-0'>
          <div className='p-3 border-b border-slate-100'>
            <p className='text-xs font-medium text-slate-400 uppercase tracking-wider'>JSON 文件</p>
            <p className='text-xs text-slate-400'>{jsonFiles.length} 个文件</p>
          </div>
          <FileTree
            files={jsonFiles}
            selectedFile={selectedFile}
            onSelectFile={selectFile}
          />
          <div className='p-3'>
            <button onClick={() => currentProject && scanFiles(currentProject.source_path)}
              className='w-full text-xs text-blue-500 hover:text-blue-700'>
              刷新文件列表
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-hidden'>
          {activeTab === 'editor' && (
            <TranslationEditor
              project={currentProject}
              filePath={selectedFile}
              texts={fileTexts}
              glossary={entries}
              settings={settings}
            />
          )}
          {activeTab === 'glossary' && (
            <GlossaryPanel projectId={currentProject.id} entries={entries} />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel projectId={currentProject.id} settings={settings} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectPage
