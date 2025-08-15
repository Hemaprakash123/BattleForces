import React, { useState } from 'react';
import { UserPlus, User, Lock, Mail } from 'lucide-react';
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
    <div className="container container-sm">
      <div className="card animate-fade-in">
        <div className="card-header text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <UserPlus size={32} className="text-white" />
            </div>
          </div>
          <h2 className="card-title">Create Account</h2>
          <p className="text-secondary">Join the CF Duel community</p>
        </div>
        
        <div className="card-content">
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">
                <User size={16} className="inline mr-2" />
                Full Name
              </label>
              <input 
                className="form-input"
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} className="inline mr-2" />
                Username
              </label>
              <input 
                className="form-input"
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose a username"
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
                placeholder="Create a secure password"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-success w-full btn-lg">
              <UserPlus size={20} />
              Create Account
            </button>
          </form>
        </div>
        
        <div className="card-footer text-center">
          <p className="text-secondary">
            Already have an account?{' '}
            <button 
              onClick={() => nav('/login')} 
              className="text-primary font-semibold hover:underline bg-none border-none cursor-pointer"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
