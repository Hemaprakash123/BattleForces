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
    
    // Get user info for better room creation response
    const user = await User.findById(req.user.uid).lean();
    if (!user) return res.status(404).json({ error: 'user not found' });
    
    const code = nanoid(8);
    const passcode = (Math.floor(Math.random() * 900000) + 100000).toString();
    const room = await Room.create({
      code, passcode, host: req.user.uid, numProblems, ranges, scores: { [req.user.uid]: 0 }
    });
    
    res.json({ 
      code: room.code, 
      passcode: room.passcode,
      message: 'Room created successfully! Share the passcode with your opponent.',
      hostName: user.name || user.username
    });
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
    
    // Get user info
    const user = await User.findById(req.user.uid).lean();
    const host = await User.findById(room.host).lean();
    
    room.guest = req.user.uid;
    room.status = 'ready';
    room.scores.set(req.user.uid, 0);
    await room.save();
    
    res.json({ 
      code: room.code, 
      message: `Successfully joined ${host?.name || host?.username || 'Host'}'s room!`,
      guestName: user?.name || user?.username
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get room info (for rejoining)
router.get('/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code }).lean();
    if (!room) return res.status(404).json({ error: 'room not found' });
    
    // Check if user is part of this room
    const isParticipant = room.host.toString() === req.user.uid || 
                         (room.guest && room.guest.toString() === req.user.uid);
    
    if (!isParticipant) return res.status(403).json({ error: 'not authorized to view this room' });
    
    // Get user details
    const host = await User.findById(room.host).lean();
    const guest = room.guest ? await User.findById(room.guest).lean() : null;
    
    res.json({
      room,
      host: host ? {
        id: host._id,
        name: host.name,
        username: host.username,
        cfUsername: host.cfUsername,
        cfRating: host.cfRating
      } : null,
      guest: guest ? {
        id: guest._id,
        name: guest.name,
        username: guest.username,
        cfUsername: guest.cfUsername,
        cfRating: guest.cfRating
      } : null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
