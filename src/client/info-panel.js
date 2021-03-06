import React, { useState, useEffect } from 'react'
import PwaInstall from './pwa-install'

let deferredPrompt

const InfoPanel = ({ loading, refresh }) => {
  const [collapsed, setCollapsed] = useState(true)
  const [pseudoLoad, setPseudoLoad] = useState(false)
  const [pwaButtonVisible, setPwaButtonVisible] = useState(false)

  useEffect(() => {
    initPwaInstallPrompt()
  }, [])

  const refreshButton = () => {
    refresh({ ignoreCache: true })
    setPseudoLoad(true)
    setTimeout(() => {
      setPseudoLoad(false)
    }, 600)
  }

  const collapsedInfoPanel = () => (
    <div id="side-info-panel-open">
      <img
        className={`panel-btn ${(loading || pseudoLoad) && 'active'}`}
        id="sync-icon"
        src="/img/sync.svg"
        onClick={refreshButton}
      />
      <div className="panel-btn" onClick={() => toggleCollapse(collapsed)}>
        &lt;
      </div>
    </div>
  )

  const openInfoPanel = () => (
    <div className="side-info-panel">
      <button
        id="close-side-info"
        className="button-style"
        onClick={() => toggleCollapse(collapsed)}
      >
        Sulje
      </button>
      {renderContent(pwaButtonVisible)}
    </div>
  )

  const toggleCollapse = (current) => {
    setCollapsed(!current)
  }

  const initPwaInstallPrompt = () => {
    console.log('initInstallPrompt')
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt fired')
      e.preventDefault()
      deferredPrompt = e
      setPwaButtonVisible(true)
    })
  }

  const hidePwaInstall = () => {
    setPwaButtonVisible(false)
  }

  const renderContent = () => {
    return (
      <div className="sidepanel-content">
        <div className="logo-container">
          <img src="/img/sade-logo.png" alt="Sade logo" title="Sade logo" />
        </div>
        <div className="description-container">
          <h1>Sade</h1>
          <p>
            Tämän sadetutka on mukautettu versio{' '}
            <a
              href="https://sataako.fi/"
              target="_blank"
              title="Sataako kohta? - Sataako.fi"
            >
              Sataako.fi
            </a>{' '}
            palvelusta, joka on{' '}
            <a
              href="https://twitter.com/p0ra"
              target="_blank"
              rel="noopener noreferrer"
              title="Heikki Pora Twitter"
            >
              Heikki&nbsp;Poran
            </a>{' '}
            käsialaa.{' '}
            <a
              href="https://helle.io/"
              target="_blank"
              title="Christopher Helle"
            >
              Christopher Helle
            </a>{' '}
            rakensi tämän palvelun jotta tarkkojen sadetutkakuvien kautta voi
            seurata sateen kehittymistä ympäri Suomea.
          </p>
          <p>
            Kartalla esitetään{' '}
            <a
              href="https://ilmatieteenlaitos.fi/avoin-data/"
              target="_blank"
              rel="noopener noreferrer"
              title="Ilmatieteenlaitos Avoin Data"
            >
              Ilmatieteen laitoksen
            </a>{' '}
            toimittamia tietoaineistoja. Tiedot ovat kaikille avointa tietoa eli{' '}
            <a
              href="http://www.hri.fi/fi/mita-on-avoin-data/"
              target="_blank"
              rel="noopener noreferrer"
              title="Helsinki Region Infoshare: Mitä on avoin data?"
            >
              avointa dataa
            </a>
            .
          </p>
          <p>
            <PwaInstall
              visible={pwaButtonVisible}
              hidePwaInstall={hidePwaInstall}
              deferredPrompt={deferredPrompt}
            />
          </p>
        </div>
      </div>
    )
  }

  return collapsed ? collapsedInfoPanel() : openInfoPanel()
}

export default InfoPanel
