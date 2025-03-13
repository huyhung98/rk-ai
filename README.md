# RK-AI Integrate APP

This project is a Node.js application built with Express.js that integrates Twilio for sending and receiving SMS messages, combined with sending prompts to Marko AI to generate and return images to the user.
## Features
- Send SMS messages via Twilio’s Programmable SMS API.
- Receive SMS messages through a Twilio webhook and store them in PostgreSQL.
- Send a prompt from the user's message to Marko AI, generate an image, and return it to the user.
- Persist message details in a database.
- Retrieve message history via an API endpoint.
- Error handling for invalid inputs and API failures.

## Prerequisites
To run this project, ensure you have:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Twilio account](https://www.twilio.com/) with an SMS-capable phone number

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/huyhung98/rk-ai.git
   cd rk-ai

2. **Install Dependencies**
    ```bash
    npm install

3. **Set Up Environment Variables Create a .env file in the root directory with the following:**
    ```bash
    DATABASE_URL=postgres://user:password@localhost:db_port/db_name
    PORT=3000
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_ACCOUNT_SID=your_twilio_account_sid
    TWILIO_PHONE_NUMBER=+1234567890
    DB_USER=user
    DB_HOST=host
    DB_NAME=db_name
    DB_PASSWORD=password
    DB_PORT=5432
4. **Run the Application**
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
3. **Get all messages**
- Method: GET
- Endpoint: `/sms/messages`
- Example:
    ```bash
      curl http://localhost:3000/sms/messages
    ```
- Response:
    ```json
        [
          {
            "id": 2,
            "sid": "SM9efd301ffa72fe7d5d0931dac8216ebb",
            "to_number": "+18573714155",
            "from_number": "+84389807069",
            "body": "Hello World",
            "status": "received",
            "direction": "inbound",
            "created_at": "2025-03-12T09:30:45.159Z"
          }
        ]
    ```
## TODO
- Remove send SMS API
- Remove the Postgres DB because we don't need to store any SMS. Keep it as is for the moment
- Add Service to prepare data and send promt request to FastAPI server
- Add logic to return image url from Marko to Twilio

