import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const DEFAULT_BREAK = 5;
const DEFAULT_SESSION = 25;
const MIN_LENGTH = 1;
const MAX_LENGTH = 60;

function padTime(time) {
  return time < 10 ? `0${time}` : time;
}

function playClick() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
}

function playEndSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Three descending tones
  [[880, 0], [660, 0.3], [440, 0.6]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.8);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.8);
  });
}

function playBell() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.5);
}

function playTick() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

function App() {
  const [breakLength, setBreakLength] = useState(DEFAULT_BREAK);
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SESSION * 60);
  const [timerLabel, setTimerLabel] = useState('Session');
  const [running, setRunning] = useState(false);

  const intervalRef = useRef(null);
  const didFireRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 0) {
          playTick();
          return prev - 1;
        }
        return 0;
      });
    }, 1000);
  }, []);

  // Start/stop interval based on running state
  useEffect(() => {
    if (running) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, startTimer, clearTimer]);

  // Sync timeLeft when session length changes while paused
  useEffect(() => {
    if (!running && timerLabel === 'Session') {
      setTimeLeft(sessionLength * 60);
    }
  }, [sessionLength, running, timerLabel]);

  // Sync timeLeft when break length changes while paused
  useEffect(() => {
    if (!running && timerLabel === 'Break') {
      setTimeLeft(breakLength * 60);
    }
  }, [breakLength, running, timerLabel]);

  // Handle timer reaching zero — guarded against double-fire
  useEffect(() => {
    if (timeLeft === 0 && !didFireRef.current) {
      didFireRef.current = true;
      playEndSound();
      setTimeout(() => {
        setTimerLabel(prev => {
          const next = prev === 'Session' ? 'Break' : 'Session';
          setTimeLeft(next === 'Break' ? breakLength * 60 : sessionLength * 60);
          return next;
        });
        didFireRef.current = false;
      }, 1000);
    } else if (timeLeft > 0) {
      didFireRef.current = false;
    }
  }, [timeLeft, breakLength, sessionLength]);

  const handleReset = () => {
    setRunning(false);
    clearTimer();
    setBreakLength(DEFAULT_BREAK);
    setSessionLength(DEFAULT_SESSION);
    setTimerLabel('Session');
    setTimeLeft(DEFAULT_SESSION * 60);
    didFireRef.current = false;
  };

  const handleBreakChange = (amount) => {
    if (running) return;
    setBreakLength(prev => {
      const next = prev + amount;
      return next < MIN_LENGTH || next > MAX_LENGTH ? prev : next;
    });
  };

  const handleSessionChange = (amount) => {
    if (running) return;
    setSessionLength(prev => {
      const next = prev + amount;
      return next < MIN_LENGTH || next > MAX_LENGTH ? prev : next;
    });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const RADIUS = 108;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const totalSeconds = (timerLabel === 'Session' ? sessionLength : breakLength) * 60;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`pomodoro-container${timerLabel === 'Break' ? ' break-mode' : ''}`}>
      <p className="app-title">Focus Timer</p>

      <div className="length-controls">
        <div className="length-control">
          <span className="length-label" id="break-label">Break</span>
          <div className="length-row">
            <button className="length-btn" id="break-decrement" onClick={() => { playClick(); handleBreakChange(-1); }} disabled={running || breakLength <= MIN_LENGTH}>−</button>
            <span className="length-value" id="break-length">{breakLength}</span>
            <button className="length-btn" id="break-increment" onClick={() => { playClick(); handleBreakChange(1); }} disabled={running || breakLength >= MAX_LENGTH}>+</button>
          </div>
        </div>
        <div className="length-control">
          <span className="length-label" id="session-label">Session</span>
          <div className="length-row">
            <button className="length-btn" id="session-decrement" onClick={() => { playClick(); handleSessionChange(-1); }} disabled={running || sessionLength <= MIN_LENGTH}>−</button>
            <span className="length-value" id="session-length">{sessionLength}</span>
            <button className="length-btn" id="session-increment" onClick={() => { playClick(); handleSessionChange(1); }} disabled={running || sessionLength >= MAX_LENGTH}>+</button>
          </div>
        </div>
      </div>

      <div className="timer-wrapper">
        <svg className="progress-ring" viewBox="0 0 280 280">
          <circle className="progress-ring__deco" cx="140" cy="140" r="136" />
          <circle className="progress-ring__track" cx="140" cy="140" r={RADIUS} />
          <circle
            className="progress-ring__bar"
            cx="140" cy="140" r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="timer-glass">
          <span className="mode-badge">{timerLabel === 'Session' ? '● Focus' : '● Break'}</span>
          <div id="timer-label" style={{display:'none'}}>{timerLabel}</div>
          <div id="time-left">{padTime(minutes)}:{padTime(seconds)}</div>
          <span className="timer-sub">{running ? 'in progress' : timeLeft === totalSeconds ? 'ready' : 'paused'}</span>
        </div>
      </div>

      <div className="timer-controls">
        <button
          id="start_stop"
          className="btn-start"
          onClick={() => setRunning(r => { playClick(); if (!r) playBell(); return !r; })}
        >
          {running ? '⏸  Pause' : '▶  Start'}
        </button>
        <button className="btn-icon" id="reset" onClick={() => { playClick(); handleReset(); }} title="Reset">↺</button>
      </div>

      <footer className="footer">Made with ❤️ by Maxwell</footer>
    </div>
  );
}

export default App;
