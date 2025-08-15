import React, { useState } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
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
    <div className="container container-sm">
      <div className="card animate-fade-in">
        <div className="card-header text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <LogIn size={32} className="text-white" />
            </div>
          </div>
          <h2 className="card-title">Welcome Back</h2>
          <p className="text-secondary">Sign in to your CF Duel account</p>
        </div>
        
        <div className="card-content">
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">
                <User size={16} className="inline mr-2" />
                Username
              </label>
              <input 
                className="form-input"
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <Lock size={16} className="inline mr-2" />
                Password
              </label>
              <input 
                type="password" 
                className="form-input"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-full btn-lg">
              <LogIn size={20} />
              Sign In
            </button>
          </form>
        </div>
        
        <div className="card-footer text-center">
          <p className="text-secondary">
            Don't have an account?{' '}
            <button 
              onClick={() => nav('/register')} 
              className="text-primary font-semibold hover:underline bg-none border-none cursor-pointer"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
