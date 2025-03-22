const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const smsRoutes = require('./routes/smsRoutes');
const urlShortenRoutes = require('./routes/urlShortenRoutes');

app.use('/sms', smsRoutes);
app.use('/', urlShortenRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
