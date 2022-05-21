const mongoose = require("mongoose")

var ImageSchema = new mongoose.Schema({

  filename: String,
  path: String, // Legacy, renamed into filename above


  size: Number,
  upload_date: Date,
  uploader_id: String,

  restricted: Boolean, // Whether an image can be viewed by someone else than the uploader

  // Keeping track of views and origin of those views
  views: { type: Number, default: 0 },
  last_viewed: Date,
  referers: { type: Array, default: [] },
})

var Image = mongoose.model('Image', ImageSchema)

module.exports = Image
