const mongoose = require("mongoose");

var ImageSchema = new mongoose.Schema({
  path: String,
  size: Number,
  referers: { type: Array, default: [] },
});

var Image= mongoose.model('Image', ImageSchema);

module.exports = Image
