import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import Clock from './Clock.jsx'; 

export default function Room() {
  const { code } = useParams();
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [problem, setProblem] = useState(null);
  const [scores, setScores] = useState({});
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('');
  const messageRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }
    const s = io('http://localhost:5000', { auth: { token } });
    setSocket(s);

    s.on('connect', () => {
      s.emit('join_room', { code });
    });

    s.on('room_state', (data) => {
      // data may be wrapped or plain; handle both
      const room = data.room || data;
      setRoomState(room);
      setScores(Object.fromEntries(room.scores || []));
    });

    s.on('round_start', ({ problem: p, roundIndex, total }) => {
      setProblem(p);
      setStatus(`Round ${roundIndex}/${total} started`);
    });

    s.on('round_win', ({ winnerId, scores }) => {
      setStatus(`Round won by ${winnerId}`);
      setScores(scores);
    });

    s.on('match_end', ({ scores, msg }) => {
      setStatus(`Match ended ${msg ? '- ' + msg : ''}`);
      setScores(scores || {});
    });

    s.on('chat_message', (m) => {
      setMessages(prev => [...prev, m]);
    });

    s.on('status', (s) => {
      setStatus(s.msg || s);
    });

    s.on('error', (err) => {
      console.error('socket error', err);
      alert(err.message || JSON.stringify(err));
    });

    return () => {
      s.disconnect();
    };
  }, [code]);

  async function notifyReady() {
    if (!socket) return alert('Socket not connected');
    socket.emit('host_ready', { code });
  }

  function markCompleted() {
    if (!socket) return alert('Socket not connected');
    socket.emit('completed', { code });
  }

  function sendChat() {
    const text = messageRef.current?.value;
    if (!text || !socket) return;
    socket.emit('chat_message', { code, text });
    messageRef.current.value = '';
  }

  return (
    <div className="container room-grid">
      <div className="left">
        <h3>Room: {code}</h3>
        <div className="small">Status: {status}</div>

        <div style={{ marginTop: 16 }}>
          <h4>Players & Scores</h4>
          <div>
            {roomState ? (
              <>
                <div><b>Host:</b> {roomState.host?.username || roomState.host?.name || roomState.host}</div>
                <div><b>Guest:</b> {roomState.guest?.username || roomState.guest?.name || 'Waiting...'}</div>
                <div style={{ marginTop: 8 }}>
                  {Object.keys(scores).length ? Object.entries(scores).map(([uid, sc]) => (
                    <div key={uid}>{uid}: {sc}</div>
                  )) : <div className="small">No scores yet</div>}
                </div>
              </>
            ) : <div>Loading room...</div>}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Current Problem</h4>
          {problem ? (
            <div>
              <a href={problem.url} target="_blank" rel="noreferrer">{problem.name} [{problem.rating}]</a>
              <div style={{ marginTop: 8 }}>
                <button onClick={markCompleted}>Completed (I solved on CF)</button>
                <small style={{ display: 'block', marginTop: 8 }} className="small">After solving on Codeforces, click Completed to verify.</small>
              </div>
            </div>
          ) : (
            <div>No active problem</div>
          )}
        </div>

      </div>

      <div className="right">
        <h4>Chat</h4>
        <div className="chat-box">
          {messages.length === 0 && <div className="small">No messages</div>}
          {messages.map((m, i) => (
            <div className="message" key={i}>
              <div><b>{m.user.username}</b> <span className="small">{new Date(m.ts).toLocaleTimeString()}</span></div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8 }}>
          <input placeholder="Type a message" ref={messageRef} />
          <div style={{ marginTop: 8 }}>
            <button onClick={sendChat}>Send</button>
            <button style={{ marginLeft: 8 }} onClick={notifyReady}>I'm Ready (Host)</button>
          </div>
        </div>

        <div>
          <Clock competitionStatus={roomState?.status} />
        </div>

      </div>
    </div>
  );
}
