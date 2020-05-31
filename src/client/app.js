import { format, parseISO } from 'date-fns'
import InfoPanel from './info-panel'
import React, { useState, useEffect } from 'react'
import { createMap, panTo, showRadarFrame, determineMapSegment } from './map'
import localforage from 'localforage'
import Slider from 'react-rangeslider'

let map = null
const animationFrameTimeMs = 150

const SataakoApp = () => {
  const [activeFrame, setActiveFrame] = useState({
    frame: null,
    index: 0,
    segment: 12,
  })
  const [frames, setFrames] = useState([])
  const [loadedFrames, setLoadedFrames] = useState([])
  const [mapSettings, setMapSettings] = useState({
    x: 2776307.5078,
    y: 8438349.32742,
    zoom: 7,
  })
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapSegment, setMapSegment] = useState(12)
  const [animationDone, setAnimationDone] = useState(false)

  useEffect(() => {
    reloadFramesList({ ignoreCache: true })
    initMap()
  }, [])

  useEffect(() => {
    if (frames.length && !mapLoading) {
      animationDone
        ? setFrameVisible({ segment: mapSegment, waitLoading: true })
        : setFrameVisible({ index: frames.length - 1 })
      if (loadedFrames.length === frames.length) {
        animationDone ? setLoading(false) : preloadAnimation()
      }
    }
  }, [frames, mapLoading, loadedFrames])

  useEffect(() => {
    map && !mapLoading && activeFrame.frame && showRadarFrame(map, activeFrame)
  }, [activeFrame])

  useEffect(() => {
    pruneLoadedFrames()
  }, [frames])

  useEffect(() => {
    console.log(`useEffect mapSegment ${mapSegment}`)
    if (!loading || activeFrame.segment !== mapSegment) {
      reloadFramesList({ ignoreCache: true })
    }
  }, [mapSegment])

  function preloadAnimation() {
    const preWait = 500
    preloadMapFrames(preWait)
    setTimeout(() => {
      setLoading(false)
      setAnimationDone(true)
      console.log('redi')
    }, preWait + frames.length * animationFrameTimeMs)
  }

  function pruneLoadedFrames() {
    const prunedLoadedFrames = loadedFrames.filter((loadedFrame) =>
      frames.find((frame) => frame.image === loadedFrame)
    )
    prunedLoadedFrames.length !== loadedFrames.length &&
      console.log('∞∞: prunedLoadedFrames', prunedLoadedFrames)
    prunedLoadedFrames.length !== loadedFrames.length &&
      setLoadedFrames(prunedLoadedFrames)
  }

  function preloadMapFrames(preWait) {
    frames.forEach((_, i) =>
      setTimeout(() => {
        setActiveFrame({ ...activeFrame, index: i, frame: frames[i] })
      }, preWait + i * animationFrameTimeMs)
    )
  }

  async function initMap() {
    try {
      const mapSettings = await localforage.getItem('mapSettings')
      console.log('∞∞: initMap -> mapSettings', mapSettings)
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
    const { ignoreCache, segment = mapSegment } = options
    console.log('reloadFramesList')
    setLoading(true)
    const fetchConfig = ignoreCache
      ? {  cache: 'reload' }
      : {}
    console.log('∞∞: reloadFramesList -> fetchConfig', fetchConfig)
    const response = await fetch(
      `/frames-${segment >= 0 ? segment : 12}.json`,
      fetchConfig
    )
    response.ok && setFrames(await response.json())
  }

  function onMapMove() {
    const [x, y] = map.getView().getCenter()
    const zoom = map.getView().getZoom()
    try {
      localforage.setItem('mapSettings', { x, y, zoom })
    } catch (err) {
      console.log(err)
    }
    const currentSegment = determineMapSegment([x, y], zoom)
    updateMapSegment(currentSegment)
  }

  const updateMapSegment = (newSegment) => {
    setMapSegment(newSegment)
  }

  function onLocation(geolocationResponse) {
    panTo(map, [
      geolocationResponse.coords.longitude,
      geolocationResponse.coords.latitude,
    ])
  }

  const radarFrameTimestamp = activeFrame.frame
    ? format(parseISO(activeFrame.frame.timestamp), 'd.M. HH:mm')
    : ''

  function setFrameVisible({
    index = activeFrame.index,
    segment = mapSegment,
    waitLoading = false,
  }) {
    const frameIsLoaded = loadedFrames.find(
      (frame) => frames[index] && frames[index].image === frame
    )
    if (
      (index !== activeFrame.index || segment !== activeFrame.segment) &&
      (!waitLoading || frameIsLoaded)
    ) {
      const frame = frames[index]
      setActiveFrame({ frame, index, segment })
    }
  }

  function sliderTooltip(sliderIndex) {
    return format(parseISO(frames[sliderIndex].timestamp), 'H.mm')
  }

  const currentFrameIsLoaded =
    frames.length > activeFrame.index &&
    activeFrame.frame &&
    loadedFrames.includes(activeFrame.frame.image)

  return (
    <>
      <div id="control">
        {frames.length && (
          <Slider
            value={activeFrame.index}
            max={frames.length - 1}
            orientation="horizontal"
            onChange={(sliderIndex) => setFrameVisible({ index: sliderIndex })}
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

export default SataakoApp
