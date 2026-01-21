import { useState, useRef, useEffect } from 'react'
import type { AudiotoolClient } from '@audiotool/nexus'
import { useProjects } from '../hooks/useProjects'
import './ProjectSelectionPage.css'

interface ProjectSelectionPageProps {
  client: AudiotoolClient
  onProjectSelected: (projectName: string, displayName: string) => void
  onLogout: () => void
}

export function ProjectSelectionPage({ client, onProjectSelected, onLogout }: ProjectSelectionPageProps) {
  const projectsResult = useProjects(client)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNewProject = async () => {
    if (projectsResult.case !== 'loaded') return

    setIsCreatingProject(true)

    // Generate unique project name
    const existingNames = projectsResult.projects.map(p => p.displayName)
    let projectName = 'Vocoder Project'
    let counter = 2
    while (existingNames.includes(projectName)) {
      projectName = `Vocoder Project ${counter}`
      counter++
    }

    const created = await projectsResult.createProject(projectName)
    setIsCreatingProject(false)

    if (created) {
      onProjectSelected(created.name, created.displayName)
    }
  }

  const handleSelectProject = (projectName: string, displayName: string) => {
    setDropdownOpen(false)
    onProjectSelected(projectName, displayName)
  }

  return (
    <div className="project-selection-page">
      <header className="project-selection-header">
        <h1>Audiotool Vocoder</h1>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="project-selection-content">
        <div className="project-selection-card">
          <p className="project-selection-info">
            To use this app, you need to connect it to an Audiotool project.
          </p>

          {projectsResult.case === 'loading' && (
            <div className="projects-loading">
              <div className="spinner"></div>
              <p>Loading projects...</p>
            </div>
          )}

          {projectsResult.case === 'error' && (
            <div className="projects-error">
              <p>Failed to load projects: {projectsResult.error}</p>
              <button onClick={projectsResult.retry} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {projectsResult.case === 'loaded' && (
            <div className="project-buttons">
              <button
                onClick={handleNewProject}
                disabled={isCreatingProject || projectsResult.isCreating}
                className="new-project-btn"
              >
                {isCreatingProject || projectsResult.isCreating ? 'Creating...' : '+ New Project'}
              </button>

              <div className="dropdown-container" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="existing-project-btn"
                  disabled={isCreatingProject || projectsResult.isCreating}
                >
                  Existing Project
                  <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                </button>

                {dropdownOpen && (
                  <div className="projects-dropdown">
                    {projectsResult.projects.length === 0 ? (
                      <div className="dropdown-empty">No projects found</div>
                    ) : (
                      <>
                        <ul className="projects-list">
                          {projectsResult.projects.map((project) => (
                            <li key={project.name}>
                              <button
                                onClick={() => handleSelectProject(project.name, project.displayName)}
                                className="project-item"
                              >
                                {project.displayName}
                              </button>
                            </li>
                          ))}
                        </ul>
                        {projectsResult.hasMore && (
                          <button
                            onClick={projectsResult.loadMore}
                            disabled={projectsResult.isLoadingMore}
                            className="show-more-btn"
                          >
                            {projectsResult.isLoadingMore ? 'Loading...' : 'Show More'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
