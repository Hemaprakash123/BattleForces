import React, { useEffect, useState } from 'react';

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
    <div>
      {competitionStatus === 'ended' && (
        <p>
          You took: {hours}:{minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
        </p>
      )}

      {competitionStatus === 'started' && (
        <p>
          {hours}:{minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
        </p>
      )}
    </div>
  );
};

export default Clock;
