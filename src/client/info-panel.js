import React, { useState } from 'react'

const InfoPanel = ({ loading, refresh }) => {
  const [collapsed, setCollapsed] = useState(true)
  const [pseudoLoad, setPseudoLoad] = useState(false)

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
      <button id="close-side-info" onClick={() => toggleCollapse(collapsed)}>
        Sulje
      </button>
      {renderContent()}
    </div>
  )

  const toggleCollapse = (current) => {
    setCollapsed(!current)
  }

  return collapsed ? collapsedInfoPanel() : openInfoPanel()
}

module.exports = InfoPanel

const renderContent = () => {
  return (
    <div>
      <div className="logo-container">
        <img
          src="/img/sataako-logo-white.png"
          alt="Sataako kohta logo - sataako.fi"
          title="Sataako kohta logo - sataako.fi"
        />
      </div>
      <div className="description-container">
        <h1>Sade</h1>
        <p>
          Tämän sadetutka on mukautettu versio{' '}
          <a
            href="https://sataako.fi/"
            target="_blank"
            rel="noopener noreferrer"
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
          käsialaa. Tämä sivusto on vielä kehitysvaiheessa mutta{' '}
          <a href="http://helle.io/" target="_blank" title="Christopher Helle">
            Chris Helle
          </a>{' '}
          pyrkii rakentamaan tästä miellyttävän työkalun sadetilanteen
          seurantaan.
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
            open dataa
          </a>
          .
        </p>
      </div>
    </div>
  )
}
