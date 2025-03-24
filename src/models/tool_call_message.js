const mongoose = require('mongoose')
const { Schema, model } = mongoose

// Roles found by investigating references of mm_db/marko_server/conversation_store.py#add_tool_call
const ROLES = {
  TOOL: 'tool',
  SYSTEM: 'system',
}

// TODO: Handle redundant data. This is not a schema for a real collection. It's a schema for a message in the messages array of a conversation.
const toolCallMessageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
  },
  tool_call_id: {
    type: String,
    required: true,
  },
  function_name: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const ToolCallMessage = mongoose.models.ToolCallMessage || model('ToolCallMessage', toolCallMessageSchema);

module.exports = ToolCallMessage
