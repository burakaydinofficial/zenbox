import { useZenbox } from '../contexts/ZenboxContext';

// Hook for navigation management
export const useNavigation = () => {
  const { state, actions } = useZenbox();
  
  return {
    currentScreen: state.currentScreen,
    setCurrentScreen: actions.setCurrentScreen
  };
};

// Hook for zen mode management
export const useZenMode = () => {
  const { state, actions } = useZenbox();
  
  return {
    isZenMode: state.isZenMode,
    toggleZenMode: actions.toggleZenMode,
    isLoading: state.isLoading
  };
};

// Hook for stats and data
export const useStats = () => {
  const { state, actions } = useZenbox();
  
  return {
    stats: state.stats,
    todayZenTime: state.todayZenTime,
    weeklyData: state.weeklyData,
    zenPoints: state.zenPoints,
    todayPoints: state.todayPoints,
    refreshStats: actions.fetchStats,
    isLoading: state.isLoading,
    error: state.error
  };
};

// Hook for settings management
export const useSettings = () => {
  const { state, actions } = useZenbox();
  
  return {
    dailyTarget: state.dailyTarget,
    settings: state.settings,
    setDailyTarget: actions.setDailyTarget,
    updateSettings: actions.updateSettings
  };
};

// Hook for time formatting utility
export const useTimeFormat = () => {
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return {
    formatTime,
    formatDuration,
    formatDate
  };
};

// Hook for progress calculations
export const useProgress = () => {
  const { state } = useZenbox();
  
  const getDailyProgress = () => {
    return Math.round((state.todayZenTime / state.dailyTarget) * 100);
  };

  const getDailyProgressWidth = () => {
    return Math.min((state.todayZenTime / state.dailyTarget) * 100, 100);
  };

  const getWeeklyTotal = () => {
    return state.weeklyData.reduce((sum, day) => sum + day.zen, 0);
  };

  const getWeeklyAverage = () => {
    return Math.round(getWeeklyTotal() / 7);
  };

  return {
    getDailyProgress,
    getDailyProgressWidth,
    getWeeklyTotal,
    getWeeklyAverage
  };
};
