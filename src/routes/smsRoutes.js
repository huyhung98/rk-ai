const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.post('/send', smsController.sendSms);
router.post('/receive', smsController.receiveSms);
router.get('/messages', smsController.getMessages);

module.exports = router;