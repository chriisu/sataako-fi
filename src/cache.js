const _ = require('lodash')
const { fetchPostProcessedRadarFrame } = require('./fmi-radar-images')
const { fetchRadarImageUrls } = require('./fmi-radar-frames')
const { fetchLightnings } = require('./fmi-lightnings')
const fs = require('fs')
const os = require('os')
const path = require('path')

/* eslint-disable no-await-in-loop */

const CACHE_FOLDER = fs.mkdtempSync(path.join(os.tmpdir(), 'sataako-frames-'))
console.log(`Radar frames cached at ${CACHE_FOLDER}`)

const IMAGE_CACHE = []
const LIGHTNING_CACHE = []
const REFRESH_ONE_MINUTE = 60 * 1000
const CACHE_AGE = 4 * 60 * 60 * 1000

refreshCache()

async function refreshCache() {
  await refreshRadarCache()
  await refreshLightningCache(getFrameTimestampsAsDates())

  setTimeout(refreshCache, REFRESH_ONE_MINUTE)

  async function refreshRadarCache() {
    try {
      const radarImageUrls = await fetchRadarImageUrls()
      const newImageUrls = radarImageUrls.filter(
        ({ url }) => !_.find(IMAGE_CACHE, { url })
      )
      await syncImages(newImageUrls)
      await pruneCache(CACHE_AGE)
      console.log('IMAGE_CACHE', IMAGE_CACHE.length)
    } catch (err) {
      console.error(
        `Failed to fetch radar frames list from FMI API: ${err.message}`
      )
    }
  }

  async function refreshLightningCache(frameTimestamps) {
    try {
      const cacheSize = LIGHTNING_CACHE.length
      const lightnings = await fetchLightnings(frameTimestamps)
      for (const lightning of lightnings) {
        LIGHTNING_CACHE.push(lightning)
      }
      LIGHTNING_CACHE.splice(0, cacheSize)
    } catch (err) {
      console.error(
        `Failed to fetch lightning list from FMI API: ${err.message}`
      )
    }
  }
}

async function syncImages(imageUrls) {
  for (const [index, { url, timestamp, area }] of imageUrls.entries()) {
    const fileName = `${timestamp}_${area}`
    try {
      await fetchPostProcessedRadarFrame(
        url,
        path.join(CACHE_FOLDER, fileName)
      )
      console.log('cache.push: ', fileName)
      IMAGE_CACHE.push({ timestamp, url, area })
    } catch (err) {
      console.error(`Failed to fetch radar image from ${url}: ${err.message}`)
    }
  }
}

async function pruneCache(expiringAgeMs = 60 * 60 * 1000 * 4) {
  const removed = _.remove(
    IMAGE_CACHE,
    (image) => Date.now() - new Date(image.timestamp).getTime() > expiringAgeMs
  )
  removed.length > 0 && console.log(`pruneCache removed items (${removed.length}):`, removed)
  for (const { timestamp } of removed) {
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.png`))
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.webp`))
  }
}

function imageFileForTimestamp(timestamp, area) {
  const image = _.find(IMAGE_CACHE, { timestamp, area })
  if (!image) {
    return null
  }

  return {
    png: path.join(CACHE_FOLDER, `${timestamp}_${area}.png`),
    webp: path.join(CACHE_FOLDER, `${timestamp}_${area}.webp`),
  }
}

function framesList(publicFramesRootUrl, segment = 12) {
  return _(IMAGE_CACHE)
    .filter(frame => Number(frame.area) === Number(segment))
    .map(({ timestamp, area }) => ({
      image: publicFramesRootUrl + timestamp + '/' + area,
      lightnings: coordinatesForLightnings(timestamp),
      timestamp,
      area
    }))
    .sortBy(['timestamp'])
    .value()
}

function getFrameTimestampsAsDates() {
  return _(IMAGE_CACHE)
    .map('timestamp')
    .sort()
    .map((ts) => new Date(ts))
    .value()
}

function coordinatesForLightnings(timestamp) {
  const { locations } = _.find(LIGHTNING_CACHE, { timestamp }) || {}
  return locations || []
}

module.exports = {
  imageFileForTimestamp,
  framesList,
}
