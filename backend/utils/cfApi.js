const axios = require('axios');
const Problem = require('../models/Problem');

const CF_BASE = 'https://codeforces.com/api';

async function fetchAndCacheProblems() {
  try {
    const res = await axios.get(`${CF_BASE}/problemset.problems`);
    if (!res.data || res.data.status !== 'OK') throw new Error('CF fetch failed');
    const problems = res.data.result.problems
      .filter(p => p.rating)
      .map(p => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
        url: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`
      }));
    await Problem.deleteMany({});
    await Problem.insertMany(problems);
    console.log('[CF] cached', problems.length, 'problems');
  } catch (err) {
    console.error('[CF] fetch error', err.message);
  }
}

// pick random problem within min..max (avoid previously used list passed as excluded)
async function pickRandomProblem(min, max, excluded = []) {
  const query = { rating: { $gte: min, $lte: max } };
  let items = await Problem.find(query).limit(1000).lean();
  if (!items.length) {
    // fallback broader
    items = await Problem.find({ rating: { $gte: Math.max(800, min-200), $lte: max+200 } }).limit(1000).lean();
  }
  if (!items.length) throw new Error('No problems available for this range');
  const exSet = new Set(excluded.map(e => `${e.contestId}_${e.index}`));
  const filtered = items.filter(i => !exSet.has(`${i.contestId}_${i.index}`));
  if (!filtered.length) return items[Math.floor(Math.random()*items.length)];
  return filtered[Math.floor(Math.random()*filtered.length)];
}

// check latest submissions of a user for a problem (contestId,index)
// returns the earliest OK submission object or null
async function checkUserSolved(handle, contestId, index, count = 50) {
  try {
    const res = await axios.get(`${CF_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`);
    if (!res.data || res.data.status !== 'OK') return null;
    const subs = res.data.result;
    const ok = subs.filter(s =>
      s.problem && s.problem.contestId === contestId &&
      s.problem.index === index &&
      s.verdict === 'OK'
    );
    if (!ok.length) return null;
    ok.sort((a,b) => a.creationTimeSeconds - b.creationTimeSeconds);
    return ok[0];
  } catch (err) {
    console.error('[CF] user.status err', err.message);
    return null;
  }
}

module.exports = {
  fetchAndCacheProblems,
  pickRandomProblem,
  checkUserSolved
};
