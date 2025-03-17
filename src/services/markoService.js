// ngrokService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MarkoService {
    async sendRequest(userInput) {
        // Generate the UUIDs for channel and message_id
        const session_id = uuidv4();
        const channel = `sessions:${session_id}`;
        const messageId = uuidv4();

        // Construct the data object
        const data = {
            channel: channel, // sessions:uuid
            contexts: [], // Empty array as per the request
            session_id: session_id, // The session_id is the same as the channel ID
            message_id: messageId, // Generated message ID
            user_input: userInput, // user input passed to constructor
            storage: {
                folder: process.env.NGROK_FOLDER || '',
                bucket: process.env.NGROK_BUCKET || '',
                region: process.env.NGROK_REGION || ''
            },
            links: {
                // webhook: 'https://9e69-101-99-14-10.ngrok-free.app/sms/webhook'
            }
        };

        try {
            // Send the POST request to the given endpoint
            const response = await axios.post(process.env.NEX_ENDPOINT, data);

            // Return the session_id (channel_id)
            return response.data.channel_id || channel; // Default to generated channel if not found in response
        } catch (error) {
            console.error('Error sending request to Ngrok service:', error);
            throw new Error('Failed to send request to Ngrok service');
        }
    }
}

module.exports = MarkoService;
