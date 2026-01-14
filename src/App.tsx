import React, { useState, useEffect } from 'react'
import type { AudiotoolClient, SyncedDocument } from '@audiotool/nexus'
import { createAudiotoolClient } from '@audiotool/nexus'
import { getLoginStatus, type LoginStatus } from '@audiotool/nexus/utils'
import './App.css'
import { createVocoderSystem } from './vocoderCreation'

function App() {
  const [client, setClient] = useState<AudiotoolClient | null>(null)
  const [loginStatus, setLoginStatus] = useState<LoginStatus | null>(null)
  const [isInitializing, setIsInitializing] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [projectUrl, setProjectUrl] = useState<string>(() => {
    return localStorage.getItem('audiotool-project-url') || ''
  })
  const [document, setDocument] = useState<SyncedDocument | null>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isCreatingVocoder, setIsCreatingVocoder] = useState<boolean>(false)
  const [bandCount, setBandCount] = useState<number>(27)

  // Check login status on mount
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const status = await getLoginStatus({
          clientId: import.meta.env.VITE_AT_CLIENT_ID,
          redirectUrl: 'http://127.0.0.1:5174/',
          scope: 'project:write',
        })
        setLoginStatus(status)

        // If logged in, create the client
        if (status.loggedIn) {
          const audiotoolClient = await createAudiotoolClient({
            authorization: status,
          })
          setClient(audiotoolClient)
        }
        setIsInitializing(false)
      } catch (err) {
        console.error('Initialization error:', err)
        setError(`Failed to initialize: ${(err as Error).message}`)
        setIsInitializing(false)
      }
    }

    checkLogin()
  }, [])

  const handleLogin = (): void => {
    if (loginStatus && !loginStatus.loggedIn) {
      loginStatus.login()
    }
  }

  const handleProjectUrlChange = (url: string): void => {
    setProjectUrl(url)
    localStorage.setItem('audiotool-project-url', url)
  }

  const handleConnect = async (): Promise<void> => {
    if (!client || !projectUrl.trim()) return

    setIsConnecting(true)
    setError(null)

    try {
      const docConfig = {
        mode: 'online' as const,
        project: projectUrl.trim()
      }

      const nexus = await client.createSyncedDocument(docConfig)
      await nexus.start()
      setDocument(nexus)
    } catch (err) {
      setError(`Failed to connect: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const createVocoder = async (): Promise<void> => {
    if (!document) return

    setIsCreatingVocoder(true)
    await document.modify((t) => {
      createVocoderSystem(t, bandCount)
    })
    console.log(`Created ${bandCount}-band vocoder with dual splitter trees and centroid output`)
    setIsCreatingVocoder(false)
  }

  const handleDisconnect = (): void => {
    if (document) {
      // Note: SyncedDocument doesn't have a stop method in the type definition
      // The connection should be automatically cleaned up when the document is set to null
      setDocument(null)
    }
  }

  if (isInitializing) {
    return (
      <div className="app">
        <div className="status-message">
          <h2>Initializing Audiotool Nexus SDK...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Audiotool Vocoder</h1>
        <p>Real-time vocoder creation for Audiotool projects</p>
      </header>

      {!loginStatus?.loggedIn ? (
        <div className="auth-section">
          <h2>Authentication</h2>
          <p>Log in to your Audiotool account to continue</p>
          <button onClick={handleLogin} className="login-btn">
            Log in to Audiotool
          </button>
        </div>
      ) : (
        <div className="main-content">
          <div className="connection-section">
            <h2>Project Connection</h2>
            
            <div className="input-group">
              <input
                type="text"
                placeholder="Project URL (e.g., https://beta.audiotool.com/studio?project=abc123)"
                value={projectUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProjectUrlChange(e.target.value)}
                disabled={!!document}
              />
              {!document ? (
                <button 
                  onClick={handleConnect} 
                  disabled={isConnecting || !projectUrl.trim()}
                  className="connect-btn"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button onClick={handleDisconnect} className="disconnect-btn">
                  Disconnect
                </button>
              )}
            </div>

            {document && (
              <div className="connected-status">
                <div className="status-indicator">
                  <span className="status-dot connected"></span>
                  Connected to project
                </div>
              </div>
            )}
          </div>

          {document && (
            <div className="vocoder-section">
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
                  disabled={isCreatingVocoder}
                  className="create-vocoder-btn"
                >
                  {isCreatingVocoder ? `Creating ${bandCount}-Band Vocoder...` : `Create ${bandCount}-Band Vocoder`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
