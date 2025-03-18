// ngrokService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MarkoService {
    constructor() {
        // Initialize any properties or configurations here
        this.endpoint = process.env.NEX_ENDPOINT;
        this.s3Folder = process.env.S3_FOLDER || '';
        this.s3Bucket = process.env.S3_BUCKET || '';
        this.s3Region = process.env.S3_REGION || '';
        this.baseUrl = process.env.BASE_URL || '';
    }

    async sendRequest(userInput) {
        // Generate the UUIDs for channel and message_id
        const sessionId = uuidv4();
        const messageId = uuidv4();
        const channel = `sessions:${sessionId}`;

        // Construct the data object
        const data = {
            channel, // sessions:uuid
            contexts: [], // Empty array as per the request
            session_id: sessionId, // The session_id is the same as the channel ID
            message_id: messageId, // Generated message ID
            user_input: userInput, // user input passed to constructor
            storage: {
                folder: this.s3Folder,
                bucket: this.s3Bucket,
                region: this.s3Region
            },
            links: {
                webhook: `${this.baseUrl}/sms/webhook`
            }
        };

        try {
            // Send the POST request to the given endpoint
            await axios.post(process.env.NEX_ENDPOINT, data);

            // Return the session_id (channel_id)
            return messageId
        } catch (error) {
            console.error('Error sending request to Ngrok service:', error);
            throw new Error('Failed to send request to Ngrok service');
        }
    }
}

module.exports = MarkoService;
