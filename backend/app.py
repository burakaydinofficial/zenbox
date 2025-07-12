from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import pandas as pd
import os
import json
import datetime
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

DEVICE_EVENTS_FILE = 'device_events.csv'
USER_CONFIG_FILE = 'user_config.json'

def init_events_file():
    if not os.path.exists(DEVICE_EVENTS_FILE):
        df = pd.DataFrame(columns=['timestamp', 'isConnected'])
        df.to_csv(DEVICE_EVENTS_FILE, index=False)

def init_user_config():
    default_config = {
        "dailyTarget": 120,  # 120 minutes = 2 hours per day
        "settings": {
            "autoReminder": True,
            "callFiltering": True,
            "zenHours": "20:00-22:00",
            "zenDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        }
    }
    if not os.path.exists(USER_CONFIG_FILE):
        with open(USER_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2)

def load_user_config():
    try:
        with open(USER_CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        init_user_config()
        return load_user_config()

def save_user_config(config):
    with open(USER_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

def migrate_config_if_needed():
    """Migrate old config format to new format if needed"""
    config = load_user_config()
    
    # If we have weeklyTarget but no dailyTarget, migrate
    if "weeklyTarget" in config and "dailyTarget" not in config:
        config["dailyTarget"] = config["weeklyTarget"] // 7
        del config["weeklyTarget"]
        save_user_config(config)
        print("Migrated config from weeklyTarget to dailyTarget")
    
    # Ensure dailyTarget exists
    if "dailyTarget" not in config:
        config["dailyTarget"] = 120  # Default 2 hours
        save_user_config(config)

init_events_file()
init_user_config()
migrate_config_if_needed()

def get_data():
    df = pd.read_csv(DEVICE_EVENTS_FILE)
    return df.to_dict(orient='records')

def get_sessions_from_data(data):
    """Process raw device events and return completed sessions"""
    sessions = []
    connected = False
    connected_timestamp = None
    
    for entry in data:
        time = entry[0]
        entry_connected = entry[1]
        parsed_time = datetime.strptime(time, "%Y-%m-%d %H:%M")
        
        if entry_connected and not connected:
            connected = True
            connected_timestamp = parsed_time
        elif not entry_connected and connected:
            if connected_timestamp:
                duration = (parsed_time - connected_timestamp).total_seconds()
                sessions.append({
                    "start": connected_timestamp.isoformat(),
                    "end": parsed_time.isoformat(),
                    "duration": duration
                })
            connected = False
            connected_timestamp = None
    
    return sessions

def calculate_weekly_target(daily_target):
    """Calculate weekly target from daily target"""
    return daily_target * 7

def calculate_today_zen_time(sessions):
    """Calculate today's zen time in minutes from sessions"""
    today = datetime.now().date()
    today_seconds = 0
    
    for session in sessions:
        session_date = datetime.fromisoformat(session["start"]).date()
        if session_date == today:
            today_seconds += session["duration"]
    
    return int(today_seconds // 60)  # Convert to minutes

def calculate_zen_points(sessions):
    """Calculate total zen points (1 point per second)"""
    total_seconds = sum(session["duration"] for session in sessions)
    return int(total_seconds)

def calculate_today_points(sessions):
    """Calculate today's zen points"""
    today = datetime.now().date()
    today_seconds = 0
    
    for session in sessions:
        session_date = datetime.fromisoformat(session["start"]).date()
        if session_date == today:
            today_seconds += session["duration"]
    
    return int(today_seconds)

def calculate_weekly_data(sessions, daily_target):
    """Calculate weekly data for the past 7 days"""
    today = datetime.now().date()
    weekly_data = []
    
    # Create data for the past 7 days
    for i in range(6, -1, -1):  # 6 days ago to today
        date = today - timedelta(days=i)
        day_name = date.strftime('%a')
        
        # Calculate zen time for this day
        day_minutes = 0
        for session in sessions:
            session_date = datetime.fromisoformat(session["start"]).date()
            if session_date == date:
                day_minutes += session["duration"] // 60
        
        weekly_data.append({
            "day": day_name,
            "zen": int(day_minutes),
            "target": daily_target
        })
    
    return weekly_data

def is_currently_in_zen_mode(sessions):
    """Check if user is currently in zen mode (has an active session)"""
    if not sessions:
        return False
    
    # Check if the last session doesn't have an end time or is very recent
    last_session = sessions[-1]
    if "end" not in last_session:
        return True
    
    # Check if last disconnection was very recent (within 1 minute)
    last_end = datetime.fromisoformat(last_session["end"])
    time_diff = datetime.now() - last_end
    return time_diff.total_seconds() < 60

def log_device_event(is_connected):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    df = pd.DataFrame([[timestamp, str(is_connected)]], columns=['timestamp', 'isConnected'])
    if os.path.exists(DEVICE_EVENTS_FILE):
        df.to_csv(DEVICE_EVENTS_FILE, mode='a', header=False, index=False)
    else:
        df.to_csv(DEVICE_EVENTS_FILE, index=False)

@app.route('/api/data')
def api_data():
    return jsonify(get_data())

@app.route('/api/device/connected', methods=['POST'])
def device_connected():
    log_device_event(True)
    return jsonify({"status": "success", "message": "Device connection logged"})

@app.route('/api/device/disconnected', methods=['POST'])
def device_disconnected():
    log_device_event(False)
    return jsonify({"status": "success", "message": "Device disconnection logged"})

@app.route('/api/device/stats')
def device_stats():
    if not os.path.exists(DEVICE_EVENTS_FILE):
        return jsonify({
            "total_time": 0,
            "sessions": [],
            "isZenMode": False,
            "todayZenTime": 0,
            "zenPoints": 0,
            "todayPoints": 0,
            "weeklyData": []
        })
    
    df = pd.read_csv(DEVICE_EVENTS_FILE)
    if df.empty:
        return jsonify({
            "total_time": 0,
            "sessions": [],
            "isZenMode": False,
            "todayZenTime": 0,
            "zenPoints": 0,
            "todayPoints": 0,
            "weeklyData": []
        })
    
    # Get user config for calculations
    config = load_user_config()
    daily_target = config["dailyTarget"]
    
    # Process sessions
    data = df.values.tolist()
    sessions = get_sessions_from_data(data)
    
    # Calculate derived values
    total_time = sum(session["duration"] for session in sessions)
    today_zen_time = calculate_today_zen_time(sessions)
    zen_points = calculate_zen_points(sessions)
    today_points = calculate_today_points(sessions)
    weekly_data = calculate_weekly_data(sessions, daily_target)
    is_zen_mode = is_currently_in_zen_mode(sessions)
    
    return jsonify({
        "total_time": total_time,
        "sessions": sessions,
        "isZenMode": is_zen_mode,
        "todayZenTime": today_zen_time,
        "zenPoints": zen_points,
        "todayPoints": today_points,
        "weeklyData": weekly_data,
        "dailyTarget": daily_target
    })

@app.route('/api/user/config', methods=['GET'])
def get_user_config():
    config = load_user_config()
    weekly_target = calculate_weekly_target(config["dailyTarget"])
    
    return jsonify({
        "dailyTarget": config["dailyTarget"],
        "weeklyTarget": weekly_target,
        "settings": config["settings"]
    })

@app.route('/api/user/config', methods=['PUT'])
def update_user_config():
    try:
        new_config = request.get_json()
        current_config = load_user_config()
        
        # Update configuration
        if "dailyTarget" in new_config:
            current_config["dailyTarget"] = new_config["dailyTarget"]
        
        if "settings" in new_config:
            current_config["settings"].update(new_config["settings"])
        
        save_user_config(current_config)
        
        return jsonify({
            "status": "success",
            "message": "Configuration updated",
            "config": current_config
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

@app.route('/api/user/daily-target', methods=['PUT'])
def update_daily_target():
    try:
        data = request.get_json()
        daily_target = data.get("dailyTarget")
        
        if not daily_target or daily_target < 30 or daily_target > 480:
            return jsonify({
                "status": "error",
                "message": "Daily target must be between 30 and 480 minutes"
            }), 400
        
        # Calculate weekly target for reference
        weekly_target = calculate_weekly_target(daily_target)
        
        config = load_user_config()
        config["dailyTarget"] = daily_target
        save_user_config(config)
        
        return jsonify({
            "status": "success",
            "message": "Daily target updated",
            "dailyTarget": daily_target,
            "weeklyTarget": weekly_target
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8182)
