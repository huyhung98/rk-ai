const smsService = require('../services/smsService');
const markoService = require('../services/markoService');
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
      const marko = new markoService(Body)
      const messageId = await marko.sendRequest()
      await smsService.updateMessageId(MessageSid, messageId);

      res.status(200).json({
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

      const EVENTS = {
        SESSION_IN_PROGRESS: 'session:in_progress',
      };

      if (event === EVENTS.SESSION_IN_PROGRESS && data?.presigned_image_urls?.length > 0) {
        const fileUrl = data.presigned_image_urls[0];
        console.log('File URL:', fileUrl);

        const shortUrl = await urlShortenerService.shortenUrl(fileUrl);
        const modifiedShortUrl = shortUrl.replace('http://', ' ');
        const shortUrlWithoutDot = modifiedShortUrl.replaceAll('.', '(.)');
        console.log('Short URL:', shortUrlWithoutDot);

        const recipientNumber = await smsService.getRecipientNumberByMessageId(messageId);

        const result = await smsService.sendSms(recipientNumber, shortUrlWithoutDot);
        console.log('SMS sent:', result);
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
