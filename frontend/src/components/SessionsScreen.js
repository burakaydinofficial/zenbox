import React from 'react';
import { useStats, useTimeFormat } from '../hooks/useZenboxData';

const SessionsScreen = () => {
  const { stats } = useStats();
  const { formatDate } = useTimeFormat();

  if (!stats || !Array.isArray(stats) || stats.length === 0) {
    return (
      <div className="sessions-screen">
        <h2 className="sessions-title">Zen Sessions</h2>
        <div className="empty-sessions">
          <p className="empty-sessions-text">No zen sessions yet. Start your first session!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-screen">
      <h2 className="sessions-title">Zen Sessions</h2>
      
      <div className="sessions-list">
        {stats.slice(-10).reverse().map((session, index) => (
          <SessionCard 
            key={index}
            session={session}
            index={index}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
};

const SessionCard = ({ session, index, formatDate }) => {
  // Handle missing session data
  if (!session || !session.start || !session.duration) {
    return null;
  }

  const durationMinutes = Math.floor(session.duration / 60);
  const points = Math.floor(session.duration); // 1 point per second
  
  return (
    <div className="session-card">
      <div className="session-content">
        <div className="session-info">
          <div className="session-block">
            <div className="session-duration">
              {durationMinutes} minutes
            </div>
            <div className="session-points">
              +{points} points
            </div>
          </div>
          <div className="session-block">
            <div className="session-date-row">
              <span className="session-date">
                {new Date(session.start).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsScreen;
