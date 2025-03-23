const { randomUUID } = require('crypto')
const ShortenedUrl = require('../models/shortened_url')

class UrlShortenerService {
  generateShortUrl = async (shortId) => `${process.env.MARKO_POC_BASE_URL}/${shortId}`

  shortenUrl = async (originalUrl) => {
    try {
      const existingShortenedUrl = await ShortenedUrl.findOne({ originalUrl })
      if (existingShortenedUrl) {
        return this.generateShortUrl(existingShortenedUrl.shortId)
      }

      const shortId = randomUUID().slice(0, 8)
      const shortenedUrl = new ShortenedUrl({
        shortId,
        originalUrl,
      })
      await shortenedUrl.save()

      return this.generateShortUrl(shortId)
    } catch (err) {
      console.error('Error shortening URL:', err)
      throw err
    }
  }

  getOriginalUrl = async (shortId) => {
    try {
      const shortenedUrl = await ShortenedUrl.findOne({ shortId })

      if (!shortenedUrl) {
        const error = new Error('Shortened URL not found')
        error.statusCode = 404
        throw error
      }

      return shortenedUrl.originalUrl
    } catch (err) {
      console.error(`Error retrieving original URL for shortId ${shortId}:`, err)
      throw err
    }
  }
}

module.exports = UrlShortenerService
