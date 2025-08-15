const express = require('express');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const Room = require('../models/Room');
const User = require('../models/User');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// auth middleware
function auth(req,res,next){
  const a = req.headers.authorization;
  if (!a) return res.status(401).json({ error:'no token' });
  try {
    const token = a.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch(e){ res.status(401).json({ error:'invalid token' }); }
}

// Create room
router.post('/create', auth, async (req,res) => {
  try {
    const { numProblems, ranges } = req.body;
    if (!numProblems || !ranges || ranges.length !== numProblems) return res.status(400).json({ error: 'invalid input' });
    // basic validation of ranges
    for (const r of ranges) {
      if (typeof r.min !== 'number' || typeof r.max !== 'number' || r.min > r.max) return res.status(400).json({ error: 'invalid ranges' });
    }
    const code = nanoid(8);
    const passcode = (Math.floor(Math.random() * 900000) + 100000).toString();
    const room = await Room.create({
      code, passcode, host: req.user.uid, numProblems, ranges, scores: { [req.user.uid]: 0 }
    });
    res.json({ code: room.code, passcode: room.passcode });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Join room by passcode
router.post('/join', auth, async (req,res) => {
  try {
    const { passcode } = req.body;
    if (!passcode) return res.status(400).json({ error: 'passcode required' });
    const room = await Room.findOne({ passcode, status: 'waiting' });
    if (!room) return res.status(404).json({ error: 'room not found or already started' });
    if (room.host.toString() === req.user.uid) return res.status(400).json({ error: 'host cannot join as guest' });
    room.guest = req.user.uid;
    room.status = 'ready';
    room.scores.set(req.user.uid, 0);
    await room.save();
    res.json({ code: room.code, message: 'joined' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
