import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import LinkCF from './components/LinkCF';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Room from './components/Room';
import api from './api';

export default function App() {
  const [me, setMe] = useState(JSON.parse(localStorage.getItem('me') || 'null'));
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
    nav('/');
  }

  return (
    <div>
      <nav className="topbar">
        <div>
          <Link to="/">CF Duel</Link>
        </div>
        <div className="navlinks">
          {me ? (
            <>
              <Link to="/link-cf">Link CF</Link>
              <Link to="/create-room">Create Room</Link>
              <Link to="/join-room">Join Room</Link>
              <button onClick={logout} className="link-button">Logout</button>
              <span className="username">Hi, {me.username}</span>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main style={{ padding: 16 }}>
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

function Home() {
  const navigate = useNavigate();
  function handleCreateRoom() {
    navigate('/create-room');
  }
  function handleJoinRoom() {
    navigate('/join-room');
  }
  return (
    <div>
      <h1>Welcome to CF Duel</h1>
      <p>
        This is a platform to compete with your friends on Codeforces problems.
        Create or join rooms, solve problems, and see who can finish first!
      </p>
      

      <div style={{margin:'50px'}} >
        <button onClick={handleCreateRoom} >Create room</button>
      <label>-To Create a room </label>
      <button onClick={handleJoinRoom}>Join room</button>
      <label>-To Join a room </label>
      </div>
    </div>
  );
}
