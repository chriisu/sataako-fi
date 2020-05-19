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
const CACHE_AGE = 3 * 60 * 60 * 1000

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
      console.log(
        `∞∞\nradarImageUrls: ${radarImageUrls.length} (new: ${newImageUrls.length})`
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
  for (const { url, timestamp } of imageUrls) {
    try {
      await fetchPostProcessedRadarFrame(
        url,
        path.join(CACHE_FOLDER, timestamp)
      )
      console.log('cache.push: ', timestamp)
      IMAGE_CACHE.push({ timestamp, url })
    } catch (err) {
      console.error(`Failed to fetch radar image from ${url}: ${err.message}`)
    }
  }
}

async function fetchAndCacheImage(url, timestamp) {
  const filePath = path.join(CACHE_FOLDER, timestamp)
  try {
    await fetchPostProcessedRadarFrame(url, filePath)
    Promise.all([
      await syncToS3(`${filePath}.png`, `frame/${timestamp}.png`),
      await syncToS3(`${filePath}.webp`, `frame/${timestamp}.webp`),
    ])
  } catch (err) {
    console.error(`Failed to fetch radar image from ${url}: ${err.message}`)
  }
}

async function pruneCache(expiringAgeMs = 60 * 60 * 1000) {
  const removed = _.remove(
    IMAGE_CACHE,
    (image) => Date.now() - new Date(image.timestamp).getTime() > expiringAgeMs
  )
  removed.length > 0 && console.log('pruneCache removed items:', removed.length)
  for (const { timestamp } of removed) {
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.png`))
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.webp`))
  }
}

function imageFileForTimestamp(timestamp) {
  const image = _.find(IMAGE_CACHE, { timestamp })
  if (!image) {
    return null
  }

  return {
    png: path.join(CACHE_FOLDER, `${timestamp}.png`),
    webp: path.join(CACHE_FOLDER, `${timestamp}.webp`),
  }
}

function framesList(publicFramesRootUrl) {
  return _(IMAGE_CACHE)
    .map(({ timestamp }) => ({
      image: publicFramesRootUrl + timestamp,
      lightnings: coordinatesForLightnings(timestamp),
      timestamp,
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
