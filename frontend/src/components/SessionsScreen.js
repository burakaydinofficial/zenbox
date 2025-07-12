import React from 'react';
import { useStats, useTimeFormat } from '../hooks/useZenboxData';

const SessionsScreen = () => {
  const { stats } = useStats();
  const { formatDate } = useTimeFormat();

  if (!stats || !stats.sessions.length) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Zen Sessions</h2>
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <p className="text-gray-500">No zen sessions yet. Start your first session!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Zen Sessions</h2>
      
      <div className="space-y-3">
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
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">
            {new Date(session.start).toLocaleDateString()}
          </span>
          {index < 3 && <span className="text-yellow-500">⭐</span>}
        </div>
        <div className="text-lg font-semibold text-gray-800">
          {Math.floor(session.duration / 60)} minutes
        </div>
        <div className="text-sm text-purple-600">
          +{Math.floor(session.duration / 60 / 10)} points
        </div>
      </div>
      <button className="p-2 rounded-full hover:bg-gray-100">
        {index < 3 ? '⭐' : '☆'}
      </button>
    </div>
  </div>
);

export default SessionsScreen;
