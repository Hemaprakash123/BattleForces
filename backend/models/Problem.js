const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  contestId: Number,
  index: String,
  name: String,
  rating: Number,
  tags: [String],
  url: String
});
problemSchema.index({ rating: 1 });
module.exports = mongoose.model('Problem', problemSchema);
