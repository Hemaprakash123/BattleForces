import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, Trophy, Clock, Shield, Target } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const me = JSON.parse(localStorage.getItem('me') || 'null');

  function handleCreateRoom() {
    if (!me) {
      navigate('/login');
      return;
    }
    navigate('/create-room');
  }

  function handleJoinRoom() {
    if (!me) {
      navigate('/login');
      return;
    }
    navigate('/join-room');
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title animate-fade-in">
            CF Duel Arena
          </h1>
          <p className="hero-subtitle animate-fade-in">
            Challenge your friends to competitive programming duels on Codeforces. 
            Create rooms, solve problems, and prove who's the fastest coder!
          </p>
          <div className="hero-actions animate-fade-in">
            <button onClick={handleCreateRoom} className="hero-btn">
              <Zap size={20} />
              Create Room
            </button>
            <button onClick={handleJoinRoom} className="hero-btn secondary">
              <Users size={20} />
              Join Room
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container">
        <div className="features">
          <div className="feature-card animate-fade-in">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Real-time Competition</h3>
            <p className="feature-description">
              Compete in real-time with automatic problem verification through Codeforces API integration.
            </p>
          </div>

          <div className="feature-card animate-fade-in">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Custom Difficulty</h3>
            <p className="feature-description">
              Choose problem difficulty ranges from Easy (800-1200) to Expert (2100-2500) or mix them up.
            </p>
          </div>

          <div className="feature-card animate-fade-in">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Head-to-Head Duels</h3>
            <p className="feature-description">
              Challenge friends in private rooms with customizable number of problems and difficulty settings.
            </p>
          </div>

          <div className="feature-card animate-fade-in">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Live Tracking</h3>
            <p className="feature-description">
              Track progress with live scoreboards, chat functionality, and automatic submission verification.
            </p>
          </div>

          <div className="feature-card animate-fade-in">
            <div className="feature-icon">🏆</div>
            <h3 className="feature-title">Rating System</h3>
            <p className="feature-description">
              Build your reputation with match history tracking and integrated Codeforces rating display.
            </p>
          </div>

          <div className="feature-card animate-fade-in">
            <div className="feature-icon">⏱️</div>
            <h3 className="feature-title">Time Tracking</h3>
            <p className="feature-description">
              Built-in stopwatch to track your solving time and compare performance with opponents.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="card-title">How It Works</h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Link Your Codeforces Account</h4>
                  <p className="text-secondary">Connect your CF handle to enable automatic submission verification and rating display.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Create or Join a Room</h4>
                  <p className="text-secondary">Set up a custom room with your preferred settings or join using a 6-digit passcode.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Compete and Win</h4>
                  <p className="text-secondary">Solve problems as fast as you can. First to submit a correct solution wins the round!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!me && (
          <div className="text-center mt-8">
            <div className="card">
              <div className="card-content">
                <h3 className="mb-4">Ready to Start Dueling?</h3>
                <p className="text-secondary mb-6">
                  Join thousands of competitive programmers already using CF Duel Arena to improve their skills.
                </p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => navigate('/register')} 
                    className="btn btn-primary btn-lg"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="btn btn-secondary btn-lg"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}