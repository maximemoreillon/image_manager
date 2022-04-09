const mongoose = require("mongoose")

var ImageSchema = new mongoose.Schema({

  filename: String,
  path: String, // Legacy, renamed into filename above


  size: Number,
  upload_date: Date,
  uploader_id: String,

  // Keeping track of views and origin of those views
  referers: { type: Array, default: [] },
  views: { type: Number, default: 0 },
})

var Image = mongoose.model('Image', ImageSchema)

module.exports = Image
