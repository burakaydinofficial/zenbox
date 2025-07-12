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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Zenbox</h1>
        <p className="text-gray-600">Your digital detox companion</p>
      </div>

      {/* Zen Status */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
        <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
          isZenMode ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'
        }`}>
          <div className={`w-16 h-16 rounded-full ${
            isZenMode ? 'bg-blue-500 animate-bounce' : 'bg-gray-400'
          } flex items-center justify-center`}>
            <div className={`w-8 h-8 rounded-full ${
              isZenMode ? 'bg-white' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
        <h2 className={`text-xl font-semibold mb-2 ${
          isZenMode ? 'text-blue-600' : 'text-gray-600'
        }`}>
          {isZenMode ? 'In Zen Mode' : 'Out of Box'}
        </h2>
        <button
          onClick={toggleZenMode}
          className={`px-6 py-3 rounded-full font-medium transition-all ${
            isZenMode 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isZenMode ? (
            <>
              <Pause className="inline mr-2" size={16} />
              End Zen
            </>
          ) : (
            <>
              <Play className="inline mr-2" size={16} />
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
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center mb-2">
          <Clock className="text-green-500 mr-2" size={20} />
          <span className="text-sm text-gray-600">Today</span>
        </div>
        <div className="text-xl font-bold text-blue-600 mb-1">{dailyProgress}%</div>
        <div className="text-lg font-semibold text-gray-800">{formatTime(todayZenTime)}</div>
        <div className="text-xs text-gray-500">Target: {formatTime(dailyTarget)}</div>
      </div>
      
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center mb-2">
          <Award className="text-purple-500 mr-2" size={20} />
          <span className="text-sm text-gray-600">Zen Points</span>
        </div>
        <div className="text-2xl font-bold text-gray-800">{zenPoints}</div>
        <div className="text-xs text-green-500">+{todayPoints} today</div>
      </div>
    </div>
  );
};

const ProgressBar = ({ progress, progressWidth }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-600">Daily Progress</span>
      <span className="text-sm font-medium">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div 
        className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500"
        style={{ width: `${progressWidth}%` }}
      ></div>
    </div>
  </div>
);

const ReminderBox = () => (
  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
    <div className="flex items-center">
      <MapPin className="text-purple-500 mr-3" size={20} />
      <div>
        <h3 className="font-semibold text-purple-800">Put in box reminder</h3>
        <p className="text-sm text-purple-600">It's Zen time when you get home!</p>
      </div>
    </div>
  </div>
);

export default HomeScreen;
