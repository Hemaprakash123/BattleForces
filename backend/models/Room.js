const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true }, // short room id
  passcode: String,                      // 6-digit string
  host: { type: mongoose.Types.ObjectId, ref: 'User' },
  guest: { type: mongoose.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, default: 'waiting' }, // waiting, ready, live, finished
  numProblems: { type: Number, default: 3 },
  ranges: { type: Array, default: [] }, // list of {label,min,max} length == numProblems
  roundIndex: { type: Number, default: 0 },
  currentProblem: { type: Object, default: null },
  scores: { type: Map, of: Number, default: {} },
  rounds: { type: Array, default: [] }, // records of rounds
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
