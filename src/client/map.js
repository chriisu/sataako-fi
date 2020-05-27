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
import GeoJSON from 'ol/format/GeoJSON'
import {transform} from 'ol/proj'

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
register(proj4)
const imageProjection = new Projection({code: 'EPSG:3067'})
const imageSegments = [
  { x1: 50000,  x2: 293333, y1: 6450000, y2: 6762500 },
  { x1: 293333, x2: 536667, y1: 6450000, y2: 6762500 },
  { x1: 536667, x2: 780000, y1: 6450000, y2: 6762500 },
  { x1: 50000,  x2: 293333, y1: 6762500, y2: 7075000 },
  { x1: 293333, x2: 536667, y1: 6762500, y2: 7075000 },
  { x1: 536667, x2: 780000, y1: 6762500, y2: 7075000 },
  { x1: 50000,  x2: 293333, y1: 7075000, y2: 7387500 },
  { x1: 293333, x2: 536667, y1: 7075000, y2: 7387500 },
  { x1: 536667, x2: 780000, y1: 7075000, y2: 7387500 },
  { x1: 50000,  x2: 293333, y1: 7387500, y2: 7700000 },
  { x1: 293333, x2: 536667, y1: 7387500, y2: 7700000 },
  { x1: 536667, x2: 780000, y1: 7387500, y2: 7700000 },
  { x1: 50000, x2: 780000, y1: 6450000, y2: 7700000 }
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
    // projection: 'EPSG:3067',
    zoom
  })

  const attribution = new Attribution({
    collapsible: false
  })
  const map = new Map({
    controls: defaultControls({attribution: false, rotate: false}).extend([attribution]),
    layers: [createMapLayer(), createRadarLayer(), createLightningLayer(), createIconLayer(center)],
    target: 'map',
    view
  })

  // OpenLayers leaves the map distorted on some mobile browsers after screen orientation change
  window.addEventListener('orientationchange', () => location.reload())

  return map
}

function createMapLayer() {
  const attributions = ['&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>']
  const source = new XYZ({url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', attributions})
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

function showRadarFrame(map, {image, lightnings}, mapSegment) {
  if (mapSegment < 0) {
    console.log('showRadarFrame FAIL', mapSegment)
    return
  }
  console.log('showRadarFrame, ', mapSegment)
  const radarImageSource = radarImageSourcesCache[image] || (radarImageSourcesCache[image] = createImageSource(image, mapSegment))
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
  const {x1, x2, y1, y2} = imageSegments[mapSegment]
  const imageExtent = [x1, y1, x2, y2]
  return new ImageStatic({
    imageExtent,
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

function determineMapSegment(coordinates, zoom) {
  const [x, y] = transform(coordinates, 'EPSG:3857', 'EPSG:3067' )
  return zoom < 8
    ? 12
    : imageSegments.findIndex(
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
