import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

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

  if (!lastSession) return <p>No sessions recorded</p>;
  
  if (!lastSession.end) {
    return (
      <div>
        <h3>Connected</h3>
        <p>{Math.floor(elapsedTime / 3600)}h {Math.floor((elapsedTime % 3600) / 60)}m {elapsedTime % 60}s</p>
      </div>
    );
  }
  return <h3>Disconnected</h3>;
}

function DailySummary({ todayTotal }) {
  const hours = Math.floor(todayTotal / 3600);
  const minutes = Math.floor((todayTotal % 3600) / 60);
  
  return (
    <div>
      <h3>Today's Total</h3>
      <p>{hours}h {minutes}m</p>
    </div>
  );
}

function WeeklyChart({ weeklyData }) {
  const maxTime = Math.max(...Object.values(weeklyData));
  
  return (
    <div>
      <h3>Last 7 Days</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '10px' }}>
        {Object.entries(weeklyData).map(([date, seconds]) => (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                background: '#009999',
                height: `${(seconds / maxTime) * 100}%`,
                minHeight: '1px',
                borderRadius: '4px 4px 0 0'
              }}
            />
            <small style={{ fontSize: '10px', marginTop: '4px' }}>{date}</small>
            <small style={{ fontSize: '10px' }}>{Math.floor(seconds / 3600)}h</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsList({ sessions }) {
  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      <h3>Recent Sessions</h3>
      {sessions.map((session, index) => {
        const start = new Date(session.start);
        const end = session.end ? new Date(session.end) : 'Ongoing';
        const duration = Math.floor(session.duration / 60);
        
        return (
          <div key={index} style={{ marginBottom: '10px', fontSize: '14px' }}>
            <div>Start: {start.toLocaleString()}</div>
            <div>End: {end === 'Ongoing' ? end : end.toLocaleString()}</div>
            <div>Duration: {duration} minutes</div>
            <hr style={{ margin: '5px 0', opacity: 0.2 }} />
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState({});

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
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>Loading...</div>;

  const todayTotal = Object.values(weeklyData)[6] || 0; // Today is the last entry

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Zenbox Device Monitor</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
        <div className="block" style={{ padding: '20px', borderRadius: '12px', background: '#e76f00', color: 'white' }}>
          <CurrentStatus lastSession={stats.sessions[stats.sessions.length - 1]} />
        </div>
        <div className="block" style={{ padding: '20px', borderRadius: '12px', background: '#009999', color: 'white' }}>
          <DailySummary todayTotal={todayTotal} />
        </div>
        <div className="block" style={{ padding: '20px', borderRadius: '12px', background: '#9933cc', color: 'white' }}>
          <WeeklyChart weeklyData={weeklyData} />
        </div>
        <div className="block" style={{ padding: '20px', borderRadius: '12px', background: '#cc0033', color: 'white' }}>
          <SessionsList sessions={stats.sessions.slice(-5).reverse()} />
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
