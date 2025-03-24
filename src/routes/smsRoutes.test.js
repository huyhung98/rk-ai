import request from 'supertest'
import app from '../server'
import { describe, it, expect, beforeEach } from 'vitest'
import { faker, fakerEN_US, fakerVI } from '@faker-js/faker'
import { SMS_MESSAGE_DIRECTIONS, SMS_MESSAGE_STATUSES } from '../models/sms_message'
import Conversation from '../models/conversation'
import ShortenedUrl from '../models/shortened_url'

// TODO: Organize the tests in a better way instead of all in one file like this

const generateRandomSid = ({ prefix = 'SM', length = 13 } = {}) => `${prefix}${faker.string.alphanumeric(length - prefix.length)}`

const clearDatabase = async () => {
  const models = [Conversation, ShortenedUrl]
  await Promise.all(models.map((model) => model.deleteMany()))
}

// TODO: setup a MongoDB database for testing. A test database is created automatically when running the tests. Why?
describe('SMS Routes', () => {
  let payload

  beforeEach(async () => {
    await clearDatabase()

    // NOTE: Payload to test sending an SMS message from a Vietnamese number to a US number then back
    // NOTE: The toNumber is always a US number because Twilio trial account only allows sending messages to a US number
    // TODO: Test sending an SMS message from a US number
    payload = {
      // From: fakerEN_US.phone.number({ style: 'international' }),
      From: '+84976855822',
      FromCountry: 'VN',
      FromState: fakerVI.location.state({ abbreviated: true }),
      FromCity: '',
      FromZip: '',
      To: process.env.TWILIO_PHONE_NUMBER,
      ToCountry: 'US',
      ToState: fakerEN_US.location.state({ abbreviated: true }),
      ToCity: '',
      ToZip: '',
      SmsMessageSid: generateRandomSid(),
      NumMedia: '0',
      SmsSid: generateRandomSid({ length: 34 }),
      SmsStatus: SMS_MESSAGE_STATUSES.RECEIVED,
      Body: `Generate a logo for my ${faker.food.fruit()} shop`,
      NumSegments: '1',
      MessageSid: generateRandomSid(),
      AccountSid: generateRandomSid({ prefix: 'AC', length: 34 }),
      ApiVersion: '2010-04-01'
    }
  })

  it('should handle POST /sms/receive with valid data', async () => {
    let conversations
    conversations = await Conversation.find()
    // There's no conversation in the first place
    expect(conversations.length).toBe(0)

    const response = await request(app)
      .post('/sms/receive')
      .send(payload)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message', 'Received SMS message successfully')

    // A conversation is created
    conversations = await Conversation.find()
    expect(conversations.length).toBe(1)

    // If it's a new phone number, then the conversation has 3 messages:
    //   - the received message
    //   - the sent messages: (response from the faster operation is pushed first)
    //     - the marko_server response message (merged message from subscribing to the Redis channel)
    //     - TODO: the marko_server response message (merged message (with generating text removed) from subscribing to the Redis channel)
    //     - the shortened URL message (request data from marko_server to the webhook URL)
    // TODO: Else
    //   If the received message is a normal message, then ?
    //   Else (the received message is a prompt message), then ?
    const conversation = conversations[0]
    expect(conversation.messages.length).toBe(3)

    // The received message is saved using the payload data
    const receivedMessage = conversation.messages.find(
      (message) => message.direction === SMS_MESSAGE_DIRECTIONS.INBOUND
    )
    expect(receivedMessage).toMatchObject({
      fromNumber: payload.From,
      toNumber: payload.To,
      body: payload.Body,
      status: SMS_MESSAGE_STATUSES.RECEIVED,
      direction: SMS_MESSAGE_DIRECTIONS.INBOUND,
      sid: payload.MessageSid,
    })

    const sentMessages = conversation.messages.filter(
      (message) => message.direction === SMS_MESSAGE_DIRECTIONS.OUTBOUND
    )

    // The shortened URL message is saved with:
    // - flipped fromNumber and toNumber
    // - flipped status
    // - flipped direction
    // - body containing the shortened URL
    // TODO: handle sending the shortened URL message to a US number. Currently, this test code only works for sending to a Vietnamese number
    const shortenedUrlMessage = sentMessages.find(message => message.body.includes('(.)')) // Matches a shortened URL message containing (.) for Vietnamese toNumber
    expect(shortenedUrlMessage).toMatchObject({
      fromNumber: payload.To,
      toNumber: payload.From,
      status: SMS_MESSAGE_STATUSES.SENT,
      direction: SMS_MESSAGE_DIRECTIONS.OUTBOUND,
    })
    expect(typeof shortenedUrlMessage.body).toBe('string')

    // The marko_server response message is saved with:
    // - flipped fromNumber and toNumber
    // - flipped status
    // - flipped direction
    // - body containing the merged message from the Redis channel
    // - TODO: body containing the merged message (with generating text removed) from the Redis channel
    const markoServerResponseMessage = sentMessages.find(message => message !== shortenedUrlMessage)
    expect(markoServerResponseMessage).toMatchObject({
      fromNumber: payload.To,
      toNumber: payload.From,
      status: SMS_MESSAGE_STATUSES.SENT,
      direction: SMS_MESSAGE_DIRECTIONS.OUTBOUND,
    })
    expect(typeof markoServerResponseMessage.body).toBe('string')
    expect(markoServerResponseMessage.body.length).toBeGreaterThan(0)
  }, 120000)

  const requiredFields = ['From', 'To', 'Body', 'MessageSid']

  requiredFields.forEach((field) => {
    it(`should return 400 if "${field}" is missing after POST /sms/receive`, async () => {
      delete payload[field]

      const response = await request(app)
        .post('/sms/receive')
        .send(payload)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', `Missing at least one of the required fields: ${requiredFields.join(', ')}`)
    })
  })
})
