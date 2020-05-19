import axios from 'axios'
import { format, parseISO } from 'date-fns'
import InfoPanel from './info-panel'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createMap, panTo, showRadarFrame } from './map'
import localforage from 'localforage'
import Slider from 'react-rangeslider'

const FRAME_DELAY_MS = 500
const FRAME_LOOP_DELAY_MS = 5000

let map = null

const SataakoApp = () => {
  const [frameIndex, setFrameIndex] = useState(0)
  const [frames, setFrames] = useState([])
  const [mapSettings, setMapSettings] = useState({
    x: 2776307.5078,
    y: 8438349.32742,
    zoom: 7,
  })

  useEffect(() => {
    reloadFramesList()
    initMap()
  }, [])

  async function initMap() {
    try {
      const mapSettings = await localforage.getItem('mapSettings')
      setMapSettings(mapSettings)
    } catch (err) {
      console.log(err)
    }
    map = createMap(mapSettings)
    map.on('moveend', onMapMove)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onLocation)
    }
  }

  function renderFrameImages() {
    return frames.map((frame) => <img key={frame.image} src={frame.image} />)
  }

  async function reloadFramesList() {
    const response = await axios.get('/frames.json')
    console.log(response.status)
    response.status === 200 && setFrames(response.data)

  }

  function onMapMove() {
    const [x, y] = map.getView().getCenter()
    const zoom = map.getView().getZoom()
    try {
      localforage.setItem('mapSettings', { x, y, zoom })
      console.log('mapSettings localforage', { x, y, zoom })
    } catch (err) {
      console.log(err)
    }
  }

  function onLocation(geolocationResponse) {
    panTo(map, [
      geolocationResponse.coords.longitude,
      geolocationResponse.coords.latitude,
    ])
  }

  const radarFrameTimestamp = frames[frameIndex]
    ? format(parseISO(frames[frameIndex].timestamp), 'd.M. HH:mm')
    : ''

  function setFrameVisible(newFrameIndex) {
    setFrameIndex(newFrameIndex)
    showRadarFrame(map, frames[newFrameIndex])
  }

  const sliderTooltip = (sliderIndex) => {
    const stringi = format(parseISO(frames[sliderIndex].timestamp), 'HH.mm')
    return stringi
  }

  return (
    <>
      <div id="control">
        {frames.length && (
          <Slider
            value={frameIndex}
            max={frames.length - 1 || 0}
            orientation="horizontal"
            onChange={(sliderIndex, map) => setFrameVisible(sliderIndex, map)}
            format={sliderTooltip}
          />
        )}
      </div>
      <div id="map"></div>
      <div id="preload-frames">{renderFrameImages()}</div>
      <div className="radar-timestamp">
        <span>{radarFrameTimestamp}</span>
      </div>
      <InfoPanel />
    </>
  )
}

ReactDOM.render(<SataakoApp />, document.getElementById('app'))
