// ngrokService.js
const axios = require('axios');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

class MarkoService {
    constructor(userInput) {
        this.endpoint = process.env.NEX_ENDPOINT;
        this.s3Folder = process.env.S3_FOLDER || '';
        this.s3Bucket = process.env.S3_BUCKET || '';
        this.s3Region = process.env.S3_REGION || '';
        this.baseUrl = process.env.BASE_URL || '';
        this.userInput = userInput;
    }

    async sendRequest() {
        const sessionId = uuidv4();
        const messageId = uuidv4();
        const channel = `sessions:${sessionId}`;

        const data = {
            channel,
            contexts: [],
            session_id: sessionId,
            message_id: messageId,
            user_input: this.userInput,
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
            await axios.post(process.env.NEX_ENDPOINT, data);

            return messageId
        } catch (error) {
            console.error('Error sending request to NEX endpoint:', error);
            throw new Error('Failed to send request to NEX endpoint');
        }
    }
}

module.exports = MarkoService;
