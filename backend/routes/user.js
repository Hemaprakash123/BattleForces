const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cfApi = require('../utils/cfApi');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function auth(req,res,next){
  const a = req.headers.authorization;
  if (!a) return res.status(401).json({ error:'no token' });
  try {
    const token = a.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch(e){ res.status(401).json({ error:'invalid token' }); }
}

router.get('/me', auth, async (req,res) => {
  const u = await User.findById(req.user.uid).lean();
  res.json({ user: u });
});

router.put('/link-cf', auth, async (req,res) => {
  try {
    const { handle } = req.body;
    if (!handle) return res.status(400).json({ error: 'handle required' });
    // verify using CF API user.info
    const axios = require('axios');
    const r = await axios.get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
    if (!r.data || r.data.status !== 'OK') return res.status(400).json({ error: 'invalid cf handle' });
    const info = r.data.result[0];
    const user = await User.findByIdAndUpdate(req.user.uid, { cfUsername: handle, cfRating: info.rating || null }, { new: true });
    res.json({ message: 'linked', cfUsername: user.cfUsername, cfRating: user.cfRating });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
