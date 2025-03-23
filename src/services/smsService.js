const twilio = require('twilio')
const SmsMessage = require('../models/sms_message')
const { SMS_MESSAGE_STATUSES, SMS_MESSAGE_DIRECTIONS } = require('../models/sms_message')
const UrlShortenerService = require('../services/urlShortenerService')
const ConversationService = require('../services/conversationService')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

class SmsService {
  saveReceivedSmsMessage = async (fromNumber, toNumber, body, sid) => {
    try {
      const receivedSmsMessage = new SmsMessage({
        fromNumber,
        toNumber,
        body,
        status: SMS_MESSAGE_STATUSES.RECEIVED,
        direction: SMS_MESSAGE_DIRECTIONS.INBOUND,
        sid,
      })

      const conversationService = new ConversationService()
      await conversationService.addMessageToConversation(fromNumber, receivedSmsMessage.toObject())

      return receivedSmsMessage
    } catch (err) {
      console.error(`Error saving received SMS message:`, err)
      throw err
    }
  }

  saveSentSmsMessage = async (fromNumber, toNumber, body) => {
    if (!fromNumber || !toNumber || !body) {
      throw new Error('Missing at least one of required fields: fromNumber, toNumber, or body')
    }

    try {
      const sentSmsMessage = new SmsMessage({
        fromNumber,
        toNumber,
        body,
        status: SMS_MESSAGE_STATUSES.SENT,
        direction: SMS_MESSAGE_DIRECTIONS.OUTBOUND,
      })

      const conversationService = new ConversationService()
      await conversationService.addMessageToConversation(toNumber, sentSmsMessage.toObject())

      return sentSmsMessage
    } catch (err) {
      console.error('Error saving sent SMS message:', err)
      throw err
    }
  }

  formatUrlForRecipient = (url, recipientNumber) => {
    const isVietnameseNumber = recipientNumber.startsWith('+84')
    return isVietnameseNumber
      ? url.replace(/https?:\/\//, '').replace(/\./g, ' (.) ')
      : url
  }

  sendPresignedImageUrl = async (presignedImageUrl, messageId) => {
    console.log('Presigned image URL:', presignedImageUrl)

    // Shorten the URL
    let shortUrl
    try {
      const urlShortenerService = new UrlShortenerService()
      shortUrl = await urlShortenerService.shortenUrl(presignedImageUrl)
      console.log('Shortened URL:', shortUrl)
    } catch (err) {
      console.error(`Error shortening URL for ${presignedImageUrl}:`, err)
      throw err
    }

    // Get the to number
    let toNumber
    try {
      const conversationService = new ConversationService()
      const conversation = await conversationService.getConversationByMessageId(messageId)
      toNumber = conversation.phoneNumber
    } catch (err) {
      console.error(`Error retrieving to number for messageId: ${messageId}`, err)
      throw err
    }

    const urlToSend = this.formatUrlForRecipient(shortUrl, toNumber)

    // Send the SMS
    try {
      await this.sendSmsMessage(toNumber, urlToSend)
      console.log(`Successfully sent ${urlToSend} to ${toNumber}`)
    } catch (err) {
      console.error(`Error sending ${urlToSend} to ${toNumber}:`, err)
      throw err
    }
  }

  sendSmsMessage = async (toNumber, messageBody) => {
    try {
      const sentMessage = await client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toNumber
      })

      // TODO: also save sid to the message
      console.log('Sent SMS message:', JSON.stringify(sentMessage, null, 2))
      await this.saveSentSmsMessage(sentMessage.from, sentMessage.to, sentMessage.body)
    } catch (err) {
      console.log(`Failed to send ${messageBody} to ${toNumber}:`, err)
      throw err
    }
  }
}

module.exports = SmsService
