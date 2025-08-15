import React, { useEffect, useState } from 'react';
import { Clock as ClockIcon, Play, Square } from 'lucide-react';

const Clock = ({ competitionStatus }) => {
  const [time, setTime] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);

  // Start/stop based on competition status
  useEffect(() => {
    if (competitionStatus === 'started') {
      setIsRunning(true);
      setTime(0); // reset when starting
    } else if (competitionStatus === 'ended') {
      setIsRunning(false);
    }
  }, [competitionStatus]);

  // Stopwatch logic
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Convert seconds to HH:MM:SS
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return (
    <div className="text-center">
      {competitionStatus === 'ended' && (
        <div>
          <div className="clock-time text-success">
            {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="clock-label text-success">Final Time</div>
        </div>
      )}

      {competitionStatus === 'started' && (
        <div>
          <div className="clock-time animate-pulse">
            {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="clock-label flex items-center justify-center gap-1">
            <Play size={12} />
            Live
          </div>
        </div>
      )}
      
      {competitionStatus === 'waiting' && (
        <div>
          <div className="clock-time text-muted">
            --:--:--
          </div>
          <div className="clock-label">
            Waiting to Start
          </div>
        </div>
      )}
    </div>
  );
};

export default Clock;
