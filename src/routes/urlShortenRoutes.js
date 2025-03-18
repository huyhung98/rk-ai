// src/routes/urlShortenRoutes.js
const express = require('express');
const router = express.Router();
const urlShortenerController = require('../controllers/urlShortenerController');

router.get('/:shortId', urlShortenerController.redirectToLongUrl);

module.exports = router;