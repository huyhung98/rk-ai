const Conversation = require('../models/conversation')

class ConversationService {
  async getConversationByPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      const error = new Error('Missing required field: phoneNumber')
      error.statusCode = 422
      throw error
    }

    const conversation = await Conversation.findOne({ phoneNumber })

    if (!conversation) {
      const error = new Error(`Conversation not found for phone number: ${phoneNumber}`)
      error.statusCode = 404
      throw error
    }

    return conversation
  }

  async getConversationByMessageId(messageId) {
    const conversation = await Conversation.findOne({ 'messages._id': messageId })

    if (!conversation) {
      const error = new Error(`Conversation not found for messageId: ${messageId}`)
      error.statusCode = 404
      throw error
    }

    console.log(`Found a conversation with _id ${conversation._id} by messageId ${messageId}.`)

    return conversation
  }

  async addMessageToConversation(phoneNumber, message) {
    if (!phoneNumber || !message) {
      throw new Error('Missing at least one of required fields: phoneNumber, message')
    }

    try {
      let conversation = await Conversation.findOne({ phoneNumber })

      if (conversation) {
        console.log(`Found a conversation with _id ${conversation._id} by phoneNumber ${phoneNumber}.`)

        conversation.messages.push(message)
        console.log(`Adding message to it...`)
        await conversation.save()
      } else {
        console.log('Conversation not found. Creating a new conversation...')

        const newConversation = new Conversation({
          phoneNumber,
          messages: [message],
        })
        console.log('Adding message to it...')
        conversation = await newConversation.save()
      }

      console.log(`Added message to the conversation with _id ${conversation._id}`)

      return conversation
    } catch (err) {
      console.error('Error adding message to conversation:', err)
      throw err
    }
  }
}

module.exports = ConversationService
