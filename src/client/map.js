import Feature from 'ol/Feature'
import {register} from 'ol/proj/proj4'
import Icon from 'ol/style/Icon'
import Image from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import Map from 'ol/Map'
import Point from 'ol/geom/Point'
import proj4 from 'proj4'
import Projection from 'ol/proj/Projection'
import Style from 'ol/style/Style'
import Tile from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import View from 'ol/View'
import XYZ from 'ol/source/XYZ'
import {fromLonLat} from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import {defaults as defaultControls, Attribution} from 'ol/control'
import {defaults as defaultInteractions} from 'ol/interaction'
import GeoJSON from 'ol/format/GeoJSON'
import {transform} from 'ol/proj'

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
register(proj4)
const imageProjection = new Projection({code: 'EPSG:3067'})
const imageSegments = [
  [50000, 6450000, 390000, 6875000],
  [240000, 6450000, 580000, 6875000],
  [430000, 6450000, 770000, 6875000],
  [50000, 6725000, 390000, 7150000],
  [240000, 6725000, 580000, 7150000],
  [430000, 6725000, 770000, 7150000],
  [50000, 7000000, 390000, 7425000],
  [240000, 7000000, 580000, 7425000],
  [430000, 7000000, 770000, 7425000],
  [50000, 7275000, 390000, 7700000],
  [240000, 7275000, 580000, 7700000],
  [430000, 7275000, 770000, 7700000],

  [50000, 6450000, 770000, 7362500], //zoomedOut
  [50000, 6787500, 770000, 7700000], //zoomedOut
]
const segments = [
  { x1: 50000, x2: 290000, y1: 6450000, y2: 6762500 },
  { x1: 290000, x2: 530000, y1: 6450000, y2: 6762500 },
  { x1: 530000, x2: 770000, y1: 6450000, y2: 6762500 },
  { x1: 50000, x2: 290000, y1: 6762500, y2: 7075000 },
  { x1: 290000, x2: 530000, y1: 6762500, y2: 7075000 },
  { x1: 530000, x2: 770000, y1: 6762500, y2: 7075000 },
  { x1: 50000, x2: 290000, y1: 7075000, y2: 7387500 },
  { x1: 290000, x2: 530000, y1: 7075000, y2: 7387500 },
  { x1: 530000, x2: 770000, y1: 7075000, y2: 7387500 },
  { x1: 50000, x2: 290000, y1: 7387500, y2: 7700000 },
  { x1: 290000, x2: 530000, y1: 7387500, y2: 7700000 },
  { x1: 530000, x2: 770000, y1: 7387500, y2: 7700000 }
]

// const imageExtent = [20000, 6450000, 770000, 7000000]

function createMap(settings) {
  const {x, y, zoom} = settings
  const center = [x, y]
  const view = new View({
    center,
    minZoom: 5,
    maxZoom: 13,
    projection: 'EPSG:3857',
    zoom
  })

  const attribution = new Attribution({
    collapseLabel: 'i'
  })
  const map = new Map({
    interactions: defaultInteractions({pinchRotate: false}),
    controls: defaultControls({ rotate: false}).extend([attribution]),
    layers: [createMapLayer(), createRadarLayer(), createLightningLayer(), createIconLayer(center)],
    target: 'map',
    view
  })

  // OpenLayers leaves the map distorted on some mobile browsers after screen orientation change
  window.addEventListener('orientationchange', () => location.reload())

  return map
}

function createMapLayer() {
  const attributions = [
    '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox</a>',
    '<a href="http://www.openstreetmap.org/about/" target="_blank">&copy; OpenStreetMap</a>',
    '<a class="bold" href="https://apps.mapbox.com/feedback/?owner=chriisu&id=ckbrowk230cws1imri0q5qma2#/24.243/60.695/8.03">Improve this map</a>',
  ]

  const source = new XYZ({
    url: '/tiles/{z}/{x}/{y}',
    tilePixelRatio: 2,
    tileSize: [512, 512],
    attributions,
  })
  return new Tile({source})
}

function createRadarLayer() {
  return new Image({opacity: 0.8, visible: false})
}

function createIconLayer(position) {
  const style = new Style({
    image: new Icon({
      anchor: [0.5, 1.0],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      scale: 0.33,
      src: '/img/pin.png'
    })
  })

  const iconFeature = new Feature({
    geometry: new Point(position)
  })
  iconFeature.setStyle(style)

  const source = new VectorSource({features: [iconFeature]})
  return new VectorLayer({source})
}

const radarImageSourcesCache = {}

function showRadarFrame(map, {frame, segment, index}) {
  const {image, lightnings} = frame
  if (segment < 0) {
    console.log('showRadarFrame FAIL', segment)
    return
  }
  const radarImageSource = radarImageSourcesCache[image] || (radarImageSourcesCache[image] = createImageSource(image, segment))
  const radarLayer = map.getLayers().getArray()[1]
  radarLayer.setSource(radarImageSource)
  radarLayer.setVisible(true)
  if (lightnings) {
    const lightningLayer = map.getLayers().getArray()[2]
    lightningLayer.setVisible(true)
    const featureObj = {
      type: 'Feature',
      geometry: {
        type: 'MultiPoint',
        coordinates: lightnings.map(coord => fromLonLat(coord))
      }
    }
    const lightningFeature = (new GeoJSON()).readFeature(featureObj)
    lightningLayer.setSource(new VectorSource({
      features: [lightningFeature]
    }))
  }
}

function createLightningLayer() {
  const source = new VectorSource()
  return new VectorLayer({
    source,
    style: new Style({
        image: new Icon({
          anchor: [0, 1.0],
          src: '/img/lightning.png'
        })
      })
  })
}

function createImageSource(url, mapSegment) {
  return new ImageStatic({
    imageExtent: imageSegments[mapSegment],
    projection: imageProjection,
    url
  })
}

function panTo(map, lonLat) {
  const center = fromLonLat(lonLat);
  const vectorLayer = map.getLayers().getArray()[3]
  const vectorFeature = vectorLayer.getSource().getFeatures()[0]
  vectorFeature.setGeometry(new Point(center))
  map.getView().animate({center, duration: 1000})
}

function determineMapSegment(coordinates, zoom, previousSegment) {
  const [x, y] = transform(coordinates, 'EPSG:3857', 'EPSG:3067' )
  const determineZoomedOutSegment = (yCoord) => yCoord > 7075000 ? 13 : 12
  return zoom < 7.5
    ? determineZoomedOutSegment(y)
    : segments.findIndex(
        (segment) =>
          x >= segment.x1 && x < segment.x2 && y >= segment.y1 && y < segment.y2
      )
}

export {
  createMap,
  panTo,
  showRadarFrame,
  determineMapSegment
}
