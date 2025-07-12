import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css';

// Context and Components
import { ZenboxProvider } from './contexts/ZenboxContext';
import { useNavigation } from './hooks/useZenboxData';
import Navigation from './components/Navigation';
import HomeScreen from './components/HomeScreen';
import StatsScreen from './components/StatsScreen';
import SessionsScreen from './components/SessionsScreen';
import SettingsScreen from './components/SettingsScreen';

const ZenboxApp = () => {
  const { currentScreen } = useNavigation();

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'sessions':
        return <SessionsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Main Content */}
        <div className="main-content">
          {renderCurrentScreen()}
        </div>
        
        {/* Navigation */}
        <Navigation />
      </div>
    </div>
  );
};

const App = () => (
  <ZenboxProvider>
    <ZenboxApp />
  </ZenboxProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
