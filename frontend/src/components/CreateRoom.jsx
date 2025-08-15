import React, { useState } from 'react';
import { Plus, Settings, Users, Target } from 'lucide-react';
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
    <div className="container container-md">
      <div className="card animate-fade-in">
        <div className="card-header text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Plus size={32} className="text-white" />
            </div>
          </div>
          <h2 className="card-title">Create Duel Room</h2>
          <p className="text-secondary">Set up a custom competition for you and your friends</p>
        </div>
        
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">
              <Target size={16} className="inline mr-2" />
              Number of Problems
            </label>
            <select 
              className="form-select"
              value={num} 
              onChange={e => changeNum(Number(e.target.value))}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} Problem{i !== 0 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={submit}>
            <div className="mb-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Settings size={18} />
                Problem Difficulty Settings
              </h4>
              
              <div className="grid gap-4">
                {Array.from({ length: num }).map((_, i) => (
                  <div key={i} className="p-4 border border-border rounded-lg">
                    <label className="form-label">
                      Problem {i + 1} Difficulty Range
                    </label>
                    <select 
                      className="form-select"
                      value={PRESETS.findIndex(p => p.label === ranges[i].label)} 
                      onChange={e => changeRange(i, Number(e.target.value))}
                    >
                      {PRESETS.map((p, idx) => (
                        <option key={p.label} value={idx}>
                          {p.label} ({p.min}-{p.max} rating)
                        </option>
                      ))}
                    </select>
                    
                    <div className="mt-2 text-xs text-muted">
                      {ranges[i].label === 'Easy' && '🟢 Perfect for beginners and practice'}
                      {ranges[i].label === 'Medium' && '🟡 Good balance of challenge and solvability'}
                      {ranges[i].label === 'Hard' && '🟠 For experienced competitive programmers'}
                      {ranges[i].label === 'Expert' && '🔴 Only for the most skilled coders'}
                      {ranges[i].label === 'Mixed' && '🌈 Random difficulty - anything can happen!'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg">
              <Users size={20} />
              Create Room & Get Passcode
            </button>
          </form>
        </div>
        
        <div className="card-footer">
          <div className="text-xs text-muted">
            <p className="mb-2"><strong>How it works:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>You'll receive a 6-digit passcode to share with friends</li>
              <li>Problems are randomly selected from your chosen difficulty ranges</li>
              <li>First to solve each problem wins that round</li>
              <li>Player with most round wins takes the match!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
