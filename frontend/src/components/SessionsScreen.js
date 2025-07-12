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

  const points = Math.floor(session.duration); // 1 point per second
  
  const startDate = new Date(session.start);
  const endDate = new Date(session.end);
  
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes} minutes`;
    } else {
      // return `${secs}s`;
      return `${secs} seconds`;
    }
  };
  
  const formatTimeRange = () => {
    const formatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const startTime = startDate.toLocaleString('en-US', formatOptions);
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startTime} - ${endTime}`;
  };
  
  return (
    <div className="session-card">
      <div className="session-content">
        <div className="session-info">
          <div className="session-block">
            <div className="session-duration">
              {formatDuration(session.duration)}
            </div>
            <div className="session-points">
              +{points} points
            </div>
          </div>
          <div className="session-block">
            <div className="session-time-range">
              {formatTimeRange()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsScreen;
