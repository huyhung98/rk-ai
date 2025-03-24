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
  saveSmsMessage = async (fromNumber, toNumber, body, status, direction, sid) => {
    try {
      const smsMessage = new SmsMessage({
        fromNumber,
        toNumber,
        body,
        status,
        direction,
        sid,
      })

      const conversationService = new ConversationService()
      const phoneNumber = direction === SMS_MESSAGE_DIRECTIONS.INBOUND ? fromNumber : toNumber
      const conversation = await conversationService.addMessageToConversation(phoneNumber, smsMessage.toObject())

      return { conversation, smsMessage }
    } catch (err) {
      console.error(`Error saving SMS message:`, err)
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

      console.log(`Sent SMS message to ${toNumber}:`, JSON.stringify(sentMessage, null, 2))
      const { conversation, smsMessage: sentSmsMessage } = await this.saveSmsMessage(
        sentMessage.from,
        sentMessage.to,
        sentMessage.body,
        SMS_MESSAGE_STATUSES.SENT,
        SMS_MESSAGE_DIRECTIONS.OUTBOUND,
        sentMessage.sid
      )

      return { conversation, sentSmsMessage }
    } catch (err) {
      console.log(`Failed to send ${messageBody} to ${toNumber}:`, err)
      throw err
    }
  }
}

module.exports = SmsService
