import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './styles.css';

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
      <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
        !lastSession?.end ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'
      }`}>
        <div className={`w-16 h-16 rounded-full ${
          !lastSession?.end ? 'bg-blue-500 animate-bounce' : 'bg-gray-400'
        } flex items-center justify-center`}>
          <div className={`w-8 h-8 rounded-full ${
            !lastSession?.end ? 'bg-white' : 'bg-gray-200'
          }`}></div>
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

  // Assume 8 hours (28800 seconds) as daily target
  const dailyTarget = 28800;
  const progress = Math.min((todayTotal / dailyTarget) * 100, 100);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Today's Progress</h3>
      <div className="mb-2">{formatTime(todayTotal)}</div>
      <div className="progress-bar">
        <div 
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-sm mt-1">Target: {formatTime(dailyTarget)}</div>
    </div>
  );
}

function WeeklyChart({ weeklyData }) {
  const maxTime = Math.max(...Object.values(weeklyData));
  
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Weekly Activity</h3>
      <div className="flex items-end space-x-2 h-[150px]">
        {Object.entries(weeklyData).map(([date, seconds]) => (
          <div key={date} className="flex-1 flex flex-col items-center">
            <div className="w-full relative flex-1">
              <div
                className="chart-bar absolute bottom-0 w-full"
                style={{ height: `${(seconds / maxTime) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs mt-2">{date}</div>
            <div className="text-xs">{Math.floor(seconds / 3600)}h</div>
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
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {sessions.map((session, index) => (
          <div key={index} className="session-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-600">
                  Started: {formatDate(session.start)}
                </div>
                <div className="text-sm text-gray-600">
                  {session.end ? `Ended: ${formatDate(session.end)}` : 'Ongoing'}
                </div>
                <div className="text-sm font-medium mt-1">
                  Duration: {Math.floor(session.duration / 60)} minutes
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                session.end ? 'bg-gray-100' : 'bg-blue-100 text-blue-800'
              }`}>
                {session.end ? 'Completed' : 'Active'}
              </div>
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
        const response = await fetch('/api/device/stats');
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );

  const todayTotal = Object.values(weeklyData)[6] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zenbox</h1>
          <div className="flex justify-center space-x-4">
            {['home', 'stats', 'sessions'].map((screen) => (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen)}
                className={`nav-button ${currentScreen === screen ? 'active' : ''}`}
              >
                {screen.charAt(0).toUpperCase() + screen.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {currentScreen === 'home' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="block bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
              <CurrentStatus lastSession={stats.sessions[stats.sessions.length - 1]} />
            </div>
            <div className="block bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
              <DailySummary todayTotal={todayTotal} />
            </div>
          </div>
        )}

        {currentScreen === 'stats' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <WeeklyChart weeklyData={weeklyData} />
          </div>
        )}

        {currentScreen === 'sessions' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <SessionsList sessions={stats.sessions.slice(-10).reverse()} />
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
