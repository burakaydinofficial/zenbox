import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Home, BarChart3, Settings, Clock, Phone, Gift, Award, Bell, MapPin, Play, Pause, Target } from 'lucide-react';
import './styles.css';

const API_URL = 'http://localhost:8182/api';

const ZenboxApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isZenMode, setIsZenMode] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(120); // minutes
  const [todayZenTime, setTodayZenTime] = useState(0); // minutes
  const [zenPoints, setZenPoints] = useState(245);
  const [todayPoints, setTodayPoints] = useState(8);
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Mon', zen: 0, target: 120 },
    { day: 'Tue', zen: 0, target: 120 },
    { day: 'Wed', zen: 0, target: 120 },
    { day: 'Thu', zen: 0, target: 120 },
    { day: 'Fri', zen: 0, target: 120 },
    { day: 'Sat', zen: 0, target: 120 },
    { day: 'Sun', zen: 0, target: 120 },
  ]);
  const [settings, setSettings] = useState({
    autoReminder: true,
    callFiltering: true,
    zenHours: '20:00-22:00',
    zenDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(API_URL + '/device/stats');
        const data = await response.json();
        setStats(data);

        // Calculate today's zen time from sessions
        const today = new Date().toDateString();
        let todayTotal = 0;
        
        data.sessions.forEach(session => {
          const sessionDate = new Date(session.start).toDateString();
          if (sessionDate === today) {
            todayTotal += session.duration;
          }
        });
        
        setTodayZenTime(Math.floor(todayTotal / 60)); // Convert to minutes

        // Process weekly data
        const weekly = [
          { day: 'Mon', zen: 0, target: 120 },
          { day: 'Tue', zen: 0, target: 120 },
          { day: 'Wed', zen: 0, target: 120 },
          { day: 'Thu', zen: 0, target: 120 },
          { day: 'Fri', zen: 0, target: 120 },
          { day: 'Sat', zen: 0, target: 120 },
          { day: 'Sun', zen: 0, target: 120 },
        ];

        // Sum up session durations by day
        data.sessions.forEach(session => {
          const sessionDate = new Date(session.start);
          const dayIndex = (sessionDate.getDay() + 6) % 7; // Convert to Mon=0, Tue=1, etc.
          weekly[dayIndex].zen += Math.floor(session.duration / 60);
        });

        setWeeklyData(weekly);

        // Check if currently in zen mode (has active session)
        const lastSession = data.sessions[data.sessions.length - 1];
        setIsZenMode(lastSession && !lastSession.end);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const toggleZenMode = async () => {
    try {
      if (isZenMode) {
        await fetch(API_URL + '/device/disconnected', { method: 'POST' });
      } else {
        await fetch(API_URL + '/device/connected', { method: 'POST' });
      }
      setIsZenMode(!isZenMode);
    } catch (error) {
      console.error('Error toggling zen mode:', error);
    }
  };

  const renderNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'stats', icon: BarChart3, label: 'Stats' },
          { id: 'sessions', icon: Clock, label: 'Sessions' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentScreen(id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              currentScreen === id ? 'text-blue-500 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderHomeScreen = () => (
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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <Clock className="text-green-500 mr-2" size={20} />
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <div className="text-xl font-bold text-blue-600 mb-1">{Math.round((todayZenTime / dailyTarget) * 100)}%</div>
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

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Daily Progress</span>
          <span className="text-sm font-medium">{Math.round((todayZenTime / dailyTarget) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((todayZenTime / dailyTarget) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Reminder Box */}
      {!isZenMode && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center">
            <MapPin className="text-purple-500 mr-3" size={20} />
            <div>
              <h3 className="font-semibold text-purple-800">Put in box reminder</h3>
              <p className="text-sm text-purple-600">It's Zen time when you get home!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsScreen = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Weekly Statistics</h2>
      
      {/* Weekly Chart */}
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
              <div className="text-xs text-gray-600 w-16">{Math.round((day.zen / day.target) * 100)}% / {day.zen}min</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Weekly Total</h3>
          <div className="text-2xl font-bold text-blue-600">
            {formatTime(weeklyData.reduce((sum, day) => sum + day.zen, 0))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Average</h3>
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(Math.round(weeklyData.reduce((sum, day) => sum + day.zen, 0) / 7))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionsScreen = () => {
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
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
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
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsScreen = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Zen Settings</h2>
      
      <div className="space-y-4">
        {/* Daily Target */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Daily Target</h3>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="30"
              max="480"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-20">{formatTime(dailyTarget)}</span>
          </div>
        </div>

        {/* Settings Toggles */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="text-blue-500 mr-2" size={20} />
                <span className="text-gray-700">Auto Reminder</span>
              </div>
              <button
                onClick={() => setSettings(prev => ({...prev, autoReminder: !prev.autoReminder}))}
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.autoReminder ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-all ${
                  settings.autoReminder ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="text-green-500 mr-2" size={20} />
                <span className="text-gray-700">Call Filtering</span>
              </div>
              <button
                onClick={() => setSettings(prev => ({...prev, callFiltering: !prev.callFiltering}))}
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.callFiltering ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-all ${
                  settings.callFiltering ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Zen Hours and Days */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Zen Hours</h3>
          <input
            type="text"
            value={settings.zenHours}
            onChange={(e) => setSettings(prev => ({...prev, zenHours: e.target.value}))}
            className="w-full p-2 border border-gray-300 rounded-lg mb-3"
            placeholder="20:00-22:00"
          />
          
          <h3 className="font-semibold text-gray-800 mb-3">Zen Days</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <button
                key={day}
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    zenDays: prev.zenDays.includes(day) 
                      ? prev.zenDays.filter(d => d !== day)
                      : [...prev.zenDays, day]
                  }));
                }}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  settings.zenDays.includes(day)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-600 border-gray-300'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Donation Option */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
          <div className="flex items-center mb-3">
            <Gift className="text-pink-500 mr-2" size={20} />
            <h3 className="font-semibold text-pink-800">Zen Donation</h3>
          </div>
          <p className="text-sm text-pink-700 mb-3">
            Gift your Zen points to others
          </p>
          <button className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors">
            Donate
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return renderHomeScreen();
      case 'stats':
        return renderStatsScreen();
      case 'sessions':
        return renderSessionsScreen();
      case 'settings':
        return renderSettingsScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Main Content */}
        <div className="p-6 pb-20">
          {renderCurrentScreen()}
        </div>
        
        {/* Navigation */}
        {renderNavigation()}
      </div>
    </div>
  );
};

ReactDOM.render(<ZenboxApp />, document.getElementById('root'));
