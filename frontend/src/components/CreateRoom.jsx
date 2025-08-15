import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PRESETS = [
  { label: 'Easy', min: 800, max: 1200 },
  { label: 'Medium', min: 1300, max: 1600 },
  { label: 'Hard', min: 1700, max: 2000 },
  { label: 'Expert', min: 2100, max: 2500 },
  { label: 'Mixed', min: 800, max: 2500 }
];

export default function CreateRoom() {
  const [num, setNum] = useState(3);
  const [ranges, setRanges] = useState(Array(3).fill(PRESETS[0]));
  const nav = useNavigate();

  function changeRange(idx, presetIdx) {
    const copy = [...ranges];
    copy[idx] = PRESETS[presetIdx];
    setRanges(copy);
  }

  function changeNum(n) {
    setNum(n);
    setRanges(old => {
      const a = old.slice(0, n);
      while (a.length < n) a.push(PRESETS[0]);
      return a;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('login first');
    try {
      const body = { numProblems: num, ranges };
      const res = await axios.post('http://localhost:5000/api/room/create', body, { headers: { Authorization: `Bearer ${token}` }});
      alert('Room created. Passcode: ' + res.data.passcode);
      nav('/room/' + res.data.code);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="container">
      <h3>Create Room</h3>
      <div style={{ maxWidth: 700 }}>
        <label>Number of problems</label>
        <select value={num} onChange={e => changeNum(Number(e.target.value))}>
          {Array.from({ length: 7 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>

        <form onSubmit={submit}>
          {Array.from({ length: num }).map((_, i) => (
            <div key={i} style={{ marginTop: 8 }}>
              <label>Problem {i + 1} range</label>
              <select value={PRESETS.findIndex(p => p.label === ranges[i].label)} onChange={e => changeRange(i, Number(e.target.value))}>
                {PRESETS.map((p, idx) => <option key={p.label} value={idx}>{p.label} ({p.min}-{p.max})</option>)}
              </select>
            </div>
          ))}

          <div style={{ marginTop: 14 }}>
            <button>Create Room</button>
          </div>
        </form>
      </div>
    </div>
  );
}
