const _ = require('lodash')
const { fetchPostProcessedRadarFrame } = require('./fmi-radar-images')
const { fetchRadarImageUrls } = require('./fmi-radar-frames')
const { fetchLightnings } = require('./fmi-lightnings')
const fs = require('fs')
const os = require('os')
const path = require('path')
const axios = require('axios')
const S3 = require('aws-sdk/clients/s3')

/* eslint-disable no-await-in-loop */

const CACHE_FOLDER = fs.mkdtempSync(path.join(os.tmpdir(), 'sataako-frames-'))
console.log(`Radar frames cached at ${CACHE_FOLDER}`)

const IMAGE_CACHE = []
const LIGHTNING_CACHE = []
const REFRESH_ONE_MINUTE = 60 * 1000
const BUCKET_NAME = process.env.S3_BUCKET_NAME

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

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
      await pruneCache(radarImageUrls)
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
    const fileName = path.join(CACHE_FOLDER, timestamp)
    try {
      const response = await axios.head(
        `http://sade.s3.amazonaws.com/frame/${timestamp}`
      )
      console.log(`${timestamp.slice(0, 16)}: ${response.status}`)
    } catch (error) {
      const httpStatus = _.get(error, 'response.status')
      console.log(`${timestamp.slice(0, 16)}: ${httpStatus}`)

      if (httpStatus >= 400 && httpStatus < 500) {
        await fetchAndCacheImage(url, fileName, timestamp)
      }
    }
    IMAGE_CACHE.push({ timestamp, url })
  }
}

async function fetchAndCacheImage(url, fileName, timestamp) {
  try {
    await fetchPostProcessedRadarFrame(url, fileName)
    Promise.all([
      await syncToS3(`${fileName}.png`, timestamp),
      await syncToS3(`${fileName}.webp`, timestamp),
    ])
  } catch (err) {
    console.error(`Failed to fetch radar image from ${url}: ${err.message}`)
  }
}

async function syncToS3(filePath, timestamp) {
  await uploadToS3(filePath, timestamp)
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (err) {
    console.error(`Temp file removing error: ${err.message}`)
  }
}

async function uploadToS3(file, timestamp) {
  try {
    const fileContent = fs.readFileSync(file)
    const params = {
      Bucket: BUCKET_NAME,
      Key: `frame/${timestamp}`,
      Body: fileContent,
    }
    const data = await s3bucket.upload(params, (err, data) => {
      if (err) {
        throw err
      }
      console.log(`Frame uploaded to s3: ${data.Location}`)
      return data
    })
    return data
  } catch (err) {
    console.error(`Failed to save frame to S3 for ${timestamp}: ${err.message}`)
  }
}

async function pruneCache(validImageUrls) {
  const removed = _.remove(
    IMAGE_CACHE,
    ({ url }) => !_.find(validImageUrls, { url })
  )
  removed.length > 0 && console.log('pruneCache removed items:', removed.length)
  // for (const { timestamp } of removed) {
  //   await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.png`))
  //   await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.webp`))
  // }
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
