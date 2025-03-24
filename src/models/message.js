const mongoose = require('mongoose')
const { Schema, model } = mongoose

// Senders found by investigating references of mm_db/marko_server/conversation_store.py#add_message
const SENDERS = {
  USER: 'user',
  ASSISTANT: 'assistant'
}

// TODO: Handle redundant data. This is not a schema for a real collection. It's a schema for a message in the messages array of a conversation.
const MessageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  sender: {
    type: String,
    enum: Object.values(SENDERS),
    required: true,
  },
  tool_calls: [
    {
      type: Schema.Types.Mixed, // Flexible structure for tool call objects. Add a more specific schema if needed
    },
  ],
})

const Message = mongoose.models.Message || model('Message', MessageSchema)

module.exports = Message
