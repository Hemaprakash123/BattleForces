import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function LinkCF() {
  const [handle, setHandle] = useState('');
  const [me, setMe] = useState(JSON.parse(localStorage.getItem('me') || 'null'));
  const [status, setStatus] = useState('');

  useEffect(() => { setMe(JSON.parse(localStorage.getItem('me') || 'null')); }, []);

  async function submit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Login first');
    try {
      const res = await axios.put('http://localhost:5000/api/user/link-cf', { handle }, { headers: { Authorization: `Bearer ${token}` }});
      setStatus(`Linked ${res.data.cfUsername} (rating: ${res.data.cfRating || 'N/A'})`);
      // update local user record
      const updated = { ...me, cfUsername: res.data.cfUsername, cfRating: res.data.cfRating };
      localStorage.setItem('me', JSON.stringify(updated));
      setMe(updated);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="container">
      <h3>Link Codeforces Handle</h3>
      <div style={{ maxWidth: 420 }}>
        <div className="small">Current: {me?.cfUsername || 'not linked'}</div>
        <form onSubmit={submit}>
          <label>Codeforces handle</label>
          <input value={handle} onChange={e => setHandle(e.target.value)} />
          <div style={{ marginTop: 10 }}>
            <button>Link</button>
          </div>
        </form>
        {status && <div style={{ marginTop: 10 }} className="small">{status}</div>}
      </div>
    </div>
  );
}
