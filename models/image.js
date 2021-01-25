const mongoose = require("mongoose")

var ImageSchema = new mongoose.Schema({
  // The path is relative to the uploads directory
  path: String, // THIS SHOULD BE FILENAME
  size: Number,
  upload_date: Date,
  uploader_id: String,
  referers: { type: Array, default: [] },
  views: { type: Number, default: 0 },
})

var Image = mongoose.model('Image', ImageSchema)

module.exports = Image
