import React from 'react'
import type { JsonFile } from '../types'

interface Props {
  files: JsonFile[]
  selectedFile: string | null
  onSelectFile: (path: string) => void
}

const FileTree: React.FC<Props> = ({ files, selectedFile, onSelectFile }) => {
  // 按目录分组
  const grouped: Record<string, JsonFile[]> = {}
  for (const f of files) {
    const parts = f.relativePath.split(/[\\/]/)
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '/'
    if (!grouped[dir]) grouped[dir] = []
    grouped[dir].push(f)
  }

  return (
    <div className="text-sm">
      {Object.entries(grouped).map(([dir, dirFiles]) => (
        <div key={dir}>
          {dir !== '/' && (
            <div className="px-3 py-1.5 text-xs text-slate-400 font-medium bg-slate-50 border-b border-slate-100">
              {dir}
            </div>
          )}
          {dirFiles.map(f => (
            <div key={f.filePath}
              onClick={() => onSelectFile(f.filePath)}
              className='px-3 py-2 cursor-pointer flex items-center gap-2 border-b border-slate-50 hover:bg-blue-50'
            >
              <span className="text-xs">📄</span>
              <span className="truncate">{f.relativePath.split(/[\\/]/).pop()}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default FileTree
