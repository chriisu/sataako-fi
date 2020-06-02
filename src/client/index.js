import ReactDOM from 'react-dom'
import React from 'react'
import SataakoApp from './app'

async function installServiceWorkerAsync() {
  try {
    let serviceWorker = await navigator.serviceWorker.register('/sw.js')
    console.log(`Service worker registered ${serviceWorker}`)
  } catch (err) {
    console.error(`Failed to register service worker: ${err}`)
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    installServiceWorkerAsync()
  })
}

ReactDOM.render(<SataakoApp />, document.getElementById('app'))
