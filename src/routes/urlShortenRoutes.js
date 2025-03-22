const express = require('express')
const router = express.Router()
const UrlShortenerController = require('../controllers/urlShortenerController')

const urlShortenerController = new UrlShortenerController()

router.get('/:shortId', urlShortenerController.redirectToOriginalUrl)

module.exports = router
