require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const roomRoutes = require('./routes/room');
const cfApi = require('./utils/cfApi');
const Room = require('./models/Room');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/room', roomRoutes);

const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log('Mongo connected'))
  .catch(e => console.error(e));

// On startup fetch CF problems (if enabled)
if (process.env.CF_CACHE_ENABLED === 'true') {
  cfApi.fetchAndCacheProblems();
  // daily refresh at 03:00 UTC (customize)
  cron.schedule('0 3 * * *', () => cfApi.fetchAndCacheProblems());
}

// in-memory room state: poll timers and locks
const roomState = {}; // roomCode -> { pollIntervalId, breakTimeoutId, roundLocked }

function verifyToken(token) {
  try {
    const payload = require('jsonwebtoken').verify(token, JWT_SECRET);
    return payload;
  } catch(e) { return null; }
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('unauthenticated'));
  const payload = verifyToken(token);
  if (!payload) return next(new Error('unauthenticated'));
  socket.data.userId = payload.uid;
  next();
});

io.on('connection', (socket) => {
  const uid = socket.data.userId;
  console.log('socket connected', uid);

  socket.on('join_room', async ({ code }) => {
    try {
      const room = await Room.findOne({ code }).lean();
      if (!room) return socket.emit('error', { message: 'room_not_found' });
      socket.join(code);
      // send basic state
      const host = await User.findById(room.host).lean();
      const guest = room.guest ? await User.findById(room.guest).lean() : null;
      io.to(code).emit('room_state', { room, host: { id: host._id, name: host.name, username: host.username, cfUsername: host.cfUsername }, guest: guest ? { id: guest._id, name: guest.name, username: guest.username, cfUsername: guest.cfUsername } : null });
    } catch (err) { console.error(err); }
  });

  socket.on('host_ready', async ({ code }) => {
    try {
      const room = await Room.findOne({ code });
      if (!room) return socket.emit('error', { message: 'room_not_found' });
      if (room.status !== 'ready') return socket.emit('status', { msg: 'room not ready' });
      // start match
      room.status = 'live';
      room.roundIndex = 0;
      await room.save();
      startNextRound(code);
    } catch (err) { console.error(err); }
  });

  socket.on('chat_message', ({ code, text }) => {
    User.findById(uid).then(u => {
      io.to(code).emit('chat_message', { user: { id: u._id, username: u.username }, text, ts: Date.now() });
    });
  });

  socket.on('completed', async ({ code }) => {
    // user clicked Completed button after submitting on CF.
    try {
      const room = await Room.findOne({ code });
      if (!room || !room.currentProblem) return socket.emit('status', { msg: 'no active problem' });
      const user = await User.findById(uid);
      if (!user.cfUsername) return socket.emit('status', { msg: 'link CF handle first' });
      // Check CF for solved
      const sub = await cfApi.checkUserSolved(user.cfUsername, room.currentProblem.contestId, room.currentProblem.index, 50);
      if (sub) {
        // handle first-AC race: roomState lock
        roomState[code] = roomState[code] || {};
        if (roomState[code].roundLocked) {
          socket.emit('status', { msg: 'another player already solved' });
          return;
        }
        roomState[code].roundLocked = true;
        // determine winner id
        let winnerId = null;
        if (room.host.toString() === uid) winnerId = room.host.toString();
        else if (room.guest && room.guest.toString() === uid) winnerId = room.guest.toString();
        else winnerId = uid; // fallback

        const prev = room.scores.get(winnerId) || 0;
        room.scores.set(winnerId, prev + 1);
        room.rounds.push({ round: room.roundIndex, contestId: room.currentProblem.contestId, index: room.currentProblem.index, winnerId, ts: Date.now() });
        await room.save();
        io.to(code).emit('round_win', { winnerId, scores: Object.fromEntries(room.scores) });

        // clear polling if any
        if (roomState[code] && roomState[code].pollIntervalId) {
          clearInterval(roomState[code].pollIntervalId);
          roomState[code].pollIntervalId = null;
        }

        // 20s break then next round
        roomState[code].breakTimeoutId = setTimeout(async () => {
          roomState[code].roundLocked = false;
          const fresh = await Room.findOne({ code });
          if (!fresh) return;
          if (fresh.roundIndex >= fresh.numProblems) {
            fresh.status = 'finished';
            await fresh.save();
            io.to(code).emit('match_end', { scores: Object.fromEntries(fresh.scores) });
            // Save history to users
            await saveMatchHistory(fresh);
          } else {
            startNextRound(code);
          }
        }, 20000);
      } else {
        socket.emit('status', { msg: 'not solved yet on Codeforces (or not found in recent subs)' });
      }
    } catch (err) { console.error(err); socket.emit('status', { msg: 'error checking CF' }); }
  });

  socket.on('disconnect', async () => {
    // if a player disconnects and match live -> start 30s grace then end if not returned
    console.log('socket disconnected', uid);
    // find rooms where this user is host or guest and status live
    const liveRooms = await Room.find({ status: 'live', $or: [ { host: uid }, { guest: uid } ] });
    for (const r of liveRooms) {
      const code = r.code;
      roomState[code] = roomState[code] || {};
      if (roomState[code].disconnectTimeout) clearTimeout(roomState[code].disconnectTimeout);
      roomState[code].disconnectTimeout = setTimeout(async () => {
        const fresh = await Room.findOne({ code });
        if (!fresh) return;
        // decide leaver
        // if either player gone -> finish match and penalize leaver
        fresh.status = 'finished';
        await fresh.save();
        io.to(code).emit('match_end', { scores: Object.fromEntries(fresh.scores), msg: 'ended due to disconnect' });
        // we can apply rating penalty here (simple)
        await saveMatchHistory(fresh, { leaverPenalty: true });
      }, 30000);
    }
  });

  // helper to start round
  async function startNextRound(code) {
    try {
      const room = await Room.findOne({ code });
      if (!room) return;
      room.roundIndex += 1;
      // pick range for this round
      const rangeSpec = room.ranges[room.roundIndex - 1];
      let min = rangeSpec.min, max = rangeSpec.max;
      // if label 'Mixed' you might randomize among presets; for now Mixed -> sample between 800..2500
      if (rangeSpec.label && rangeSpec.label.toLowerCase() === 'mixed') {
        min = 800; max = 2500;
      }
      // pick problem (exclude previously used)
      const excluded = room.rounds.map(r => ({ contestId: r.contestId, index: r.index }));
      const problem = await cfApi.pickRandomProblem(min, max, excluded);
      room.currentProblem = { contestId: problem.contestId, index: problem.index, name: problem.name, rating: problem.rating, url: problem.url };
      await room.save();
      io.to(code).emit('round_start', { roundIndex: room.roundIndex, total: room.numProblems, problem: room.currentProblem });

      // start polling loop: check both players every 5s
      if (roomState[code] && roomState[code].pollIntervalId) {
        clearInterval(roomState[code].pollIntervalId);
      }
      roomState[code].roundLocked = false;
      roomState[code].pollIntervalId = setInterval(async () => {
        try {
          const fresh = await Room.findOne({ code });
          if (!fresh || !fresh.currentProblem) return;
          const handles = [];
          const host = await User.findById(fresh.host).lean();
          const guest = fresh.guest ? await User.findById(fresh.guest).lean() : null;
          if (host && host.cfUsername) handles.push({ handle: host.cfUsername, userId: host._id.toString() });
          if (guest && guest.cfUsername) handles.push({ handle: guest.cfUsername, userId: guest._id.toString() });

          for (const h of handles) {
            if (roomState[code].roundLocked) break;
            const sub = await cfApi.checkUserSolved(h.handle, fresh.currentProblem.contestId, fresh.currentProblem.index, 50);
            if (sub) {
              // lock and apply winner flow
              roomState[code].roundLocked = true;
              const winnerId = h.userId;
              const prev = fresh.scores.get(winnerId) || 0;
              fresh.scores.set(winnerId, prev + 1);
              fresh.rounds.push({ round: fresh.roundIndex, contestId: fresh.currentProblem.contestId, index: fresh.currentProblem.index, winnerId, ts: Date.now() });
              await fresh.save();
              io.to(code).emit('round_win', { winnerId, scores: Object.fromEntries(fresh.scores) });
              // clear polling
              if (roomState[code].pollIntervalId) { clearInterval(roomState[code].pollIntervalId); roomState[code].pollIntervalId = null; }
              // 20s break then next
              roomState[code].breakTimeoutId = setTimeout(async () => {
                roomState[code].roundLocked = false;
                const after = await Room.findOne({ code });
                if (!after) return;
                if (after.roundIndex >= after.numProblems) {
                  after.status = 'finished';
                  await after.save();
                  io.to(code).emit('match_end', { scores: Object.fromEntries(after.scores) });
                  await saveMatchHistory(after);
                } else {
                  startNextRound(code);
                }
              }, 20000);
              break;
            }
          }
        } catch (e) { console.error('poll loop err', e.message); }
      }, 5000);

    } catch (err) { console.error('startNextRound err', err.message); }
  }

  // save match summary into both users' history and optionally adjust rating
  async function saveMatchHistory(room, opts = {}) {
    try {
      const host = await User.findById(room.host);
      const guest = room.guest ? await User.findById(room.guest) : null;
      const summary = {
        roomCode: room.code,
        date: new Date(),
        rounds: room.rounds,
        scores: Object.fromEntries(room.scores)
      };
      // append to host history
      host.history = host.history || [];
      host.history.push(summary);
      await host.save();
      if (guest) {
        guest.history = guest.history || [];
        guest.history.push(summary);
        await guest.save();
      }
      // optionally implement rating adjustments; for prototype we'll skip ELO calc.
      if (opts.leaverPenalty) {
        // simple penalty: reduce rating by 10 for leaver
        if (guest && !guestConnected(room) && host) {
          // detect who left - simplistic: if guest disconnected
          guest.cfRating = Math.max(0, (guest.cfRating || 1500) - 10);
          await guest.save();
        }
      }
    } catch (err) { console.error('saveMatchHistory err', err.message); }
  }

  function guestConnected(room) {
    // quick check - if guest has socket in room
    const sockets = io.sockets.adapter.rooms.get(room.code);
    return sockets && sockets.size > 1;
  }

});
 
app.get('/', (req,res) => res.json({ ok: true }));

server.listen(PORT, () => console.log('Server running on', PORT));
