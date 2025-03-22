const smsService = require('../services/smsService');
const markoService = require('../services/markoService');
const urlShortenerService = require('../services/urlShortenerService');
const redisService = require('../services/redisService');
const { isError, isString } = require('es-toolkit');

// Session events found in mm_db/marko_server/conversation_handler.py
const SESSION_EVENTS = {
  IN_PROGRESS: 'session:in_progress',
  COMPLETED: 'session:completed',
  ERROR: 'session:error'
}

class SmsController {
  handleResponseError = (res, error, fallbackErrorMessage = 'Error', statusCode = 500) => {
    if (!isError(error)) {
      if (isString(error)) {
        error = new Error(error);
      } else {
        error = new Error(fallbackErrorMessage);
      }
    }

    console.error(`${fallbackErrorMessage}: `, error);

    let errorMessage = fallbackErrorMessage;
    if (error?.message) {
      errorMessage = error.message;
    }

    // This may cause error if it's not called in a catch block at the end of the function
    // TODO: use error handling middleware in server.js instead
    return res.status(statusCode).json({
      error: errorMessage
    });
  };

  sendSms = async (req, res) => {
    const { to, body } = req.body;

    [to, body].forEach(field => {
      if (!field) {
        this.handleResponseError(res, new Error(`Missing required field: ${field}`), null, 400);
      }
    })

    try {
      const result = await smsService.sendSms(to, body);
      res.json(result);
    } catch (error) {
      this.handleResponseError(res, error, 'Error sending SMS');
    }
  }

  receiveSms = async (req, res) => {
    const { From, To, Body, MessageSid } = req.body;
    console.log('Received SMS Body:', req.body);

    try {
      await smsService.saveReceivedSms(From, To, Body, MessageSid);
      const marko = new markoService(Body)
      const { channel, messageId } = await marko.sendRequest();
      await smsService.updateMessageId(MessageSid, messageId);

      const finalChunkMessage = await redisService.getChannelMessage(channel)
      console.log('Chunk message: ', finalChunkMessage)

      res.status(200).json({
        success: true
      });
    } catch (error) {
      this.handleResponseError(res, error, 'Error receiving SMS');
    }
  }

  getMessages = async (_req, res) => {
    try {
      const messages = await smsService.getAllMessages();
      res.json(messages);
    } catch (error) {
      this.handleResponseError(res, error, 'Error getting messages');
    }
  }

  webhook = async (req, res) => {
    try {
      const { event, data, messageId, _error } = req.body
      console.log('Webhook data:', req.body);

      if (event === SESSION_EVENTS.IN_PROGRESS && data?.presigned_image_urls?.length > 0) {
        const fileUrl = data.presigned_image_urls[0];
        console.log('File URL:', fileUrl);

        const shortUrl = await urlShortenerService.shortenUrl(fileUrl);
        console.log('Original short URL:', shortUrl);

        // Modify shortUrl so that it can be sent to a Vietnamese phone number
        // TODO: Only send modified short URL if the recipient is a Vietnamese phone number
        const modifiedShortUrl = shortUrl.replace('http://', ' ').replaceAll('.', '(.)')
        console.log('Modified short URL:', modifiedShortUrl);

        const recipientNumber = await smsService.getRecipientNumberByMessageId(messageId);

        const result = await smsService.sendSms(recipientNumber, modifiedShortUrl);
        console.log('SMS sent:', result);
        res.json(result);
      }
    } catch (error) {
      this.handleResponseError(res, error, 'Error in receiving data from marko_server')
    }
  }
}

module.exports = new SmsController();
