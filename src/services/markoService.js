const axios = require('axios')
const { randomUUID } = require('crypto')

const SMS_INBOUND_WEBHOOK_URL = `${process.env.MARKO_POC_BASE_URL || ''}/sms/webhook`

class MarkoService {
  generateChannel = sessionId => `sessions:${sessionId}`

  async sendRunRequest(sessionId, messageId, userInput) {
    const channel = this.generateChannel(sessionId)
    const data = {
      channel, // a Redis channel to subscribe to for the chunked responses
      contexts: [],
      session_id: sessionId, // session_id acts as conversation._id and is used to find a conversation from the conversation MongoDB collections on marko_server
      message_id: messageId, // each message has a unique message_id, saved in the conversation.messages array
      user_input: userInput, // the actual prompt OR a message before user providing the actual prompt
      storage: { // S3 storage configuration for saving generated file(s)
        folder: process.env.S3_FOLDER || '',
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || ''
      },
      links: {
        webhook: SMS_INBOUND_WEBHOOK_URL // the webhook URL to send generated file(s) to
      }
    }

    try {
      await axios.post(`${process.env.MARKO_BASE_URL}/run`, data);
    } catch (err) {
      console.error(`Error sending run request to Marko:`, err)
      throw err
    }

    return channel
  }
}

module.exports = MarkoService
