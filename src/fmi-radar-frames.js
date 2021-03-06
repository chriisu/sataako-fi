const axios = require('axios')
const FMI = require('./fmi-constants')
const {parseString} = require('xml2js')
const processors = require('xml2js/lib/processors')
const Promise = require('bluebird')
const url = require('url')

const parseXml = Promise.promisify(parseString)

const featureUrl = url.parse(FMI.WFS_FEATURE_URL)
featureUrl.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::radar::composite::rr'
}

const fmiRadarFramesRequestUrl = url.format(featureUrl)
console.log(`Configured radar frames URL: ${fmiRadarFramesRequestUrl}`)

async function fetchRadarImageUrls() {
  const {data} = await axios.get(fmiRadarFramesRequestUrl)
  const wfsResponse = await xmlToObject(data)
  const frameReferences = extractFrameReferences(wfsResponse)
  return frameReferences.flatMap(setProjectionAndCleanupUrl)
}

function xmlToObject(xml) {
  return parseXml(xml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
}

function extractFrameReferences(featureQueryResult) {
  return featureQueryResult.featureCollection.member.map(member =>
    ({
      url: member.gridSeriesObservation[0].result[0].rectifiedGridCoverage[0].rangeSet[0].file[0].fileReference[0],
      timestamp: (new Date(member.gridSeriesObservation[0].phenomenonTime[0].timeInstant[0].timePosition[0])).toISOString()
    })
  )
}

function setProjectionAndCleanupUrl(frameReference) {
  const radarUrl = url.parse(frameReference.url, true)
  radarUrl.host = FMI.WMS_HOST
  radarUrl.query.format = 'image/png'
  radarUrl.query.width = FMI.WIDTH
  radarUrl.query.height = FMI.HEIGHT
  // radarUrl.query.bbox = FMI.EPSG_3067_BOUNDS
  radarUrl.query.srs = FMI.EPSG_3067_SRS
  Reflect.deleteProperty(radarUrl.query, 'styles')
  Reflect.deleteProperty(radarUrl, 'search')
  // return {
  //   url: url.format(radarUrl),
  //   timestamp: frameReference.timestamp
  // }
  return FMI.EPSG_3067_BOUNDS.map((bound, i) => {
    const radarUrlBound = {...radarUrl}
    radarUrlBound.query.bbox = bound

    return {
      url: url.format(radarUrlBound),
      timestamp: frameReference.timestamp,
      area: i
    }
  })
}

module.exports = {
  fetchRadarImageUrls
}
