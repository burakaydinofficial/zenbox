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
  
  // Settings (will be loaded from backend)
  dailyTarget: 120, // minutes
  weeklyTarget: 840, // minutes
  settings: {
    autoReminder: true,
    callFiltering: true,
    zenHours: '20:00-22:00',
    zenDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  
  // Data (calculated by backend)
  stats: null,
  todayZenTime: 0, // minutes
  zenPoints: 0,
  todayPoints: 0,
  weeklyData: []
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  SET_ZEN_MODE: 'SET_ZEN_MODE',
  SET_DAILY_TARGET: 'SET_DAILY_TARGET',
  SET_WEEKLY_TARGET: 'SET_WEEKLY_TARGET',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_STATS_DATA: 'SET_STATS_DATA',
  SET_CONFIG_DATA: 'SET_CONFIG_DATA'
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
    
    case actionTypes.SET_WEEKLY_TARGET:
      return { ...state, weeklyTarget: action.payload };
    
    case actionTypes.UPDATE_SETTINGS:
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload } 
      };
    
    case actionTypes.SET_STATS_DATA:
      return { 
        ...state, 
        stats: action.payload.stats,
        isZenMode: action.payload.isZenMode,
        todayZenTime: action.payload.todayZenTime,
        zenPoints: action.payload.zenPoints,
        todayPoints: action.payload.todayPoints,
        weeklyData: action.payload.weeklyData,
        dailyTarget: action.payload.dailyTarget
      };
    
    case actionTypes.SET_CONFIG_DATA:
      return {
        ...state,
        dailyTarget: action.payload.dailyTarget,
        weeklyTarget: action.payload.weeklyTarget,
        settings: action.payload.settings
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
      
      dispatch({ 
        type: actionTypes.SET_STATS_DATA, 
        payload: {
          stats: data.sessions,
          isZenMode: data.isZenMode,
          todayZenTime: data.todayZenTime,
          zenPoints: data.zenPoints,
          todayPoints: data.todayPoints,
          weeklyData: data.weeklyData,
          dailyTarget: data.dailyTarget
        }
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/user/config`);
      const data = await response.json();
      
      dispatch({ 
        type: actionTypes.SET_CONFIG_DATA, 
        payload: {
          dailyTarget: data.dailyTarget,
          weeklyTarget: data.weeklyTarget,
          settings: data.settings
        }
      });

    } catch (error) {
      console.error('Error fetching config:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  const updateDailyTarget = async (newTarget) => {
    try {
      const response = await fetch(`${API_URL}/user/daily-target`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dailyTarget: newTarget })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: actionTypes.SET_DAILY_TARGET, payload: data.dailyTarget });
        dispatch({ type: actionTypes.SET_WEEKLY_TARGET, payload: data.weeklyTarget });
        // Refresh stats to get updated weekly data
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating daily target:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  const updateUserSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API_URL}/user/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings })
      });

      if (response.ok) {
        dispatch({ type: actionTypes.UPDATE_SETTINGS, payload: newSettings });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  const toggleZenMode = async () => {
    try {
      const endpoint = state.isZenMode ? '/device/disconnected' : '/device/connected';
      await fetch(`${API_URL}${endpoint}`, { method: 'POST' });
      
      // Let the next fetchStats call update the zen mode state
      setTimeout(fetchStats, 500);
    } catch (error) {
      console.error('Error toggling zen mode:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Actions
  const actions = {
    setCurrentScreen: (screen) => 
      dispatch({ type: actionTypes.SET_CURRENT_SCREEN, payload: screen }),
    
    setDailyTarget: updateDailyTarget,
    updateSettings: updateUserSettings,
    toggleZenMode,
    fetchStats,
    fetchConfig
  };

  // Auto-fetch config and stats on mount, then stats every 5 seconds
  useEffect(() => {
    fetchConfig();
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
