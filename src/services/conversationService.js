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
    if (!messageId) {
      const error = new Error('Missing required field: messageId')
      error.statusCode = 422
      throw error
    }

    const conversation = await Conversation.findOne({ 'messages._id': messageId })
    console.log('Conversation by messageId:', conversation)

    if (!conversation) {
      const error = new Error(`Conversation not found for messageId: ${messageId}`)
      error.statusCode = 404
      throw error
    }

    return conversation
  }

  async addMessageToConversation(phoneNumber, message) {
    if (!phoneNumber || !message) {
      throw new Error('Missing at least one of required fields: phoneNumber, message')
    }

    try {
      let conversation = await Conversation.findOne({ phoneNumber })

      if (conversation) {
        console.log('Found conversation:', conversation)

        conversation.messages.push(message)
        await conversation.save()

        console.log('Pushed message to the found conversation')
      } else {
        console.log('Conversation not found. Creating a new conversation with a message')

        const newConversation = new Conversation({
          phoneNumber,
          messages: [message],
        })
        conversation = await newConversation.save()

        console.log('Created a conversation with a message')
      }

      return conversation
    } catch (err) {
      console.error('Error adding message to conversation:', err)
      throw err
    }
  }
}

module.exports = ConversationService
