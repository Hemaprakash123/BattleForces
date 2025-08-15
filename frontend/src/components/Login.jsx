import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;
      if (onLogin) onLogin(user, token);
      else {
        localStorage.setItem('token', token);
        localStorage.setItem('me', JSON.stringify(user));
        nav('/');
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="container">
      <h3>Login</h3>
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <label>Username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button>Login</button>
        </div>
      </form>
    </div>
  );
}
