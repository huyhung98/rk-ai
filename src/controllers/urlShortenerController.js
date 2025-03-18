const urlShortenerService = require('../services/urlShortenerService');

class UrlShortenerController {
  async redirectToLongUrl(req, res) {
    const { shortId } = req.params;

    try {
      const longUrl = await urlShortenerService.getLongUrl(shortId);
      res.redirect(longUrl);
    } catch (error) {
      console.error('Error in redirectToLongUrl controller:', error);
      res.status(404).send('URL not found');
    }
  }
}

module.exports = new UrlShortenerController();