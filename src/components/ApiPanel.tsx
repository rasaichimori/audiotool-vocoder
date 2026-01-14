import React, { useState } from 'react'
import type { AudiotoolClient } from '@audiotool/nexus'

interface ApiPanelProps {
  client: AudiotoolClient
}

function ApiPanel({ client }: ApiPanelProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const result = await client.api.projectService.listProjects({})
      // Handle the response properly - check if it's an error or success
      if ('projects' in result) {
        setProjects(result.projects || [])
      } else {
        throw new Error('Failed to fetch projects')
      }
    } catch (err) {
      setError(`Failed to fetch projects: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      // Note: Using getSettings as an example since getCurrentUser doesn't exist
      const result = await client.api.userService.getSettings({})
      setUser(result)
    } catch (err) {
      setError(`Failed to fetch user info: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const listSamples = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const result = await client.api.sampleService.listSamples({})
      console.log('Sample list results:', result)
      alert(`Listed samples. Check console for details.`)
    } catch (err) {
      setError(`Failed to list samples: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-panel">
      <h2>API Services</h2>
      <p>Explore Audiotool services with authenticated API calls</p>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="api-actions">
        <div className="action-group">
          <h3>User Settings</h3>
          <button 
            onClick={fetchUserInfo}
            disabled={loading}
            className="action-btn"
          >
            {loading ? 'Loading...' : 'Get User Settings'}
          </button>
          {user && (
            <div className="result-card">
              <h4>User Settings</h4>
              <p>Settings retrieved successfully. Check console for details.</p>
            </div>
          )}
        </div>

        <div className="action-group">
          <h3>Projects</h3>
          <button 
            onClick={fetchProjects}
            disabled={loading}
            className="action-btn"
          >
            {loading ? 'Loading...' : 'List Projects'}
          </button>
          {projects.length > 0 && (
            <div className="result-card">
              <h4>Your Projects ({projects.length})</h4>
              <div className="project-list">
                {projects.slice(0, 5).map((project, index) => (
                  <div key={index} className="project-item">
                    <strong>{project.title || 'Untitled'}</strong>
                    <br />
                    <small>ID: {project.id}</small>
                    {project.createdAt && (
                      <>
                        <br />
                        <small>Created: {new Date(project.createdAt).toLocaleDateString()}</small>
                      </>
                    )}
                  </div>
                ))}
                {projects.length > 5 && (
                  <p><em>... and {projects.length - 5} more</em></p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="action-group">
          <h3>Sample Library</h3>
          <button 
            onClick={listSamples}
            disabled={loading}
            className="action-btn"
          >
            {loading ? 'Loading...' : 'List Samples'}
          </button>
          <p className="action-description">
            Lists samples from the Audiotool library
          </p>
        </div>

        <div className="action-group">
          <h3>Additional APIs</h3>
          <div className="api-info">
            <p>The Nexus SDK provides access to many more services:</p>
            <ul>
              <li><strong>Genre Service:</strong> Browse music genres</li>
              <li><strong>Preset Service:</strong> Access device presets</li>
              <li><strong>Track Service:</strong> Manage published tracks</li>
              <li><strong>Comment Service:</strong> Handle track comments</li>
              <li><strong>Favorite Service:</strong> Manage favorites</li>
              <li><strong>Event Service:</strong> Access platform events</li>
            </ul>
            <p>Check the browser console for detailed API responses.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiPanel
