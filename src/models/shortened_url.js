const mongoose = require('mongoose')
const { Schema, model } = mongoose
const validator = require('validator')

const shortenedUrlSchema = new Schema({
  shortId: {
    type: String,
    required: true,
  },
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return validator.isURL(value, { require_protocol: true })
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
})

const ShortenedUrl = mongoose.models.ShortenedUrl || model('ShortenedUrl', shortenedUrlSchema)

module.exports = ShortenedUrl
