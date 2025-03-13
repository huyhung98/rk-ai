const smsService = require('../services/smsService');

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
      
      // Respond to Twilio with TwiML
      res.set('Content-Type', 'text/xml');
      res.send('<Response></Response>');
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
}

module.exports = new SmsController();