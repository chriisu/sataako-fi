const compression = require('compression')
const express = require('express')
const { framesList } = require('./cache')
const { sendFileFromS3 } = require('./s3-bucket')

const PORT = process.env.PORT || 3000
const PUBLIC_URL_PORT = process.env.NODE_ENV === 'production' ? '' : `:${PORT}`

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

app.get('/frame/:timestamp', async (req, res) => {
  const { timestamp } = req.params
  res.set('Cache-Control', 'public, max-age=86400')
  res.format({
    'image/png': () => {
      res.set('Content-Type', 'image/png')
      sendFileFromS3(`frame/${timestamp}.png`, res)
    },
    'image/webp': () => {
      res.set('Content-Type', 'image/webp')
      sendFileFromS3(`frame/${timestamp}.webp`, res)
    },
  })
})

app.get('/frames.json', (req, res) => {
  // const publicRootUrl = `${req.protocol}://${S3_BUCKET}.s3.amazonaws.com/frame/`
  const publicRootUrl = `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/`
  res.set('Cache-Control', 'public, max-age=60')
  res.json(framesList(publicRootUrl))
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
