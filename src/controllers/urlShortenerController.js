const urlShortenerService = require('../services/urlShortenerService');

class UrlShortenerController {
  async redirectToOriginalUrl(req, res) {
    const { shortId } = req.params;

    try {
      const OriginalUrl = await urlShortenerService.getOriginalUrl(shortId);
      res.redirect(OriginalUrl);
    } catch (error) {
      console.error('Error in redirectToOriginalUrl controller:', error);
      res.status(404).send('URL not found');
    }
  }
}

module.exports = new UrlShortenerController();