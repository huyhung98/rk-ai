const axios = require('axios')
const { randomUUID } = require('crypto')

const SMS_INBOUND_WEBHOOK_URL = `${process.env.MARKO_POC_BASE_URL || ''}/sms/webhook`

class MarkoService {
  generateSessionId = () => randomUUID()

  generateChannel = sessionId => `sessions:${sessionId}`

  async sendRunRequest(messageId, userInput) {
    const sessionId = this.generateSessionId();
    const channel = this.generateChannel(sessionId)
    const data = {
      channel,
      contexts: [],
      session_id: sessionId,
      message_id: messageId,
      user_input: userInput,
      storage: {
        folder: process.env.S3_FOLDER || '',
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || ''
      },
      links: {
        webhook: SMS_INBOUND_WEBHOOK_URL
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
