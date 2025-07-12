import React from 'react';
import { Clock, Award, MapPin, Play, Pause } from 'lucide-react';
import { useZenMode, useStats, useSettings, useTimeFormat, useProgress } from '../hooks/useZenboxData';

const HomeScreen = () => {
  const { isZenMode, toggleZenMode } = useZenMode();
  const { zenPoints, todayPoints } = useStats();
  const { dailyTarget } = useSettings();
  const { formatTime } = useTimeFormat();
  const { getDailyProgress, getDailyProgressWidth } = useProgress();

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-title">Zenbox</h1>
        <p className="app-subtitle">Your digital detox companion</p>
      </div>

      {/* Zen Status */}
      <div className="zen-status">
        <div className={`zen-indicator ${isZenMode ? 'active' : ''}`}>
          <div className={`zen-indicator-inner ${isZenMode ? 'active' : ''}`}>
            <div className={`zen-indicator-core ${isZenMode ? 'active' : ''}`}></div>
          </div>
        </div>
        <h2 className={`zen-status-title ${isZenMode ? 'active' : ''}`}>
          {isZenMode ? 'In Zen Mode' : 'Out of Box'}
        </h2>
        <button
          onClick={toggleZenMode}
          className={`zen-toggle-button ${isZenMode ? 'active' : ''}`}
        >
          {isZenMode ? (
            <>
              <Pause className="zen-toggle-icon" size={16} />
              End Zen
            </>
          ) : (
            <>
              <Play className="zen-toggle-icon" size={16} />
              Start Zen
            </>
          )}
        </button>
      </div>

      {/* Daily Stats */}
      <DailyStats 
        dailyProgress={getDailyProgress()}
        dailyTarget={dailyTarget}
        zenPoints={zenPoints}
        todayPoints={todayPoints}
        formatTime={formatTime}
      />

      {/* Progress Bar */}
      <ProgressBar 
        progress={getDailyProgress()}
        progressWidth={getDailyProgressWidth()}
      />

      {/* Reminder Box */}
      {!isZenMode && <ReminderBox />}
    </div>
  );
};

const DailyStats = ({ dailyProgress, dailyTarget, zenPoints, todayPoints, formatTime }) => {
  const { todayZenTime } = useStats();

  return (
    <div className="daily-stats">
      <div className="stat-card">
        <div className="stat-header">
          <Clock className="stat-icon text-green-500" size={20} />
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-percentage">{dailyProgress}%</div>
        <div className="stat-value">{formatTime(todayZenTime)}</div>
        <div className="stat-target">Target: {formatTime(dailyTarget)}</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-header">
          <Award className="stat-icon text-purple-500" size={20} />
          <span className="stat-label">Zen Points</span>
        </div>
        <div className="stat-points">{zenPoints}</div>
        <div className="stat-points-today">+{todayPoints} today</div>
      </div>
    </div>
  );
};

const ProgressBar = ({ progress, progressWidth }) => (
  <div className="progress-section">
    <div className="progress-header">
      <span className="progress-label">Daily Progress</span>
      <span className="progress-percentage">{progress}%</span>
    </div>
    <div className="progress-bar">
      <div 
        className="progress-fill"
        style={{ width: `${progressWidth}%` }}
      ></div>
    </div>
  </div>
);

const ReminderBox = () => (
  <div className="reminder-box">
    <MapPin className="reminder-icon" size={20} />
    <div>
      <h3 className="reminder-title">Put in box reminder</h3>
      <p className="reminder-text">It's Zen time when you get home!</p>
    </div>
  </div>
);

export default HomeScreen;
