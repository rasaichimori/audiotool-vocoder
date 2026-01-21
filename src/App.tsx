import { useState } from 'react'
import './App.css'
import { useLoginStatus } from './hooks/useLoginStatus'
import { LoginPage } from './pages/LoginPage'
import { ProjectSelectionPage } from './pages/ProjectSelectionPage'
import { VocoderPage } from './pages/VocoderPage'

type SelectedProject = {
  name: string
  displayName: string
} | null

function App() {
  const loginStatus = useLoginStatus()
  const [selectedProject, setSelectedProject] = useState<SelectedProject>(null)

  const handleProjectSelected = (name: string, displayName: string) => {
    setSelectedProject({ name, displayName })
  }

  const handleBack = () => {
    // Reload page to properly close the SyncedDocument
    // (SDK doesn't provide a stop/close method, so reload is the only way)
    window.location.reload()
  }

  const handleLogout = () => {
    // Reload page to clear auth state
    window.location.reload()
  }

  // Loading state
  if (loginStatus.case === 'loading') {
    return (
      <LoginPage
        onLogin={() => {}}
        isLoading={true}
      />
    )
  }

  // Error state
  if (loginStatus.case === 'error') {
    return (
      <LoginPage
        onLogin={() => {}}
        error={loginStatus.error}
        onRetry={loginStatus.retry}
      />
    )
  }

  // Logged out - show login page
  if (loginStatus.case === 'loggedOut') {
    return (
      <LoginPage
        onLogin={loginStatus.login}
      />
    )
  }

  // Logged in but no project selected - show project selection
  if (!selectedProject) {
    return (
      <ProjectSelectionPage
        client={loginStatus.client}
        onProjectSelected={handleProjectSelected}
        onLogout={handleLogout}
      />
    )
  }

  // Logged in with project - show vocoder page
  return (
    <VocoderPage
      client={loginStatus.client}
      projectName={selectedProject.name}
      projectDisplayName={selectedProject.displayName}
      onBack={handleBack}
      onLogout={handleLogout}
    />
  )
}

export default App
