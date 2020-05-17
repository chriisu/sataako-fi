import React from 'react'

class InfoPanel extends React.Component {
  constructor() {
    super()
    this.state = {
      collapsed: localStorage.getItem('sataako-fi-collapsed') === 'true'
    }
  }

  render() {
    if (this.state.collapsed) {
      return <div id="side-info-panel-open" onClick={this.expand.bind(this)}>&lt;</div>
    }

    return <div className="side-info-panel">
      <button id="close-side-info" onClick={this.collapse.bind(this)}>Sulje</button>
      {this.renderContent()}
    </div>
  }

  renderContent() {
    return <div>
      <div className="logo-container">
        <img src="/img/sataako-logo-white.png" alt="Sataako kohta logo - sataako.fi" title="Sataako kohta logo - sataako.fi" />
      </div>
      <div className="description-container">
        <h1>Sade</h1>
        <p>Tämän palvelu on keskeneräinen mukautettu versio <a href="https://twitter.com/p0ra" target="_blank" rel="noopener noreferrer" title="Heikki Pora Twitter">Heikki&nbsp;Poran</a> rakentamasta sade-tutkasivustosta <a href="https://sataako.fi/" target="_blank" rel="noopener noreferrer" title="Sataako kohta? - Sataako.fi">Sataako.fi</a>.</p>
        <p>Kartalla esitetään <a href="https://ilmatieteenlaitos.fi/avoin-data/" target="_blank" rel="noopener noreferrer" title="Ilmatieteenlaitos Avoin Data">Ilmatieteen laitoksen</a> toimittamia tietoaineistoja. Tiedot ovat kaikille avointa tietoa eli <a href="http://www.hri.fi/fi/mita-on-avoin-data/" target="_blank" rel="noopener noreferrer" title="Helsinki Region Infoshare: Mitä on avoin data?">open dataa</a>.</p>
      </div>
    </div>
  }

  collapse() {
    this.setState({collapsed: true})
    localStorage.setItem('sataako-fi-collapsed', 'true')
  }

  expand() {
    this.setState({collapsed: false})
    localStorage.setItem('sataako-fi-collapsed', 'false')
  }
}

module.exports = InfoPanel
