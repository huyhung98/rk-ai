const db = require('../configs/database');
const uuidv4 = () => crypto.randomUUID();

class UrlShortenerService {
  async shortenUrl(longUrl) {
    const shortId = uuidv4().slice(0, 8);
    const query = `
      INSERT INTO shortened_urls (short_id, original_url)
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

  async getOriginalUrl(shortId) {
    const query = `
      SELECT original_url
      FROM shortened_urls
      WHERE short_id = $1
    `;
    const values = [shortId];

    try {
      const result = await db.query(query, values);
      if (result.rowCount > 0) {
        return result.rows[0].original_url;
      } else {
        throw new Error('No URL found for the given short ID');
      }
    } catch (error) {
      console.error('Error fetching original URL:', error);
      throw new Error('Failed to fetch original URL');
    }
  }
}

module.exports = new UrlShortenerService();