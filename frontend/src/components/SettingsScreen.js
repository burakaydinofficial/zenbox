import React from 'react';
import { Bell, Phone, Gift } from 'lucide-react';
import { useSettings, useTimeFormat } from '../hooks/useZenboxData';

const SettingsScreen = () => {
  const { dailyTarget, settings, setDailyTarget, updateSettings } = useSettings();
  const { formatTime } = useTimeFormat();

  return (
    <div className="settings-screen">
      <h2 className="settings-title">Zen Settings</h2>
      
      <div className="settings-sections">
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
  <div className="settings-section">
    <h3 className="section-title">Daily Target</h3>
    <div className="target-control">
      <input
        type="range"
        min="30"
        max="480"
        value={dailyTarget}
        onChange={(e) => setDailyTarget(parseInt(e.target.value))}
        className="target-slider"
      />
      <span className="target-value">{formatTime(dailyTarget)}</span>
    </div>
  </div>
);

const FeatureToggles = ({ settings, updateSettings }) => (
  <div className="settings-section">
    <h3 className="section-title">Features</h3>
    <div className="feature-toggles">
      <ToggleItem
        icon={Bell}
        iconColor="text-blue-500"
        label="Auto Reminder"
        isEnabled={settings.autoReminder}
        onToggle={() => updateSettings({ autoReminder: !settings.autoReminder })}
        toggleColor=""
      />
      
      <ToggleItem
        icon={Phone}
        iconColor="text-green-500"
        label="Call Filtering"
        isEnabled={settings.callFiltering}
        onToggle={() => updateSettings({ callFiltering: !settings.callFiltering })}
        toggleColor="green"
      />
    </div>
  </div>
);

const ToggleItem = ({ icon: Icon, iconColor, label, isEnabled, onToggle, toggleColor }) => (
  <div className="toggle-item">
    <div className="toggle-label">
      <Icon className={`toggle-icon ${iconColor}`} size={20} />
      <span className="toggle-text">{label}</span>
    </div>
    <button
      onClick={onToggle}
      className={`toggle-switch ${isEnabled ? `active ${toggleColor}` : ''}`}
    >
      <div className={`toggle-thumb ${isEnabled ? 'active' : ''}`}></div>
    </button>
  </div>
);

const ZenSchedule = ({ settings, updateSettings }) => (
  <div className="settings-section">
    <h3 className="section-title">Zen Schedule</h3>
    <div className="zen-schedule">
      <input
        type="text"
        value={settings.zenHours}
        onChange={(e) => updateSettings({ zenHours: e.target.value })}
        className="zen-hours-input"
        placeholder="20:00-22:00"
      />
      
      <div className="zen-days">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
          <button
            key={day}
            onClick={() => {
              const newZenDays = settings.zenDays.includes(day) 
                ? settings.zenDays.filter(d => d !== day)
                : [...settings.zenDays, day];
              updateSettings({ zenDays: newZenDays });
            }}
            className={`day-button ${settings.zenDays.includes(day) ? 'active' : ''}`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const DonationSection = () => (
  <div className="donation-section">
    <div className="donation-header">
      <Gift className="donation-icon" size={20} />
      <h3 className="donation-title">Zen Donation</h3>
    </div>
    <p className="donation-text">
      Gift your Zen points to others
    </p>
    <button className="donation-button">
      Donate
    </button>
  </div>
);

export default SettingsScreen;
