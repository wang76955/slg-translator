import React, { useEffect, useState } from 'react'
import { useProjectStore } from './stores/projectStore'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'

const App: React.FC = () => {
  const { currentProject, loadProjects, setCurrentProject } = useProjectStore()
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  if (currentProject) {
    return <ProjectPage onBack={() => setCurrentProject(null)} />
  }

  return <HomePage onSelectProject={(p) => setCurrentProject(p)} showNew={showNewProject} onShowNew={setShowNewProject} />
}

export default App
