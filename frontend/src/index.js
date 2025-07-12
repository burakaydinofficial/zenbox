import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Home, BarChart3, Settings, Clock, Phone, Gift, Award, Bell, MapPin, Play, Pause, Target } from 'lucide-react';
import './styles.css';

const API_URL = 'http://localhost:8182/api';

function CurrentStatus({ lastSession }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!lastSession?.end) {
      const timer = setInterval(() => {
        const start = new Date(lastSession?.start);
        const now = new Date();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lastSession]);

  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="text-center">
      <div className={`status-circle ${!lastSession?.end ? 'active' : ''}`}>
        <div className="inner-circle">
          <div className="core"></div>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">
        {!lastSession?.end ? 'Connected' : 'Disconnected'}
      </h2>
      {!lastSession?.end && (
        <p className="text-lg">{formatElapsedTime()}</p>
      )}
    </div>
  );
}

function DailySummary({ todayTotal }) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const dailyTarget = 28800; // 8 hours in seconds
  const progress = Math.min((todayTotal / dailyTarget) * 100, 100);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Today's Stats</h3>
      <div className="progress-stats">
        <div className="stat-value">{formatTime(todayTotal)}</div>
        <div className="stat-label">Total Time</div>
        <div className="progress-bar mt-3">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-sm mt-2">Target: {formatTime(dailyTarget)}</div>
      </div>
    </div>
  );
}

function WeeklyChart({ weeklyData }) {
  const maxTime = Math.max(...Object.values(weeklyData));
  
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Weekly Activity</h3>
      <div className="weekly-chart">
        {Object.entries(weeklyData).map(([date, seconds]) => (
          <div key={date} className="chart-column">
            <div className="chart-bar-container">
              <div
                className="chart-bar"
                style={{ height: `${(seconds / maxTime) * 100}%` }}
              ></div>
            </div>
            <div className="chart-label">{date}</div>
            <div className="chart-value">{Math.floor(seconds / 3600)}h</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsList({ sessions }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Recent Sessions</h3>
      <div className="sessions-list">
        {sessions.map((session, index) => (
          <div key={index} className="session-card">
            <div className="session-header">
              <div className="session-time">
                <div>Started: {formatDate(session.start)}</div>
                <div>{session.end ? `Ended: ${formatDate(session.end)}` : 'Ongoing'}</div>
              </div>
              <div className={`session-status ${!session.end ? 'active' : ''}`}>
                {session.end ? 'Completed' : 'Active'}
              </div>
            </div>
            <div className="session-duration">
              Duration: {Math.floor(session.duration / 60)} minutes
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState({});
  const [currentScreen, setCurrentScreen] = useState('home');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(API_URL + '/device/stats');
        const data = await response.json();
        setStats(data);

        // Process weekly data
        const weekly = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
          weekly[dateStr] = 0;
        }

        // Sum up session durations by day
        data.sessions.forEach(session => {
          const sessionDate = new Date(session.start);
          const dateStr = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
          if (weekly.hasOwnProperty(dateStr)) {
            weekly[dateStr] += session.duration;
          }
        });

        setWeeklyData(weekly);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
    </div>
  );

  const todayTotal = Object.values(weeklyData)[6] || 0;

  return (
    <div className="app-container">
      <div className="app-content">
        <header className="app-header">
          <h1 className="app-title">Zenbox</h1>
          <nav className="app-nav">
            {['home', 'stats', 'sessions'].map((screen) => (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen)}
                className={`nav-button ${currentScreen === screen ? 'active' : ''}`}
              >
                {screen.charAt(0).toUpperCase() + screen.slice(1)}
              </button>
            ))}
          </nav>
        </header>

        <main className="main-content">
          {currentScreen === 'home' ? (
            <div className="grid-layout">
              <div className="status-block">
                <CurrentStatus lastSession={stats.sessions[stats.sessions.length - 1]} />
              </div>
              <div className="summary-block">
                <DailySummary todayTotal={todayTotal} />
              </div>
            </div>
          ) : currentScreen === 'stats' ? (
            <div className="stats-container">
              <WeeklyChart weeklyData={weeklyData} />
            </div>
          ) : (
            <div className="sessions-container">
              <SessionsList sessions={stats.sessions.slice(-10).reverse()} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
