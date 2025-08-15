import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, username, password });
      alert('Registered. Please log in.');
      nav('/login');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="container">
      <h3>Register</h3>
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <label>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} />
        <label>Username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button>Create account</button>
        </div>
      </form>
    </div>
  );
}
