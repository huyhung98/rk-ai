const smsService = require('../services/smsService');
const markoService = require('../services/markoService');
const redisService = require('../services/redisService');
const urlShortenerService = require('../services/urlShortenerService');

class SmsController {
  async sendSms(req, res) {
    const { to, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to and body'
      });
    }

    try {
      const result = await smsService.sendSms(to, body);
      res.json(result);
    } catch (error) {
      console.error('Error in sendSms controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async receiveSms(req, res) {
    const { From, To, Body, MessageSid } = req.body;
    console.log('Received SMS:', req.body);

    try {
      await smsService.saveReceivedSms(From, To, Body, MessageSid);
      const marko = new markoService()

      const messageId = await marko.sendRequest(Body)
      console.log('message ID:', messageId);

      if (messageId) {
        await smsService.updateMessageId(MessageSid, messageId);
      }

      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error in receiveSms controller:', error);
      res.status(500).send('Error processing message');
    }
  }

  async getMessages(_req, res) {
    try {
      const messages = await smsService.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error('Error in getMessages controller:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }

  async webhook(req, res) {
    try {
      const {event, data, messageId, error} = req.body;
      console.log('Webhook data:', req.body);

      if (event === 'session:in_progress' && data && data.public_image_url && data.public_image_url.length > 0) {
        const fileUrl = data.public_image_url[0];
        // Shorten the file URL
        const shortUrl = await urlShortenerService.shortenUrl(fileUrl);

        // Query the recipient number using messageId
        const recipientNumber = await smsService.getRecipientNumberByMessageId(messageId);
        // Send the SMS to the recipient number
        const result = await smsService.sendSms(recipientNumber, shortUrl);
        res.json(result);
      }
    } catch (error) {
      console.log("Error in webhook controller:", error);
      res.status(500).json({
        error: error.message
      })
    }
  }
}

module.exports = new SmsController();
