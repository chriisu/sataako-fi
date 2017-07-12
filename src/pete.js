const _ = require('lodash')
const cheerio = require('cheerio')
const errors = require('request-promise/errors')
const municipalities = require('./kunnat.json')
const proj4 = require('proj4')
const request = require('request-promise')

let GIGS_CACHE = []

request('http://warnermusiclive.fi/artistit/pete-parkkonen/')
  .then(parseHtml)
  .then(includeLocation)
  .then(uniqueByMunicipality)
  .then(gigs => {
    GIGS_CACHE = gigs
    // eslint-disable-next-line no-console
    console.log('Loaded gigs list', gigs)
  })
  .catch(errors.StatusCodeError, reason => {
    // eslint-disable-next-line no-console
    console.error(`Failed to load gigs. Server returned HTTP status ${reason.statusCode}`)
  })

function parseHtml(html) {
  const $ = cheerio.load(html)
  return $('#gigList > ul.gigs > li').map((index, element) => {
    const date = $(element).find('b.date').text().trim()
    const venue = $(element).find('li.venue').text().trim()
    const link = $(element).find('li.links a').filter(isPageLink($)).attr('href')
    return {date, venue, link}
  }).get()
}

function isPageLink($) {
  return (index, element) => $(element).text().trim() === '» Sivut'
}

function includeLocation(gigs) {
  return gigs.map(gig => {
      const municipality = gig.venue.split(',').shift()
      const location = municipalities[municipality]
      if (location) {
        const coordinates = proj4('WGS84', 'EPSG:3857', [location.Longitude, location.Latitude])
        return _.extend({}, gig, {municipality, coordinates})
      }
      return gig
    })
    .filter(gig => gig.coordinates)
}

function uniqueByMunicipality(gigs) {
  return _.uniqBy(gigs, 'municipality')
}

function gigsList() {
  return GIGS_CACHE
}

module.exports = {
  gigsList
}
