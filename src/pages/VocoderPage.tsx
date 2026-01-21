import { useState, useEffect, useRef } from 'react'
import type { AudiotoolClient, SyncedDocument } from '@audiotool/nexus'
import { createVocoderSystem } from '../vocoderCreation'
import './VocoderPage.css'

interface VocoderPageProps {
  client: AudiotoolClient
  projectName: string
  projectDisplayName: string
  onBack: () => void
  onLogout: () => void
}

export function VocoderPage({ client, projectName, projectDisplayName, onBack, onLogout }: VocoderPageProps) {
  const [document, setDocument] = useState<SyncedDocument | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isCreatingVocoder, setIsCreatingVocoder] = useState(false)
  const [bandCount, setBandCount] = useState<number>(27)
  const hasStartedConnecting = useRef(false)

  useEffect(() => {
    // Prevent double connection in StrictMode
    if (hasStartedConnecting.current) return
    hasStartedConnecting.current = true

    const connect = async () => {
      setIsConnecting(true)
      setConnectionError(null)

      try {
        const docConfig = {
          mode: 'online' as const,
          project: projectName
        }

        const nexus = await client.createSyncedDocument(docConfig)
        await nexus.start()
        setDocument(nexus)
      } catch (err) {
        const message = (err as Error).message
        // SDK only allows one synced document per tab - reload to reset
        if (message.includes('Can only create one synced document')) {
          window.location.reload()
          return
        }
        setConnectionError(`Failed to connect: ${message}`)
      } finally {
        setIsConnecting(false)
      }
    }

    connect()
  }, [client, projectName])

  const createVocoder = async () => {
    if (!document) return

    setIsCreatingVocoder(true)
    await document.modify((t) => {
      createVocoderSystem(t, bandCount)
    })
    console.log(`Created ${bandCount}-band vocoder with dual splitter trees and centroid output`)
    setIsCreatingVocoder(false)
  }

  const handleBack = () => {
    // Page will reload to properly close the SyncedDocument (SDK has no stop method)
    onBack()
  }

  const openInAudiotool = () => {
    // projectName is in format "projects/[id]"
    const projectId = projectName.replace('projects/', '')
    window.open(`https://beta.audiotool.com/studio?project=${projectId}`, '_blank')
  }

  if (isConnecting) {
    return (
      <div className="vocoder-page">
        <header className="vocoder-header">
          <button onClick={handleBack} className="back-btn">← Change Project</button>
          <h1>{projectDisplayName}</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>
        <main className="vocoder-content">
          <div className="vocoder-loading">
            <div className="spinner"></div>
            <p>Connecting to project...</p>
          </div>
        </main>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="vocoder-page">
        <header className="vocoder-header">
          <button onClick={handleBack} className="back-btn">← Change Project</button>
          <h1>{projectDisplayName}</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>
        <main className="vocoder-content">
          <div className="vocoder-error">
            <p>{connectionError}</p>
            <button onClick={handleBack} className="back-btn-large">
              Back to Project Selection
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="vocoder-page">
      <header className="vocoder-header">
        <button onClick={handleBack} className="back-btn">← Change Project</button>
        <h1>{projectDisplayName}</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <main className="vocoder-content">
        <div className="status-row">
          <div className="connection-status">
            <span className="status-dot"></span>
            Connected to project
          </div>
          <button onClick={openInAudiotool} className="open-audiotool-btn">
            Open in Audiotool
          </button>
        </div>

        <div className="vocoder-card">
          <h2>Multi-Band Vocoder Creation</h2>

          <div className="vocoder-controls">
            <div className="control-group">
              <label htmlFor="band-count">Number of Bands:</label>
              <select
                id="band-count"
                value={bandCount}
                onChange={(e) => setBandCount(Number(e.target.value))}
                disabled={isCreatingVocoder}
                className="bands-dropdown"
              >
                {Array.from({ length: 25 }, (_, i) => i + 3).map(count => (
                  <option key={count} value={count}>
                    {count} bands
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={createVocoder}
              disabled={isCreatingVocoder || !document}
              className="create-vocoder-btn"
            >
              {isCreatingVocoder ? `Creating ${bandCount}-Band Vocoder...` : `Create ${bandCount}-Band Vocoder`}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
