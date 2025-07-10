import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const DEFAULT_BREAK = 5;
const DEFAULT_SESSION = 25;
const MIN_LENGTH = 1;
const MAX_LENGTH = 60;

function padTime(time) {
  return time < 10 ? `0${time}` : time;
}

function App() {
  const [breakLength, setBreakLength] = useState(DEFAULT_BREAK);
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SESSION * 60);
  const [timerLabel, setTimerLabel] = useState('Session');
  const [running, setRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const audioRef = useRef(null);

  // Sync timeLeft with sessionLength when reset or sessionLength changes and not running
  useEffect(() => {
    if (!running && timerLabel === 'Session') {
      setTimeLeft(sessionLength * 60);
    }
  }, [sessionLength, running, timerLabel]);

  useEffect(() => {
    if (!running && timerLabel === 'Break') {
      setTimeLeft(breakLength * 60);
    }
  }, [breakLength, running, timerLabel]);

  useEffect(() => {
    if (timeLeft === 0) {
      audioRef.current.play();
      setTimeout(() => {
        if (timerLabel === 'Session') {
          setTimerLabel('Break');
          setTimeLeft(breakLength * 60);
        } else {
          setTimerLabel('Session');
          setTimeLeft(sessionLength * 60);
        }
      }, 1000);
    }
  }, [timeLeft, timerLabel, breakLength, sessionLength]);

  useEffect(() => {
    if (running) {
      if (intervalId) return;
      const id = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      setIntervalId(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line
  }, [running]);

  const handleReset = () => {
    setRunning(false);
    setBreakLength(DEFAULT_BREAK);
    setSessionLength(DEFAULT_SESSION);
    setTimerLabel('Session');
    setTimeLeft(DEFAULT_SESSION * 60);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleBreakChange = (amount) => {
    setBreakLength(prev => {
      const next = prev + amount;
      if (next < MIN_LENGTH || next > MAX_LENGTH) return prev;
      return next;
    });
  };

  const handleSessionChange = (amount) => {
    setSessionLength(prev => {
      const next = prev + amount;
      if (next < MIN_LENGTH || next > MAX_LENGTH) return prev;
      return next;
    });
  };

  const handleStartStop = () => {
    setRunning(r => !r);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="pomodoro-container">
      <h1>25 + 5 Clock</h1>
      <div className="length-controls">
        <div className="length-control">
          <div id="break-label">Break Length</div>
          <button id="break-decrement" onClick={() => handleBreakChange(-1)} disabled={running || breakLength <= MIN_LENGTH}>-</button>
          <span id="break-length">{breakLength}</span>
          <button id="break-increment" onClick={() => handleBreakChange(1)} disabled={running || breakLength >= MAX_LENGTH}>+</button>
        </div>
        <div className="length-control">
          <div id="session-label">Session Length</div>
          <button id="session-decrement" onClick={() => handleSessionChange(-1)} disabled={running || sessionLength <= MIN_LENGTH}>-</button>
          <span id="session-length">{sessionLength}</span>
          <button id="session-increment" onClick={() => handleSessionChange(1)} disabled={running || sessionLength >= MAX_LENGTH}>+</button>
        </div>
      </div>
      <div className="timer">
        <div id="timer-label">{timerLabel}</div>
        <div id="time-left">{padTime(minutes)}:{padTime(seconds)}</div>
      </div>
      <div className="timer-controls">
        <button id="start_stop" onClick={handleStartStop}>{running ? 'Pause' : 'Start'}</button>
        <button id="reset" onClick={handleReset}>Reset</button>
      </div>
      <audio
        id="beep"
        ref={audioRef}
        src="https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3"
        preload="auto"
      />
      <footer className="footer">Made with ❤️ by Maxwell</footer>
    </div>
  );
}

export default App;
