// Load environment variables
require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
// const cors = require('cors')

// Create an Express app
const app = express()

// Middlewares
// app.use(cors()) // NOTE: Uncomment to enable CORS
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const smsRoutes = require('./routes/smsRoutes')
const urlShortenRoutes = require('./routes/urlShortenRoutes')
app.use('/sms', smsRoutes)
app.use('/', urlShortenRoutes)

// Default route for undefined routes
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handling middleware
app.use((error, _req, res, _next) => {
  // console.log(error)
  const { statusCode = 500, message, data } = error
  res.status(statusCode).json({ message, data })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(_result => {
    console.log('Connected to MongoDB')

    // Start the server
    const PORT = process.env.PORT || 3000
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('SIGINT received. Shutting down gracefully...')
      try {
        await mongoose.disconnect()
        server.close(() => {
          console.log('Server closed.')
          process.exit(0)
        })
      } catch (err) {
        console.error('Error during shutdown:', err)
        process.exit(1)
      }
    })

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Shutting down gracefully...')
      try {
        await mongoose.disconnect()
        server.close(() => {
          console.log('Server closed.')
          process.exit(0)
        })
      } catch (err) {
        console.error('Error during shutdown:', err)
        process.exit(1)
      }
    })
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err)
    process.exit(1) // Exit the process if the database connection fails
  })

// Global error handlers for uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err)
  try {
    await mongoose.disconnect()
  } catch (disconnectErr) {
    console.error('Error disconnecting from MongoDB:', disconnectErr)
  }
  process.exit(1)
})

// Global error handlers for uncaught rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  try {
    await mongoose.disconnect()
  } catch (disconnectErr) {
    console.error('Error disconnecting from MongoDB:', disconnectErr)
  }
  process.exit(1)
})

module.exports = app
