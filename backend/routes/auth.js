const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'username exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, passwordHash: hash });
    const token = jwt.sign({ uid: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, username: user.username } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const u = await User.findOne({ username });
    if (!u) return res.status(400).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, u.passwordHash || '');
    if (!ok) return res.status(400).json({ error: 'invalid' });
    const token = jwt.sign({ uid: u._id }, JWT_SECRET);
    res.json({ token, user: { id: u._id, name: u.name, username: u.username, cfUsername: u.cfUsername, cfRating: u.cfRating } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
