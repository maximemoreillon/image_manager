const {Schema, model} = require("mongoose")

var ImageSchema = new Schema({

  filename: String,
  path: String, // Legacy, renamed into filename above

  description: String, // Optional description
  size: Number,
  upload_date: Date,
  uploader_id: String,

  restricted: Boolean, // Whether an image can be viewed by someone else than the uploader

  // Keeping track of views and origin of those views
  last_viewed: Date,
  views: { type: Number, default: 0 },
  referers: { type: Array, default: [] },
})

const Image = model('Image', ImageSchema)

module.exports = Image
