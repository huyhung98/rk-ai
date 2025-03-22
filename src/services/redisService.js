const redis = require('redis')

// Find generating texts in marko_server/tools, each generator's tool_call_description
const GENERATING_TEXTS = {
  imageGenerator: "I'm generating an image for you ...",
  videoGenerator: "I'm generating a video for you ...",
}

const DEFAULT_TIMEOUT_MS = 600000

class RedisService {
  constructor() {
    this.subscriber = null
    this.subscribers = new Map() // Track active subscriptions
    this.init()
  }

  init = async () => {
    try {
      if (!this.subscriber) {
        this.subscriber = redis.createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        })
        await this.subscriber.connect()
        console.log(`Connected to Redis as a subscriber`)
      }
    } catch (err) {
      console.error(`Error connecting to Redis:`, err)
      throw err
    }
  }

  subscribeToChannel = async (channel, callback) => {
    try {
      await this.subscriber.subscribe(channel, async (message) => {
        try {
          const parsedMessage = JSON.parse(message)
          await callback(null, parsedMessage)
        } catch (err) {
          await callback(err, null)
        }
      })

      this.subscribers.set(channel, callback)
      console.log(`Subscribed to Redis channel ${channel}`)
    } catch (err) {
      console.error(`Error subscribing to Redis channel ${channel}:`, err)
      throw err
    }
  }

  unsubscribeFromChannel = async (channel) => {
    try {
      if (this.subscribers.has(channel)) {
        await this.subscriber.unsubscribe(channel)
        this.subscribers.delete(channel)
        console.log(`Unsubscribed from channel: ${channel}`)
      }
    } catch (err) {
      console.error(`Error unsubscribing from ${channel}:`, err)
      throw err
    }
  }

  getMergedMessageFromChannel = async (channel, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    return new Promise((resolve, reject) => {
      let mergedMessage = ''
      let timeout

      const callback = async (error, message) => {
        try {
          if (error) {
            console.error(`Error parsing chunk message from Redis channel ${channel}:`, error)
            clearTimeout(timeout)
            await this.unsubscribeFromChannel(channel)
            return reject(error)
          }

          mergedMessage += message.value
          // console.log(`Message chunk received from Redis channel ${channel}:`, message) // NOTE: Uncomment for debugging

          if (message.done) {
            console.log(`Merged message received from Redis channel ${channel}:`, mergedMessage)
            clearTimeout(timeout)
            await this.unsubscribeFromChannel(channel)
            return resolve(mergedMessage)
          }
        } catch (err) {
          console.error(`Error in callback for channel ${channel}:`, err)
          clearTimeout(timeout)
          return reject(err)
        }
      }

      // NOTE: Timeout if no message is received after the specified time to prevent hanging indefinitely
      // This is a safety measure to prevent the event loop from being blocked
      // Increase the timeoutMs if you expect the operation to take longer
      timeout = setTimeout(async () => {
        const errorMessage = `Timeout waiting for messages from Redis channel ${channel}. You may need to increase the timeout OR there's actually an issue with Redis.`
        console.error(errorMessage)
        await this.unsubscribeFromChannel(channel)
        reject(new Error(errorMessage))
      }, timeoutMs)

      this.subscribeToChannel(channel, callback).catch((err) => {
        clearTimeout(timeout)
        console.error(`Error subscribing to Redis channel ${channel}:`, err)
        reject(err)
      })
    })
  }

  getTransformedMergedMessage = async (channel, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const mergedMessage = await this.getMergedMessageFromChannel(channel, timeoutMs)
    let transformedMergedMessage = mergedMessage

    Object.values(GENERATING_TEXTS).forEach((generatingText) => {
      transformedMergedMessage = transformedMergedMessage.replaceAll(generatingText, '')
    })

    return transformedMergedMessage.trim()
  }

  disconnect = async () => {
    try {
      for (const channel of this.subscribers.keys()) {
        await this.unsubscribeFromChannel(channel)
      }
      await this.subscriber.quit()
      this.subscribers.clear()
      console.log('Disconnected from Redis')
    } catch (err) {
      console.error('Error disconnecting from Redis:', err)
      throw err
    }
  }
}

module.exports = RedisService
