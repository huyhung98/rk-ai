# RK-AI Integrate APP

This project is a Node.js application built with Express.js that integrates Twilio for sending and receiving SMS messages, combined with sending prompts to Marko AI to generate and return images to the user.
## Features
- Send SMS messages via Twilio’s Programmable SMS API.
- Receive SMS messages through a Twilio webhook and store them in MongoDB.
- Send a prompt from the user's message SMS to Marko AI, generate a conversations, and return it to the user.
- Retrieve conversations history via an API endpoint.
- Error handling for invalid inputs and API failures.

## Prerequisites
To run this project, ensure you have:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Twilio account](https://www.twilio.com/) with an SMS-capable phone number
- [MongoDB](https://www.mongodb.com/) database

## Installation
1. **Install Dependencies**
    ```bash
    npm install

2. **Set up environment variables by creating a new `.env` file in the root directory based on the `env.example` file.**

3. **Run the Application**
    ```bash
    npm run dev
    or
    npm start
The server will start at http://localhost:3000 (or the port specified in .env).

## API Endpoints
1. **Send SMS**
- Method: POST
- Endpoint: `/sms/send`
- Request Body:
   ```json
   {
       "to": "+1234567890",
       "body": "Hello from Twilio!"
   }
   ```
- Responses:
  - Success (200)
      ```json
        {
          "success":true,
          "messageSid":"SM9e563eb115523f515b9d4a60dd14e83d"
        }
      ```
  - Error (400)
    ```json
     {
      "success": false,
      "error": "Missing required fields: to and body"
     }
    ``` 
  - Error (500)
    ```json
     {
        "success": false,
        "error": "error"
     }
    ```
2. **Receive SMS (Webhook)**
- Method: POST
- Endpoint: `/sms/receive`
- Setup: Configure your Twilio phone number’s SMS webhook to this endpoint (e.g., http://yourdomain.com/sms/receive).
- Expected Payload (from Twilio):
  ```json
    {
      "From": "+1234567890",
      "To": "+0987654321",
      "Body": "Hi there!",
      "SID": "SM9efd301ffa72fe7d5d0931dac8216ebb"
    }
  ```
- Response: Plain text "Message received" (200 OK).
3. **Get all conversations**
- Method: GET
- Endpoint: `/sms/conversations`
- Example:
    ```bash
      curl http://localhost:3000/sms/conversations
    ```
  - Response:
      ```json
          {
            "data": [
              {
                "_id": "14bb7684-822d-4d3f-a70a-498f13a12884",
                "messages": [
                  {
                    "fromNumber": "+84389807069",
                    "toNumber": "+18573714155",
                    "body": "Hi I'm Dave, how are you?",
                    "status": "received",
                    "direction": "inbound",
                    "sid": "SM2bs0f3b1g1mnetu",
                    "_id": "85b979ff-d49c-4251-9beb-082e302c4649",
                    "timestamp": "2025-03-24T03:23:22.119Z"
                  },
                  {
                    "fromNumber": "+84389807069",
                    "toNumber": "+18573714155",
                    "body": "Please generate for me an image of a cat",
                    "status": "received",
                    "direction": "inbound",
                    "sid": "SM5mtrl664bq7pd8q",
                    "_id": "38b52312-d051-4f96-8b38-765dffc79ebe",
                    "timestamp": "2025-03-24T03:24:18.912Z"
                  }
                ]
              }
            ]
         }
      ```
4. **SMS Message Webhook**
   - This endpoint is used to listen to incoming requests from Marko AI and send the presigned image URLs to the user.
   - Method: GET
   - Endpoint: `/sms/webhook`
   - Example:
       ```bash
         curl http://localhost:3000/sms/webhook
       ```
     - Response:
       - 200 OK
         ```json
           {
             "message": "Successfully sent all presigned image URLs"
           }
         ```
