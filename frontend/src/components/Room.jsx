import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  Send, 
  ExternalLink, 
  Trophy, 
  Clock as ClockIcon,
  Users as UsersIcon,
  Target,
  Zap
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Clock from './Clock.jsx'; 

export default function Room() {
  const { code } = useParams();
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [problem, setProblem] = useState(null);
  const [scores, setScores] = useState({});
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('');
  const [isHost, setIsHost] = useState(false);
  const messageRef = useRef();
  const me = JSON.parse(localStorage.getItem('me') || 'null');

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
      const host = data.host || {};
      const guest = data.guest || null;
      setRoomState(room);
      setScores(Object.fromEntries(room.scores || []));
      setIsHost(me && room.host && (room.host.toString() === me._id || room.host === me._id));
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
    <div className="room-layout">
      <div className="room-main">
        {/* Room Header */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title flex items-center gap-2">
                  <Target size={24} />
                  Room {code}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`status-badge status-${roomState?.status || 'waiting'}`}>
                    {roomState?.status || 'loading'}
                  </span>
                  {status && (
                    <span className="text-sm text-secondary">• {status}</span>
                  )}
                </div>
              </div>
              
              {isHost && roomState?.status === 'ready' && (
                <button onClick={notifyReady} className="btn btn-success">
                  <Play size={20} />
                  Start Competition
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Players & Scores */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <UsersIcon size={20} />
              Players & Scores
            </h3>
          </div>
          <div className="card-content">
            <div className="scores-container">
              {roomState ? (
                <>
                  <div className={`player-score ${Object.entries(scores).length && Math.max(...Object.values(scores)) === (scores[roomState.host] || 0) && (scores[roomState.host] || 0) > 0 ? 'winner' : ''}`}>
                    <div className="player-info">
                      <div className="player-name">
                        👑 {roomState.host?.username || roomState.host?.name || 'Host'}
                      </div>
                      {roomState.host?.cfUsername && (
                        <div className="player-handle">
                          CF: {roomState.host.cfUsername} 
                          {roomState.host.cfRating && ` (${roomState.host.cfRating})`}
                        </div>
                      )}
                    </div>
                    <div className="player-score-value">
                      {scores[roomState.host] || 0}
                    </div>
                  </div>
                  
                  <div className={`player-score ${Object.entries(scores).length && Math.max(...Object.values(scores)) === (scores[roomState.guest] || 0) && (scores[roomState.guest] || 0) > 0 ? 'winner' : ''}`}>
                    <div className="player-info">
                      <div className="player-name">
                        {roomState.guest ? (
                          `⚔️ ${roomState.guest.username || roomState.guest.name}`
                        ) : (
                          <span className="text-muted animate-pulse">Waiting for opponent...</span>
                        )}
                      </div>
                      {roomState.guest?.cfUsername && (
                        <div className="player-handle">
                          CF: {roomState.guest.cfUsername}
                          {roomState.guest.cfRating && ` (${roomState.guest.cfRating})`}
                        </div>
                      )}
                    </div>
                    <div className="player-score-value">
                      {roomState.guest ? (scores[roomState.guest] || 0) : '-'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted animate-pulse">
                  Loading room data...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Problem */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <Zap size={20} />
              Current Challenge
            </h3>
          </div>
          <div className="card-content">
            {problem ? (
              <div className="problem-card">
                <div className="problem-title">{problem.name}</div>
                <div className="problem-rating">Rating: {problem.rating}</div>
                <div className="flex gap-4 justify-center">
                  <a 
                    href={problem.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="problem-link"
                  >
                    <ExternalLink size={18} />
                    Solve on Codeforces
                  </a>
                  <button onClick={markCompleted} className="btn btn-success">
                    <CheckCircle size={18} />
                    Mark Completed
                  </button>
                </div>
                <p className="text-sm mt-4 opacity-90">
                  Submit your solution on Codeforces, then click "Mark Completed" to verify your submission.
                </p>
              </div>
            ) : (
              <div className="text-center p-8">
                <Target size={48} className="mx-auto mb-4 text-muted" />
                <h4 className="font-semibold mb-2">No Active Problem</h4>
                <p className="text-secondary">
                  {roomState?.status === 'waiting' && 'Waiting for all players to join...'}
                  {roomState?.status === 'ready' && isHost && 'Click "Start Competition" to begin!'}
                  {roomState?.status === 'ready' && !isHost && 'Waiting for host to start the competition...'}
                  {roomState?.status === 'finished' && 'Competition has ended!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="room-sidebar">
        {/* Timer */}
        <div className="clock-container">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClockIcon size={20} className="text-primary" />
            <span className="font-semibold">Competition Timer</span>
          </div>
          <Clock competitionStatus={roomState?.status === 'live' ? 'started' : roomState?.status === 'finished' ? 'ended' : 'waiting'} />
        </div>
        
        {/* Chat */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title flex items-center gap-2">
              <MessageCircle size={18} />
              Chat
            </h4>
          </div>
          <div className="card-content p-0">
            <div className="chat-container">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="text-center text-muted">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div className="chat-message animate-slide-in" key={i}>
                      <div className="chat-message-header">
                        <span className="chat-username">{m.user.username}</span>
                        <span className="chat-timestamp">
                          {new Date(m.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="chat-text">{m.text}</div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="chat-input-container p-4">
                <input 
                  className="chat-input form-input"
                  placeholder="Type a message..." 
                  ref={messageRef}
                  onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                />
                <button onClick={sendChat} className="btn btn-primary btn-sm">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
