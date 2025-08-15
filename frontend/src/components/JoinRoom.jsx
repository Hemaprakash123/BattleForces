import React, { useState } from 'react';
import { Users, Hash, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function JoinRoom() {
  const [passcode, setPasscode] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('login first');
    try {
      const res = await axios.post('http://localhost:5000/api/room/join', { passcode }, { headers: { Authorization: `Bearer ${token}` }});
      alert('Joined room: ' + res.data.code);
      nav('/room/' + res.data.code);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="container container-sm">
      <div className="card animate-fade-in">
        <div className="card-header text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <Users size={32} className="text-white" />
            </div>
          </div>
          <h2 className="card-title">Join Duel Room</h2>
          <p className="text-secondary">Enter the 6-digit passcode to join a competition</p>
        </div>
        
        <div className="card-content">
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">
                <Hash size={16} className="inline mr-2" />
                Room Passcode
              </label>
              <input 
                className="form-input text-center text-lg font-mono tracking-widest"
                value={passcode} 
                onChange={e => setPasscode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                style={{ letterSpacing: '0.5em' }}
              />
              <p className="text-xs text-muted mt-2">
                Ask the room host for the 6-digit passcode
              </p>
            </div>
            
            <button type="submit" className="btn btn-success w-full btn-lg">
              <ArrowRight size={20} />
              Join Room
            </button>
          </form>
        </div>
        
        <div className="card-footer">
          <div className="text-xs text-muted">
            <p className="mb-2"><strong>What happens next?</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>You'll be taken to the room lobby</li>
              <li>Wait for the host to start the competition</li>
              <li>Solve problems faster than your opponent to win!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
