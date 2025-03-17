const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const subscribers = new Map();

class RedisService {
    constructor() {
        this.client = redisClient;
        this.subscriber = null;
        this.init();
    }


    async init() {
        try {
            // Connect to Redis
            await this.client.connect();
            console.log('Connected to Redis');

            // Create a separate subscriber client
            this.subscriber = this.client.duplicate();
            await this.subscriber.connect();

        } catch (error) {
            console.error('Redis connection error:', error);
            throw error;
        }
    }

    // Subscribe to a specific session channel
    async subscribeToSession(sessionId, callback) {
        const channel = `${sessionId}`;

        try {
            await this.subscriber.subscribe(channel, (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(null, parsedMessage);
                } catch (error) {
                    callback(error, null);
                }
            });

            subscribers.set(sessionId, callback);
            console.log(`Subscribed to channel: ${channel}`);
        } catch (error) {
            console.error(`Error subscribing to ${channel}:`, error);
            throw error;
        }
    }

    // Unsubscribe from a session channel
    async unsubscribeFromSession(sessionId) {
        const channel = `${sessionId}`;

        try {
            await this.subscriber.unsubscribe(channel);
            subscribers.delete(sessionId);
            console.log(`Unsubscribed from channel: ${channel}`);
        } catch (error) {
            console.error(`Error unsubscribing from ${channel}:`, error);
            throw error;
        }
    }

    // Publish a message to a session channel
    async publishToSession(sessionId, message) {
        const channel = `${sessionId}`;

        try {
            await this.client.publish(channel, JSON.stringify(message));
            console.log(`Published message to ${channel}`);
        } catch (error) {
            console.error(`Error publishing to ${channel}:`, error);
            throw error;
        }
    }

    // Get accumulated message from a session
    async getSessionMessage(sessionId) {
        return new Promise((resolve) => {
            let fullMessage = '';
            let isDone = false;

            const callback = (error, message) => {
                if (error) {
                    console.error('Error parsing message:', error);
                    return;
                }

                fullMessage += message.value;
                isDone = message.done;

                if (isDone) {
                    this.unsubscribeFromSession(sessionId);
                    resolve(fullMessage.trim());
                }
            };

            this.subscribeToSession(sessionId, callback);
        });
    }

    // Cleanup on shutdown
    async disconnect() {
        try {
            await this.subscriber.quit();
            await this.client.quit();
            subscribers.clear();
            console.log('Disconnected from Redis');
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;