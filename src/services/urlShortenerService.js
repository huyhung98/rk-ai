// src/services/urlShortenerService.js
const db = require('../configs/database');
const { v4: uuidv4 } = require('uuid');

class UrlShortenerService {
  async shortenUrl(longUrl) {
    const shortId = uuidv4().slice(0, 8); // Generate a short ID
    const query = `
      INSERT INTO shortened_urls (short_id, long_url)
      VALUES ($1, $2)
      RETURNING short_id
    `;
    const values = [shortId, longUrl];

    try {
      const result = await db.query(query, values);
      return `${process.env.BASE_URL}/${result.rows[0].short_id}`;
    } catch (error) {
      console.error('Error shortening URL:', error);
      throw new Error('Failed to shorten URL');
    }
  }

  async getLongUrl(shortId) {
    const query = `
      SELECT long_url
      FROM shortened_urls
      WHERE short_id = $1
    `;
    const values = [shortId];

    try {
      const result = await db.query(query, values);
      if (result.rows.length > 0) {
        return result.rows[0].long_url;
      } else {
        throw new Error('No URL found for the given short ID');
      }
    } catch (error) {
      console.error('Error fetching long URL:', error);
      throw new Error('Failed to fetch long URL');
    }
  }
}

module.exports = new UrlShortenerService();