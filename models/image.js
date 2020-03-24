const mongoose = require("mongoose");

var ImageSchema = new mongoose.Schema({
  // The path is relative to the uploads directory
  path: String,
  size: Number,
  upload_date: Date,
  referers: { type: Array, default: [] },
});

var Image= mongoose.model('Image', ImageSchema);

module.exports = Image
