import { useState, useEffect, useRef } from 'react'
import type { AudiotoolClient, SyncedDocument } from '@audiotool/nexus'
import { createVocoderSystem, centroidHeight } from '../vocoderCreation'
import { Knob } from '../components/Knob'
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
  const [vocoderCreated, setVocoderCreated] = useState(false)
  const [bandCount, setBandCount] = useState<number>(9)
  const [positionX, setPositionX] = useState<number>(0)
  const [positionY, setPositionY] = useState<number>(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      createVocoderSystem(t, bandCount, positionX, positionY)
    })
    console.log(`Created ${bandCount}-band vocoder at (${positionX}, ${positionY}) with dual splitter trees and centroid output`)
    setIsCreatingVocoder(false)
    setVocoderCreated(true)
    setPositionY(positionY + centroidHeight + 700)
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
          <h2>Multi-Band Vocoder</h2>

          <div className="vocoder-controls">
            {/* Main knob control */}
            <div className="knob-section">
              <div className="knob-sticker">
                <img src={`${import.meta.env.BASE_URL}danger-zone.png`} alt="Knob Sticker" />
              </div>
              <Knob
                value={bandCount}
                min={3}
                max={50}
                onChange={setBandCount}
                label="Bands"
                disabled={isCreatingVocoder}
                danger={bandCount > 35}
              />
            </div>

            {/* Advanced options toggle */}
            <button
              className="advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <span className={`toggle-arrow ${showAdvanced ? 'open' : ''}`}>▶</span>
              Position
            </button>

            {/* Collapsible position inputs */}
            {showAdvanced && (
              <div className="position-section">
                <div className="position-inputs">
                  <div className="position-group">
                    <label htmlFor="position-x">X</label>
                    <input
                      id="position-x"
                      type="text"
                      value={positionX}
                      onChange={(e) => setPositionX(Number(e.target.value) || 0)}
                      disabled={isCreatingVocoder}
                      className="position-input"
                    />
                  </div>
                  <div className="position-group">
                    <label htmlFor="position-y">Y</label>
                    <input
                      id="position-y"
                      type="text"
                      value={positionY}
                      onChange={(e) => setPositionY(Number(e.target.value) || 0)}
                      disabled={isCreatingVocoder}
                      className="position-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {vocoderCreated && (
              <div className="vocoder-success-message">
                Vocoder added! Check the project!
              </div>
            )}

            <button
              onClick={createVocoder}
              disabled={isCreatingVocoder || !document}
              className={`create-vocoder-btn ${bandCount > 35 ? 'danger' : ''}`}
            >
              {isCreatingVocoder
                ? `Creating ${bandCount}-Band Vocoder...`
                : vocoderCreated
                  ? `Create Another ${bandCount}-Band Vocoder`
                  : `Create ${bandCount}-Band Vocoder`}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
