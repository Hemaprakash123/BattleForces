import React, { useState } from 'react';
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
    <div className="container">
      <h3>Join Room</h3>
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <label>Passcode</label>
        <input value={passcode} onChange={e => setPasscode(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button>Join</button>
        </div>
      </form>
    </div>
  );
}
