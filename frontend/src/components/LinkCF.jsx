import React, { useState, useEffect } from 'react';
import { Link2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
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
    <div className="container container-sm">
      <div className="card animate-fade-in">
        <div className="card-header text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center">
              <Link2 size={32} className="text-white" />
            </div>
          </div>
          <h2 className="card-title">Link Codeforces Account</h2>
          <p className="text-secondary">Connect your CF handle for automatic verification</p>
        </div>
        
        <div className="card-content">
          {me?.cfUsername ? (
            <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} className="text-success" />
                <span className="font-semibold text-success">Currently Linked</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{me.cfUsername}</p>
                  <p className="text-sm text-secondary">
                    Rating: {me.cfRating || 'Unrated'}
                  </p>
                </div>
                <a 
                  href={`https://codeforces.com/profile/${me.cfUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  <ExternalLink size={16} />
                  View Profile
                </a>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-warning" />
                <span className="font-semibold text-warning">Not Linked</span>
              </div>
              <p className="text-sm text-secondary">
                Link your Codeforces account to participate in duels
              </p>
            </div>
          )}
          
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">
                <Link2 size={16} className="inline mr-2" />
                Codeforces Handle
              </label>
              <input 
                className="form-input"
                value={handle} 
                onChange={e => setHandle(e.target.value)}
                placeholder="Enter your CF handle (e.g., tourist)"
                required
              />
              <p className="text-xs text-muted mt-2">
                Make sure your handle is correct - we'll verify it with Codeforces API
              </p>
            </div>
            
            <button type="submit" className="btn btn-warning w-full btn-lg">
              <Link2 size={20} />
              {me?.cfUsername ? 'Update Handle' : 'Link Account'}
            </button>
          </form>
          
          {status && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-sm text-success font-medium">{status}</p>
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <div className="text-xs text-muted">
            <p className="mb-2"><strong>Why link your account?</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Automatic submission verification</li>
              <li>Display your current rating</li>
              <li>Track your competitive progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
