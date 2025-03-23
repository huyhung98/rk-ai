const express = require('express')
const router = express.Router()
const SmsController = require('../controllers/smsController')

const smsController = new SmsController()

router.post('/receive', smsController.receiveSmsMessage)
router.post('/webhook', smsController.smsMessageInboundWebhook)
router.post('/send', smsController.sendSmsMessage)
router.get('/conversations', smsController.getConversations)
router.get('/conversation/:phoneNumber', smsController.getConversationByPhoneNumber)
router.get('/conversations/:phoneNumber/messages', smsController.getSmsMessagesByPhoneNumber)

module.exports = router
