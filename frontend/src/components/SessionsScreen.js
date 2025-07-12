import React from 'react';
import { useStats, useTimeFormat } from '../hooks/useZenboxData';

const SessionsScreen = () => {
  const { stats } = useStats();
  const { formatDate } = useTimeFormat();

  if (!stats || !stats.sessions.length) {
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
        {stats.sessions.slice(-10).reverse().map((session, index) => (
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

const SessionCard = ({ session, index, formatDate }) => (
  <div className="session-card">
    <div className="session-content">
      <div className="session-info">
        <div className="session-date-row">
          <span className="session-date">
            {new Date(session.start).toLocaleDateString()}
          </span>
          {index < 3 && <span className="session-star">⭐</span>}
        </div>
        <div className="session-duration">
          {Math.floor(session.duration / 60)} minutes
        </div>
        <div className="session-points">
          +{Math.floor(session.duration / 60 / 10)} points
        </div>
      </div>
      <button className="session-favorite-btn">
        {index < 3 ? '⭐' : '☆'}
      </button>
    </div>
  </div>
);

export default SessionsScreen;
