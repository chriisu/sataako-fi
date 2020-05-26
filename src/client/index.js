import axios from 'axios'
import { format, parseISO } from 'date-fns'
import InfoPanel from './info-panel'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createMap, panTo, showRadarFrame } from './map'
import localforage from 'localforage'
import Slider from 'react-rangeslider'

let map = null

const SataakoApp = () => {
  const [frameIndex, setFrameIndex] = useState(0)
  const [frames, setFrames] = useState([])
  const [loadedFrames, setLoadedFrames] = useState([])
  const [mapSettings, setMapSettings] = useState({
    x: 2776307.5078,
    y: 8438349.32742,
    zoom: 7,
  })
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    reloadFramesList()
    initMap()
  }, [])

  useEffect(() => {
    if (frames.length && !mapLoading) {
      setFrameVisible(frames.length - 1)
      console.log(
        `loadedFrames.length: ${loadedFrames.length} (${frames.length})`
      )
      if (loadedFrames.length === frames.length) {
        console.log('redi')
        setLoading(false)
      }
    }
  }, [frames, mapLoading, loadedFrames])

  useEffect(() => {
    pruneLoadedFrames()
  }, [frames])

  function pruneLoadedFrames() {
    console.log('pruneLoadedFrames')
    const prunedLoadedFrames = loadedFrames.filter((loaded) =>
      frames.find((frame) => frame.image === loaded)
    )
    prunedLoadedFrames.length !== loadedFrames.length &&
      setLoadedFrames(prunedLoadedFrames)
  }

  async function initMap() {
    try {
      const mapSettings = await localforage.getItem('mapSettings')
      setMapSettings(mapSettings)
    } catch (err) {
      console.log(err)
    }
    map = createMap(mapSettings)
    map.on('moveend', onMapMove)
    map.on('rendercomplete', () => {
      setMapLoading(false)
    })
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onLocation)
    }
  }

  function renderFrameImages() {
    const handleLoad = (frame) =>
      setLoadedFrames([...loadedFrames, frame.image])
    const handleError = (frame) =>
      console.log('!!!!FrameError!!!!', frame.image)

    return frames.map((frame) => (
      <img
        key={frame.image}
        src={frame.image}
        onLoad={() => handleLoad(frame)}
        onError={() => handleError(frame)}
      />
    ))
  }

  async function reloadFramesList(options = {}) {
    const { ignoreCache } = options
    console.log('reloadFramesList')
    setLoading(true)
    const reqConfig = ignoreCache
      ? { headers: { 'Cache-Control': 'no-cache' } }
      : {}
    const response = await axios.get('/frames.json', reqConfig)
    console.log(response.status)
    response.status === 200 && setFrames(response.data)
  }

  function onMapMove() {
    const [x, y] = map.getView().getCenter()
    const zoom = map.getView().getZoom()
    try {
      localforage.setItem('mapSettings', { x, y, zoom })
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
    if (newFrameIndex !== frameIndex) {
      setFrameIndex(newFrameIndex)
      showRadarFrame(map, frames[newFrameIndex])
    }
  }

  function sliderTooltip(sliderIndex) {
    return format(parseISO(frames[sliderIndex].timestamp), 'H.mm')
  }

  const currentFrameIsLoaded =
    frames.length > frameIndex &&
    loadedFrames.includes(frames[frameIndex].image)

  return (
    <>
      <div id="control">
        {frames.length && (
          <Slider
            value={frameIndex}
            max={frames.length - 1}
            orientation="horizontal"
            onChange={(sliderIndex, map) => setFrameVisible(sliderIndex, map)}
            format={sliderTooltip}
          />
        )}
      </div>
      <div id="map"></div>
      <div id="loading-frame" className={currentFrameIsLoaded ? '' : 'loading'}>
        <div className="loader">Loading...</div>
      </div>
      <div id="preload-frames">{renderFrameImages()}</div>
      <div className="radar-timestamp">
        <span>{radarFrameTimestamp}</span>
      </div>
      <InfoPanel loading={loading} refresh={reloadFramesList} />
    </>
  )
}

ReactDOM.render(<SataakoApp />, document.getElementById('app'))
