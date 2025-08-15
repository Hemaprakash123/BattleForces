import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import LinkCF from './components/LinkCF';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Room from './components/Room';
import Home from './components/Home';
import api from './api';

export default function App() {
  const [me, setMe] = useState(JSON.parse(localStorage.getItem('me') || 'null'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !me) {
      // try fetch /user/me
      (async () => {
        try {
          const res = await api.get('/user/me', { headers: { Authorization: `Bearer ${token}` }});
          localStorage.setItem('me', JSON.stringify(res.data.user));
          setMe(res.data.user);
        } catch (e) {
          console.log('Not logged in / session expired');
        }
      })();
    }
  }, []);

  function handleLogin(user, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('me', JSON.stringify(user));
    setMe(user);
    nav('/');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
    setMe(null);
    setMobileMenuOpen(false);
    nav('/');
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }
  return (
    <div>
      <nav className="topbar">
        <div className="topbar-content">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            CF Duel
          </Link>
          
          <button 
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className={`navlinks ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {me ? (
              <>
                <Link to="/link-cf" className="nav-link" onClick={closeMobileMenu}>
                  Link CF
                </Link>
                <Link to="/create-room" className="nav-link" onClick={closeMobileMenu}>
                  Create Room
                </Link>
                <Link to="/join-room" className="nav-link" onClick={closeMobileMenu}>
                  Join Room
                </Link>
                <button onClick={logout} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                  Logout
                </button>
                <span className="username">
                  {me.name || me.username}
                </span>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                  Login
                </Link>
                <Link to="/register" className="nav-link" onClick={closeMobileMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/link-cf" element={<LinkCF />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/room/:code" element={<Room />} />
        </Routes>
      </main>
    </div>
  );
}
