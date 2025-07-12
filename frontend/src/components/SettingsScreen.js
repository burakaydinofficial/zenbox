import React from 'react';
import { Bell, Phone, Gift } from 'lucide-react';
import { useSettings, useTimeFormat } from '../hooks/useZenboxData';

const SettingsScreen = () => {
  const { dailyTarget, settings, setDailyTarget, updateSettings } = useSettings();
  const { formatTime } = useTimeFormat();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Zen Settings</h2>
      
      <div className="space-y-4">
        {/* Daily Target */}
        <DailyTargetSetting 
          dailyTarget={dailyTarget}
          setDailyTarget={setDailyTarget}
          formatTime={formatTime}
        />

        {/* Settings Toggles */}
        <FeatureToggles 
          settings={settings}
          updateSettings={updateSettings}
        />

        {/* Zen Hours and Days */}
        <ZenSchedule 
          settings={settings}
          updateSettings={updateSettings}
        />

        {/* Donation Option */}
        <DonationSection />
      </div>
    </div>
  );
};

const DailyTargetSetting = ({ dailyTarget, setDailyTarget, formatTime }) => (
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
);

const FeatureToggles = ({ settings, updateSettings }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <h3 className="font-semibold text-gray-800 mb-3">Features</h3>
    <div className="space-y-3">
      <ToggleItem
        icon={Bell}
        iconColor="text-blue-500"
        label="Auto Reminder"
        isEnabled={settings.autoReminder}
        onToggle={() => updateSettings({ autoReminder: !settings.autoReminder })}
        toggleColor="bg-blue-500"
      />
      
      <ToggleItem
        icon={Phone}
        iconColor="text-green-500"
        label="Call Filtering"
        isEnabled={settings.callFiltering}
        onToggle={() => updateSettings({ callFiltering: !settings.callFiltering })}
        toggleColor="bg-green-500"
      />
    </div>
  </div>
);

const ToggleItem = ({ icon: Icon, iconColor, label, isEnabled, onToggle, toggleColor }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <Icon className={`${iconColor} mr-2`} size={20} />
      <span className="text-gray-700">{label}</span>
    </div>
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-all ${
        isEnabled ? toggleColor : 'bg-gray-300'
      }`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-all ${
        isEnabled ? 'translate-x-6' : 'translate-x-1'
      }`}></div>
    </button>
  </div>
);

const ZenSchedule = ({ settings, updateSettings }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <h3 className="font-semibold text-gray-800 mb-3">Zen Hours</h3>
    <input
      type="text"
      value={settings.zenHours}
      onChange={(e) => updateSettings({ zenHours: e.target.value })}
      className="w-full p-2 border border-gray-300 rounded-lg mb-3"
      placeholder="20:00-22:00"
    />
    
    <h3 className="font-semibold text-gray-800 mb-3">Zen Days</h3>
    <div className="grid grid-cols-2 gap-2">
      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
        <button
          key={day}
          onClick={() => {
            const newZenDays = settings.zenDays.includes(day) 
              ? settings.zenDays.filter(d => d !== day)
              : [...settings.zenDays, day];
            updateSettings({ zenDays: newZenDays });
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
);

const DonationSection = () => (
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
);

export default SettingsScreen;
