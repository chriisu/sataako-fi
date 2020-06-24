const compression = require('compression')
const proxy = require('express-http-proxy')
const express = require('express')
const cors = require('cors')
const { imageFileForTimestamp, framesList } = require('./cache')

const PORT = process.env.PORT || 3000
const PUBLIC_URL_PORT = process.env.NODE_ENV === 'production' ? '' : `:${PORT}`
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || ''

const app = express()
app.disable('x-powered-by')
if (process.env.NODE_ENV == 'production') {
  app.enable('trust proxy')
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else next()
  })
} else {
  // eslint-disable-next-line global-require
  const { bindDevAssets } = require('./dev-assets')
  bindDevAssets(app)
}
app.use(compression())
app.use(express.static(`${__dirname}/../public`))

app.use(
  '/tiles',
  cors({ origin: 'https://api.mapbox.com' }),
  proxy('https://api.mapbox.com', {
    proxyReqPathResolver: (req) => {
      const parts = req.url.split('/')
      const path = `/styles/v1/chriisu/ckbrowk230cws1imri0q5qma2/tiles/256/${parts[1]}/${parts[2]}/${parts[3]}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`
      return path
    },
  })
)

app.get('/frame/:timestamp/:area', (req, res) => {
  const { timestamp, area } = req.params
  const image = imageFileForTimestamp(timestamp, Number(area))
  if (image) {
    res.set('Cache-Control', 'public, max-age=86400')
    res.format({
      'image/png': () => {
        res.set('Content-Type', 'image/png')
        res.sendFile(image.png)
      },
      'image/webp': () => {
        res.set('Content-Type', 'image/webp')
        res.sendFile(image.webp)
      },
    })
  } else {
    res.status(404).send('Sorry, no radar image found for that timestamp')
  }
})

app.get('/frames-:segment.json', (req, res) => {
  const publicRootUrl = `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/`
  res.set('Cache-Control', 'public, max-age=60')
  res.json(framesList(publicRootUrl, req.params.segment))
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
