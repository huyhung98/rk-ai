const mongoose = require('mongoose')
const { Schema, model } = mongoose
const { randomUUID } = require('crypto')

const conversationSchema = new Schema({
  _id: {
    type: String, // Use the session_id, which is a uuidv4 string
    default: randomUUID, // Automatically generate a uuidv4 string if not provided
    required: true,
  },
  messages: [
    {
      type: Schema.Types.Mixed, // Allow both Message and ToolCallMessage objects directly
    }
  ],
  phoneNumber: { // NOTE: This field may already exist in the Marko database, in a different collection
    type: String,
  },
})

const Conversation = mongoose.models.Conversation || model('Conversation', conversationSchema)

module.exports = Conversation
