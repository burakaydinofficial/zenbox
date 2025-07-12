import React from 'react';
import { Target } from 'lucide-react';
import { useStats, useTimeFormat, useProgress } from '../hooks/useZenboxData';

const StatsScreen = () => {
  const { weeklyData } = useStats();
  const { formatTime } = useTimeFormat();
  const { getWeeklyTotal, getWeeklyAverage } = useProgress();

  return (
    <div className="stats-screen">
      <h2 className="stats-title">Weekly Statistics</h2>
      
      {/* Weekly Chart */}
      <WeeklyChart weeklyData={weeklyData} />

      {/* Weekly Summary */}
      <WeeklySummary 
        weeklyTotal={getWeeklyTotal()}
        weeklyAverage={getWeeklyAverage()}
        formatTime={formatTime}
      />
    </div>
  );
};

const WeeklyChart = ({ weeklyData }) => (
  <div className="weekly-chart">
    <div className="chart-header">
      <h3 className="chart-title">Zen Times</h3>
      <Target className="text-blue-500" size={20} />
    </div>
    <div className="chart-rows">
      {weeklyData.map((day, index) => (
        <div key={index} className="chart-row">
          <div className="chart-day">{day.day}</div>
          <div className="chart-bar-container">
            <div className="chart-bar">
              <div 
                className="chart-bar-fill"
                style={{ width: `${Math.min((day.zen / day.target) * 100, 100)}%` }}
              ></div>
              <div className="chart-target-line"></div>
            </div>
          </div>
          <div className="chart-values">
            {Math.round((day.zen / day.target) * 100)}% / {day.zen}min
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WeeklySummary = ({ weeklyTotal, weeklyAverage, formatTime }) => (
  <div className="weekly-summary">
    <div className="summary-card">
      <h3 className="summary-title">Weekly Total</h3>
      <div className="summary-value total">
        {formatTime(weeklyTotal)}
      </div>
    </div>
    <div className="summary-card">
      <h3 className="summary-title">Average</h3>
      <div className="summary-value average">
        {formatTime(weeklyAverage)}
      </div>
    </div>
  </div>
);

export default StatsScreen;
