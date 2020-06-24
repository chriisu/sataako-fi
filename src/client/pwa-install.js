import React from 'react'

const PwaInstall = ({ visible, hidePwaInstall, deferredPrompt }) => {
  const install = () => {
    hidePwaInstall()
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the pwa install prompt')
      } else {
        console.log('User dismissed the pwa install prompt')
      }
    })
  }

  return visible ? (
    <button onClick={install} className="button-style" id="pwa-install">
      Asenna sovellus laitteelle
    </button>
  ) : null
}

export default PwaInstall
