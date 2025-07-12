import React, { createContext, useContext, useReducer, useEffect } from 'react';

const API_URL = 'http://localhost:8182/api';

// Initial state
const initialState = {
  // UI State
  currentScreen: 'home',
  isLoading: false,
  error: null,
  
  // Zen Mode State
  isZenMode: false,
  
  // Settings
  dailyTarget: 120, // minutes
  settings: {
    autoReminder: true,
    callFiltering: true,
    zenHours: '20:00-22:00',
    zenDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  
  // Data
  stats: null,
  todayZenTime: 0, // minutes
  zenPoints: 245,
  todayPoints: 8,
  weeklyData: [
    { day: 'Mon', zen: 0, target: 120 },
    { day: 'Tue', zen: 0, target: 120 },
    { day: 'Wed', zen: 0, target: 120 },
    { day: 'Thu', zen: 0, target: 120 },
    { day: 'Fri', zen: 0, target: 120 },
    { day: 'Sat', zen: 0, target: 120 },
    { day: 'Sun', zen: 0, target: 120 },
  ]
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  SET_ZEN_MODE: 'SET_ZEN_MODE',
  SET_DAILY_TARGET: 'SET_DAILY_TARGET',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_STATS: 'SET_STATS',
  SET_TODAY_ZEN_TIME: 'SET_TODAY_ZEN_TIME',
  SET_WEEKLY_DATA: 'SET_WEEKLY_DATA',
  UPDATE_ZEN_POINTS: 'UPDATE_ZEN_POINTS'
};

// Reducer
const zenboxReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case actionTypes.SET_CURRENT_SCREEN:
      return { ...state, currentScreen: action.payload };
    
    case actionTypes.SET_ZEN_MODE:
      return { ...state, isZenMode: action.payload };
    
    case actionTypes.SET_DAILY_TARGET:
      return { ...state, dailyTarget: action.payload };
    
    case actionTypes.UPDATE_SETTINGS:
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload } 
      };
    
    case actionTypes.SET_STATS:
      return { ...state, stats: action.payload };
    
    case actionTypes.SET_TODAY_ZEN_TIME:
      return { ...state, todayZenTime: action.payload };
    
    case actionTypes.SET_WEEKLY_DATA:
      return { ...state, weeklyData: action.payload };
    
    case actionTypes.UPDATE_ZEN_POINTS:
      return { 
        ...state, 
        zenPoints: action.payload.total,
        todayPoints: action.payload.today 
      };
    
    default:
      return state;
  }
};

// Context
const ZenboxContext = createContext();

// Provider component
export const ZenboxProvider = ({ children }) => {
  const [state, dispatch] = useReducer(zenboxReducer, initialState);

  // API Functions
  const fetchStats = async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await fetch(`${API_URL}/device/stats`);
      const data = await response.json();
      
      dispatch({ type: actionTypes.SET_STATS, payload: data });
      
      // Calculate today's zen time from sessions
      const today = new Date().toDateString();
      let todayTotal = 0;
      
      data.sessions.forEach(session => {
        const sessionDate = new Date(session.start).toDateString();
        if (sessionDate === today) {
          todayTotal += session.duration;
        }
      });
      
      dispatch({ 
        type: actionTypes.SET_TODAY_ZEN_TIME, 
        payload: Math.floor(todayTotal / 60) 
      });

      // Process weekly data
      const weekly = [
        { day: 'Mon', zen: 0, target: state.dailyTarget },
        { day: 'Tue', zen: 0, target: state.dailyTarget },
        { day: 'Wed', zen: 0, target: state.dailyTarget },
        { day: 'Thu', zen: 0, target: state.dailyTarget },
        { day: 'Fri', zen: 0, target: state.dailyTarget },
        { day: 'Sat', zen: 0, target: state.dailyTarget },
        { day: 'Sun', zen: 0, target: state.dailyTarget },
      ];

      // Sum up session durations by day
      data.sessions.forEach(session => {
        const sessionDate = new Date(session.start);
        const dayIndex = (sessionDate.getDay() + 6) % 7; // Convert to Mon=0, Tue=1, etc.
        weekly[dayIndex].zen += Math.floor(session.duration / 60);
      });

      dispatch({ type: actionTypes.SET_WEEKLY_DATA, payload: weekly });

      // Check if currently in zen mode (has active session)
      const lastSession = data.sessions[data.sessions.length - 1];
      dispatch({ 
        type: actionTypes.SET_ZEN_MODE, 
        payload: lastSession && !lastSession.end 
      });

      dispatch({ type: actionTypes.SET_ERROR, payload: null });
    } catch (error) {
      console.error('Error fetching stats:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const toggleZenMode = async () => {
    try {
      const endpoint = state.isZenMode ? '/device/disconnected' : '/device/connected';
      await fetch(`${API_URL}${endpoint}`, { method: 'POST' });
      
      dispatch({ type: actionTypes.SET_ZEN_MODE, payload: !state.isZenMode });
      
      // Update zen points when toggling
      if (!state.isZenMode) {
        dispatch({ 
          type: actionTypes.UPDATE_ZEN_POINTS, 
          payload: { 
            total: state.zenPoints + 1, 
            today: state.todayPoints + 1 
          } 
        });
      }
    } catch (error) {
      console.error('Error toggling zen mode:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Actions
  const actions = {
    setCurrentScreen: (screen) => 
      dispatch({ type: actionTypes.SET_CURRENT_SCREEN, payload: screen }),
    
    setDailyTarget: (target) => 
      dispatch({ type: actionTypes.SET_DAILY_TARGET, payload: target }),
    
    updateSettings: (newSettings) => 
      dispatch({ type: actionTypes.UPDATE_SETTINGS, payload: newSettings }),
    
    toggleZenMode,
    fetchStats
  };

  // Auto-fetch stats every 5 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ZenboxContext.Provider value={{ state, actions }}>
      {children}
    </ZenboxContext.Provider>
  );
};

// Custom hook to use the context
export const useZenbox = () => {
  const context = useContext(ZenboxContext);
  if (!context) {
    throw new Error('useZenbox must be used within a ZenboxProvider');
  }
  return context;
};

export default ZenboxContext;
