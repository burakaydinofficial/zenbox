import React from 'react';
import { Target } from 'lucide-react';
import { useStats, useTimeFormat, useProgress } from '../hooks/useZenboxData';

const StatsScreen = () => {
  const { weeklyData } = useStats();
  const { formatTime } = useTimeFormat();
  const { getWeeklyTotal, getWeeklyAverage } = useProgress();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Weekly Statistics</h2>
      
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
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-800">Zen Times</h3>
      <Target className="text-blue-500" size={20} />
    </div>
    <div className="space-y-3">
      {weeklyData.map((day, index) => (
        <div key={index} className="flex items-center">
          <div className="w-8 text-xs text-gray-600">{day.day}</div>
          <div className="flex-1 mx-3">
            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((day.zen / day.target) * 100, 100)}%` }}
              ></div>
              <div className="absolute top-0 right-0 w-0.5 h-full bg-red-400 opacity-50"></div>
            </div>
          </div>
          <div className="text-xs text-gray-600 w-16">
            {Math.round((day.zen / day.target) * 100)}% / {day.zen}min
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WeeklySummary = ({ weeklyTotal, weeklyAverage, formatTime }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-2">Weekly Total</h3>
      <div className="text-2xl font-bold text-blue-600">
        {formatTime(weeklyTotal)}
      </div>
    </div>
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-2">Average</h3>
      <div className="text-2xl font-bold text-purple-600">
        {formatTime(weeklyAverage)}
      </div>
    </div>
  </div>
);

export default StatsScreen;
