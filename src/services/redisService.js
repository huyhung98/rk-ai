const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const subscribers = new Map();

class RedisService {
    constructor() {
        this.publisher = redisClient;
        this.subscriber = null;
        this.init();
    }


    async init() {
        try {
            if (!this.publisher.isOpen) {
                await this.publisher.connect();
                console.log('Connected to Redis');
            }

            if (!this.subscriber) {
                this.subscriber = this.publisher.duplicate();
                await this.subscriber.connect();
            }

        } catch (error) {
            console.error('Redis connection error:', error);
            throw error;
        }
    }

    async subscribeToChannel(channelId, callback) {
        const channel = `${channelId}`;

        try {
            await this.subscriber.subscribe(channel, (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(null, parsedMessage);
                } catch (error) {
                    callback(error, null);
                }
            });

            subscribers.set(channelId, callback);
            console.log(`Subscribed to channel: ${channel}`);
        } catch (error) {
            console.error(`Error subscribing to ${channel}:`, error);
            throw error;
        }
    }


    async unsubscribeFromChannel(channelId) {
        const channel = `${channelId}`;

        try {
            await this.subscriber.unsubscribe(channel);
            subscribers.delete(channelId);
            console.log(`Unsubscribed from channel: ${channel}`);
        } catch (error) {
            console.error(`Error unsubscribing from ${channel}:`, error);
            throw error;
        }
    }

    async publishToChannel(channelId, message) {
        const channel = `${channelId}`;

        try {
            await this.publisher.publish(channel, JSON.stringify(message));
            console.log(`Published message to ${channel}`);
        } catch (error) {
            console.error(`Error publishing to ${channel}:`, error);
            throw error;
        }
    }


    async getChannelMessage(channelId) {
        return new Promise((resolve) => {
            const callback = (error, message) => {
                let fullMessage = '';
                if (error) {
                    console.error('Error parsing message:', error);
                    return;
                }

                fullMessage += message.value;

                if (message.done) {
                    this.unsubscribeFromChannel(channelId);
                    resolve(fullMessage.trim());
                }
            };

            this.subscribeToChannel(channelId, callback);
        });
    }

    async disconnect() {
        try {
            await this.subscriber.quit();
            await this.publisher.quit();
            subscribers.clear();
            console.log('Disconnected from Redis');
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
}

const redisService = new RedisService();

module.exports = redisService;
