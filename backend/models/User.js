const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  passwordHash: String,
  rating: { type: Number, default: 1500 },       // your app rating
  history: { type: Array, default: [] },         // array of match summaries
  cfRating: { type: Number, default: null },     // codeforces rating
  cfUsername: { type: String, default: null }    // codeforces handle
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
