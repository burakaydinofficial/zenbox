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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        {navItems.map(({ id, icon: Icon, label }) => (
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
};

export default Navigation;
