const twilio = require('twilio');
const db = require('../configs/database');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class SmsService {
  async sendSms(to, body) {
    try {
      const message = await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      return {
        success: true,
        messageSid: message.sid
      };
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async saveReceivedSms(from, to, body, sid) {
    try {
      const queryText = `
        INSERT INTO messages (sid, to_number, from_number, body, status, direction)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [sid, to, from, body, 'received', 'inbound'];
      const result = await db.query(queryText, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to save SMS: ${error.message}`);
    }
  }

  async updateMessageId(sId, messageId) {
    const query = `
      UPDATE messages
      SET message_id = $1
      WHERE sid = $2
    `;
    const values = [messageId, sId];

    try {
      await db.query(query, values);
      console.log('Message ID updated successfully');
    } catch (error) {
      console.error('Error updating message ID:', error.stack);
      throw new Error('Failed to update message ID');
    }
  }

  async getRecipientNumberByMessageId(messageId) {
    const query = `
      SELECT from_number
      FROM messages
      WHERE message_id = $1
    `;
    const values = [messageId];

    try {
      const result = await db.query(query, values);
      if (result.rows.length > 0) {
        return result.rows[0].from_number;
      } else {
        throw new Error('No recipient found for the given message ID');
      }
    } catch (error) {
      console.error('Error fetching recipient number:', error.stack);
      throw new Error('Failed to fetch recipient number');
    }
  }

  async getAllMessages() {
    try {
      const result = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }
}

module.exports = new SmsService();