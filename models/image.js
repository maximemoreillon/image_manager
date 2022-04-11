const mongoose = require("mongoose")

var ImageSchema = new mongoose.Schema({

  filename: String,
  path: String, // Legacy, renamed into filename above


  size: Number,
  upload_date: Date,
  uploader_id: String,

  // Keeping track of views and origin of those views
  views: { type: Number, default: 0 },
  last_viewed: Date,
  referers: { type: Array, default: [] },
})

var Image = mongoose.model('Image', ImageSchema)

module.exports = Image
