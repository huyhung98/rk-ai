const mongoose = require('mongoose')
const { Schema, model } = mongoose
const { randomUUID } = require('crypto')

const SMS_MESSAGE_STATUSES = {
  RECEIVED: 'received',
  SENT: 'sent',
}
const SMS_MESSAGE_DIRECTIONS = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
}

// TODO: Handle redundant data. This is not a schema for a real collection. It's a schema for a message in the messages array of a conversation.
const smsMessageSchema = new Schema({
  _id: { // uuidv4 string for the message_id
    type: String,
    default: randomUUID, // Automatically generate a uuidv4 string if not provided
    required: true,
  },
  fromNumber: { // the phone number of the sender
    type: String,
    required: true,
  },
  toNumber: { // the phone number of the recipient
    type: String,
    required: true,
  },
  body: { // the content of the SMS message
    type: String,
    required: true,
  },
  status: { // the status of the message
    type: String,
    required: true,
    enum: Object.values(SMS_MESSAGE_STATUSES),
  },
  direction: { // the direction of the message
    type: String,
    required: true,
    enum: Object.values(SMS_MESSAGE_DIRECTIONS),
  },
  timestamp: { // the timestamp of the message
    type: Date,
    default: Date.now,
  },
  sid: { // the SID of the message from Twilio
    type: String,
    required: false, // Not required for sent messages
  },
})

const SmsMessage = mongoose.models.SmsMessage || model('SmsMessage', smsMessageSchema);

module.exports = SmsMessage
module.exports.SMS_MESSAGE_STATUSES = SMS_MESSAGE_STATUSES
module.exports.SMS_MESSAGE_DIRECTIONS = SMS_MESSAGE_DIRECTIONS
