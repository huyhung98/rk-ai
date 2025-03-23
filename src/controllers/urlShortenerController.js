const UrlShortenerService = require('../services/urlShortenerService')
const urlShortenerService = new UrlShortenerService() // Singleton instance

class UrlShortenerController {
  async redirectToOriginalUrl(req, res, next) {
    const { shortId } = req.params

    if (!shortId) {
      const error = new Error('Missing required parameter: shortId')
      error.statusCode = 400
      return next(error)
    }

    try {
      const originalUrl = await urlShortenerService.getOriginalUrl(shortId)

      res.redirect(originalUrl)
    } catch (err) {
      console.error('Error retrieving the original URL:', err)
      next(err)
    }
  }
}

module.exports = UrlShortenerController
