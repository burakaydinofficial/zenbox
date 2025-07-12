import React from 'react';
import { Home, BarChart3, Settings, Clock } from 'lucide-react';
import { useNavigation } from '../hooks/useZenboxData';

const Navigation = () => {
  const { currentScreen, setCurrentScreen } = useNavigation();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'sessions', icon: Clock, label: 'Sessions' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="navigation">
      <div className="navigation-container">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentScreen(id)}
            className={`nav-button ${currentScreen === id ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span className="nav-button-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
