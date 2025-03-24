const SmsService = require('../services/smsService')
const MarkoService = require('../services/markoService')
const RedisService = require('../services/redisService')
const ConversationService = require('../services/conversationService')
const Conversation = require('../models/conversation')
const { isArray } = require('es-toolkit/compat')
const { SMS_MESSAGE_STATUSES, SMS_MESSAGE_DIRECTIONS } = require('../models/sms_message')

// Session events found in mm_db/marko_server/conversation_handler.py
const SESSION_EVENTS = {
  IN_PROGRESS: 'session:in_progress',
  COMPLETED: 'session:completed',
  ERROR: 'session:error'
}

class SmsController {
  receiveSmsMessage = async (req, res, next) => {
    const { From, To, Body, MessageSid } = req.body

    if (!From || !To || !Body || !MessageSid) {
      const error = new Error('Missing at least one of the required fields: From, To, Body, MessageSid')
      error.statusCode = 400
      return next(error)
    }

    console.log('Received SMS Body:', req.body)

    try {
      // Save received SMS message to the database
      const smsService = new SmsService()
      const { conversation, smsMessage: receivedSmsMessage } = await smsService.saveSmsMessage(
        From,
        To,
        Body,
        SMS_MESSAGE_STATUSES.RECEIVED,
        SMS_MESSAGE_DIRECTIONS.INBOUND,
        MessageSid
      )

      // Send the received SMS message to Marko /run endpoint
      const markoService = new MarkoService()
      const channel = await markoService.sendRunRequest(conversation._id, receivedSmsMessage._id, receivedSmsMessage.body)

      // NOTE: this is not performance friendly and may cause timeout response because it will block the event loop. If that's the case, figure out a way to make this non-blocking.
      // Get the merged message from the Redis channel
      const redisService = new RedisService()
      let mergedMessage
      try {
        mergedMessage = await redisService.getMergedMessageFromChannel(channel)
      } catch (err) {
        console.error(`Error retrieving merged message from Redis channel ${channel}:`, err)
        return next(err)
      }

      // TODO: remove generating text from the merged message
      const messageToSend = mergedMessage

      // Send the message back to the user
      await smsService.sendSmsMessage(From, messageToSend)

      res.status(200).json({
        message: 'Received SMS message successfully'
      })
    } catch (err) {
      console.error('Error receiving SMS message:', err)
      next(err)
    }
  }

  smsMessageInboundWebhook = async (req, res, next) => {
    try {
      const { event, data, messageId, _error } = req.body
      console.log('SMS message inbound webhook body:', req.body)

      if (!event || !data || !messageId) {
        const error = new Error('Missing at least one of required fields: event, data, messageId')
        error.statusCode = 400
        return next(error)
      }

      if (!isArray(data.presigned_image_urls)) {
        const error = new Error('Invalid presigned_image_urls')
        error.statusCode = 400
        return next(error)
      } else if (data.presigned_image_urls.length === 0) {
        const error = new Error('No presigned_image_urls found')
        error.statusCode = 400
        return next(error)
      }

      switch (event) {
        case SESSION_EVENTS.IN_PROGRESS:
          const smsService = new SmsService()

          try {
            await Promise.all(
              data.presigned_image_urls.map((presignedImageUrl) =>
                smsService.sendPresignedImageUrl(presignedImageUrl, messageId)
              )
            );

            res.json({
              message: 'Successfully sent all presigned image URLs',
            })
          } catch (err) {
            console.error('Error sending presigned image URLs:', err)
            return next(err)
          }
          break
        case SESSION_EVENTS.COMPLETED:
          console.log('Session completed - no additional handling implemented yet')
          break
        case SESSION_EVENTS.ERROR:
          console.log('Session error - no additional handling implemented yet')
          break
        default:
          const error = new Error('Invalid event')
          error.statusCode = 400
          return next(error)
      }
    } catch (err) {
      next(err)
    }
  }

  sendSmsMessage = async (req, res, next) => {
    const { to: toNumber, body: messageBody } = req.body

    if (!toNumber || !messageBody) {
      const error = new Error('Missing at least one of required fields: to, body')
      error.statusCode = 422
      throw error
    }

    try {
      const smsService = new SmsService()
      await smsService.sendSmsMessage(toNumber, messageBody)
      res.json({
        message: `Successfully sent ${messageBody} to ${toNumber}`
      })
    } catch (err) {
      next(err)
    }
  }

  getConversations = async (_req, res, next) => {
    try {
      const conversations = await Conversation.find()

      res.json({
        data: conversations
      })
    } catch (err) {
      next(err)
    }
  }

  getConversationByPhoneNumber = async (req, res, next) => {
    const { phoneNumber } = req.params

    try {
      const conversationService = new ConversationService()
      const conversation = await conversationService.getConversationByPhoneNumber(phoneNumber);

      res.json({
        data: conversation
      })
    } catch (err) {
      next(err)
    }
  }

  getSmsMessagesByPhoneNumber = async (req, res, next) => {
    const { phoneNumber } = req.params

    try {
      const conversationService = new ConversationService()
      const conversation = await conversationService.getConversationByPhoneNumber(phoneNumber);
      const smsMessages = conversation.messages.filter(message => message.sid)

      res.json({
        data: smsMessages
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = SmsController
