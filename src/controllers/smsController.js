const smsService = require('../services/smsService');
const markoService = require('../services/markoService');
const redisService = require('../services/redisService');

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

    try {
      await smsService.saveReceivedSms(From, To, Body, MessageSid);
      const marko = new markoService()

      const channel_id = await marko.sendRequest(req.body.body)
      console.log('Channel ID:', channel_id);

      const messageBody = await redisService.getSessionMessage(channel_id);
      console.log('Message body:', messageBody);

      const result = await smsService.sendSms(req.body.from, messageBody);
      res.json(result);
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
      console.log("Received Webhook Request:");
      console.log("Header:", req.header);
      console.log("Body:", req.body);

      res.status(200).json({
        success: true
      })
    } catch (error) {
      console.log("Error in webhook controller:", error);
      res.status(500).json({
        error: error.message
      })
    }
  }
}

module.exports = new SmsController();