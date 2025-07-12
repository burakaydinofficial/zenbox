from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import pandas as pd
import os
import json
import datetime
from datetime import datetime, timedelta
import threading
import time
import subprocess
import re

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

DEVICE_EVENTS_FILE = 'device_events.csv'
USER_CONFIG_FILE = 'user_config.json'

# USB Device Monitor Configuration
USB_CHECK_INTERVAL = 3  # Check every 3 seconds
PHONE_PATTERNS = [
    r'iPhone|iPad|iPod',  # Apple devices
    r'Samsung|Galaxy',    # Samsung devices
    r'Google|Pixel',      # Google devices
    r'OnePlus',          # OnePlus devices
    r'Huawei|Honor',     # Huawei devices
    r'Xiaomi|Mi|Redmi',  # Xiaomi devices
    r'LG.*Phone',        # LG phones
    r'HTC',              # HTC devices
    r'Sony.*Xperia',     # Sony devices
    r'Motorola|Moto',    # Motorola devices
    r'Nokia',            # Nokia devices
    r'OPPO|Vivo',        # OPPO/Vivo devices
]

# Global variables for device monitoring
connected_device_ids = set()  # Track by device IDs instead of names
connected_device_names = {}  # device_id -> device_name mapping for disconnection logging
device_monitor_running = False
device_monitor_thread = None

def init_events_file():
    if not os.path.exists(DEVICE_EVENTS_FILE):
        df = pd.DataFrame(columns=['timestamp', 'isConnected', 'deviceName'])
        df.to_csv(DEVICE_EVENTS_FILE, index=False)
    else:
        # Check if deviceName column exists, add if missing for backward compatibility
        df = pd.read_csv(DEVICE_EVENTS_FILE)
        if 'deviceName' not in df.columns:
            df['deviceName'] = ''  # Add empty device name for existing records
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
        # Handle both boolean and string types
        if isinstance(entry[1], bool):
            entry_connected = entry[1]
        else:
            entry_connected_str = str(entry[1]).lower()
            entry_connected = entry_connected_str == "true"
        
        # Handle optional device name (3rd column) - backwards compatible
        device_name = entry[2] if len(entry) > 2 else ""
        
        # Try to parse with seconds first, fallback to minutes only
        try:
            parsed_time = datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                parsed_time = datetime.strptime(time, "%Y-%m-%d %H:%M")
            except ValueError:
                continue  # Skip invalid timestamps
        
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
    
    # Handle case where session is still active (last event was connection)
    if connected and connected_timestamp:
        # Create an ongoing session with current time as end
        current_time = datetime.now()
        duration = (current_time - connected_timestamp).total_seconds()
        sessions.append({
            "start": connected_timestamp.isoformat(),
            "end": current_time.isoformat(),
            "duration": duration,
            "isActive": True  # Mark as currently active session
        })
    
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

def is_currently_in_zen_mode(sessions, data):
    """Check if user is currently in zen mode (has an active session)"""
    if not data:
        return False
    
    # Check the last event in the raw data
    last_event = data[-1]
    # Handle both boolean and string types
    if isinstance(last_event[1], bool):
        last_connected = last_event[1]
    else:
        last_connected_str = str(last_event[1]).lower()
        last_connected = last_connected_str == "true"
    
    # If the last event was a connection, user is in zen mode
    # If the last event was a disconnection, user is NOT in zen mode
    return last_connected

def log_device_event(is_connected, device_name=""):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        df = pd.DataFrame([[timestamp, str(is_connected), device_name]], 
                         columns=['timestamp', 'isConnected', 'deviceName'])
        if os.path.exists(DEVICE_EVENTS_FILE):
            df.to_csv(DEVICE_EVENTS_FILE, mode='a', header=False, index=False)
        else:
            df.to_csv(DEVICE_EVENTS_FILE, index=False)
    except Exception as e:
        print(f"Error logging device event: {e}")
        raise

def get_usb_devices():
    """Get list of connected USB devices using lsusb"""
    try:
        # Run lsusb command
        result = subprocess.run(['lsusb'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return result.stdout.strip().split('\n')
        else:
            print(f"lsusb command failed with return code {result.returncode}")
            return []
    except subprocess.TimeoutExpired:
        print("lsusb command timed out")
        return []
    except FileNotFoundError:
        print("lsusb command not found. Make sure usbutils is installed.")
        return []
    except Exception as e:
        print(f"Error running lsusb: {e}")
        return []

def extract_device_info(lsusb_line):
    """Extract device ID and name from lsusb output line"""
    try:
        # lsusb output format: "Bus 001 Device 002: ID 1234:5678 Device Name"
        # We want to extract both the device ID and name
        parts = lsusb_line.split(': ID ')
        if len(parts) > 1:
            # Get everything after "ID "
            device_part = parts[1]
            # Split into ID and name parts
            id_and_name = device_part.split(' ', 1)
            if len(id_and_name) >= 2:
                device_id = id_and_name[0].strip()  # e.g., "1234:5678"
                device_name = id_and_name[1].strip()  # e.g., "Device Name"
                return device_id, device_name
            elif len(id_and_name) == 1:
                # Only ID available, no name
                device_id = id_and_name[0].strip()
                return device_id, ""
        return "", ""
    except Exception as e:
        print(f"Error extracting device info from '{lsusb_line}': {e}")
        return "", ""

def is_phone_device(device_name):
    """Check if device name matches phone patterns"""
    if not device_name:
        return False
    
    for pattern in PHONE_PATTERNS:
        if re.search(pattern, device_name, re.IGNORECASE):
            return True
    return False

def get_connected_phones():
    """Get dict of currently connected phone devices (deduplicated by device ID)"""
    phones = {}  # device_id -> device_name mapping
    usb_devices = get_usb_devices()
    
    for device_line in usb_devices:
        device_id, device_name = extract_device_info(device_line)
        if device_id and device_name and is_phone_device(device_name):
            # Use device ID as key to prevent duplicates
            # If we already have this device ID, prefer the one with more descriptive name
            if device_id not in phones or len(device_name) > len(phones[device_id]):
                phones[device_id] = device_name
    
    return phones

def device_monitor():
    """Background thread function to monitor USB devices"""
    global connected_device_ids, connected_device_names, device_monitor_running
    
    print("USB Device Monitor started")
    
    # Get initial state
    current_phones = get_connected_phones()
    connected_device_ids = set(current_phones.keys())
    connected_device_names = current_phones.copy()
    
    if current_phones:
        print(f"Initial connected phones: {current_phones}")
        # Log initial connections (only once per device ID)
        for device_id, device_name in current_phones.items():
            try:
                log_device_event(True, device_name)
                print(f"Auto-logged initial connection: {device_name} (ID: {device_id})")
            except Exception as e:
                print(f"Error logging initial connection for {device_name}: {e}")
    
    while device_monitor_running:
        try:
            time.sleep(USB_CHECK_INTERVAL)
            
            if not device_monitor_running:
                break
                
            current_phones = get_connected_phones()
            current_device_ids = set(current_phones.keys())
            
            # Check for newly connected devices (by device ID)
            new_device_ids = current_device_ids - connected_device_ids
            for device_id in new_device_ids:
                device_name = current_phones[device_id]
                try:
                    log_device_event(True, device_name)
                    print(f"Auto-detected connection: {device_name} (ID: {device_id})")
                except Exception as e:
                    print(f"Error logging connection for {device_name}: {e}")
            
            # Check for disconnected devices (by device ID)
            removed_device_ids = connected_device_ids - current_device_ids
            for device_id in removed_device_ids:
                # Use the stored device name for proper logging
                device_name = connected_device_names.get(device_id, f"Device ID: {device_id}")
                try:
                    log_device_event(False, device_name)
                    print(f"Auto-detected disconnection: {device_name} (ID: {device_id})")
                except Exception as e:
                    print(f"Error logging disconnection for {device_name}: {e}")
            
            # Update connected device state
            connected_device_ids = current_device_ids
            connected_device_names = current_phones.copy()
            
        except Exception as e:
            print(f"Error in device monitor: {e}")
            # Continue monitoring even if there's an error
            time.sleep(USB_CHECK_INTERVAL)
    
    print("USB Device Monitor stopped")

def start_device_monitor():
    """Start the USB device monitoring thread"""
    global device_monitor_running, device_monitor_thread
    
    if device_monitor_running:
        print("Device monitor is already running")
        return
    
    device_monitor_running = True
    device_monitor_thread = threading.Thread(target=device_monitor, daemon=True)
    device_monitor_thread.start()
    print("Device monitor thread started")

def stop_device_monitor():
    """Stop the USB device monitoring thread"""
    global device_monitor_running, device_monitor_thread
    
    if not device_monitor_running:
        print("Device monitor is not running")
        return
    
    print("Stopping device monitor...")
    device_monitor_running = False
    
    if device_monitor_thread and device_monitor_thread.is_alive():
        device_monitor_thread.join(timeout=5)
    
    print("Device monitor stopped")

@app.route('/api/debug/events')
def debug_events():
    """Debug endpoint to see raw events and processing"""
    try:
        if not os.path.exists(DEVICE_EVENTS_FILE):
            return jsonify({"events": [], "message": "No events file"})
        
        df = pd.read_csv(DEVICE_EVENTS_FILE)
        if df.empty:
            return jsonify({"events": [], "message": "No events"})
        
        data = df.values.tolist()
        sessions = get_sessions_from_data(data)
        
        # Get last few events for debugging
        last_events = data[-5:] if len(data) >= 5 else data
        
        return jsonify({
            "lastEvents": last_events,
            "sessions": sessions,
            "isZenMode": is_currently_in_zen_mode(sessions, data),
            "totalEvents": len(data)
        })
        
    except Exception as e:
        return jsonify({
            "error": f"Error in debug endpoint: {str(e)}",
            "events": [],
            "message": "Error processing events"
        }), 500

@app.route('/api/data')
def api_data():
    return jsonify(get_data())

@app.route('/api/device/connected', methods=['POST'])
def device_connected():
    try:
        # Get optional device name from request body - backward compatible
        device_name = ''
        try:
            data = request.get_json(silent=True) or {}
            device_name = data.get('deviceName', '')
        except:
            # If JSON parsing fails, just use empty device name for backward compatibility
            device_name = ''
        
        log_device_event(True, device_name)
        return jsonify({"status": "success", "message": "Device connection logged"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to log connection: {str(e)}"}), 500

@app.route('/api/device/disconnected', methods=['POST'])
def device_disconnected():
    try:
        # Get optional device name from request body - backward compatible
        device_name = ''
        try:
            data = request.get_json(silent=True) or {}
            device_name = data.get('deviceName', '')
        except:
            # If JSON parsing fails, just use empty device name for backward compatibility
            device_name = ''
        
        log_device_event(False, device_name)
        return jsonify({"status": "success", "message": "Device disconnection logged"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to log disconnection: {str(e)}"}), 500

@app.route('/api/device/monitor/status')
def monitor_status():
    """Get USB device monitor status"""
    return jsonify({
        "monitoring": device_monitor_running,
        "connectedDevices": list(connected_device_names.values()),
        "connectedDeviceIds": list(connected_device_ids),
        "deviceMapping": connected_device_names,
        "checkInterval": USB_CHECK_INTERVAL,
        "phonePatterns": PHONE_PATTERNS
    })

@app.route('/api/device/monitor/start', methods=['POST'])
def start_monitor():
    """Start USB device monitoring"""
    try:
        start_device_monitor()
        return jsonify({
            "status": "success",
            "message": "Device monitoring started",
            "monitoring": device_monitor_running
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to start monitoring: {str(e)}"
        }), 500

@app.route('/api/device/monitor/stop', methods=['POST'])
def stop_monitor():
    """Stop USB device monitoring"""
    try:
        stop_device_monitor()
        return jsonify({
            "status": "success",
            "message": "Device monitoring stopped",
            "monitoring": device_monitor_running
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to stop monitoring: {str(e)}"
        }), 500

@app.route('/api/device/scan', methods=['POST'])
def manual_scan():
    """Manually scan for USB devices (for testing)"""
    try:
        usb_devices = get_usb_devices()
        phones = get_connected_phones()
        
        # Also show detailed device info for debugging
        device_details = []
        
        for device_line in usb_devices:
            device_id, device_name = extract_device_info(device_line)
            device_details.append({
                "raw": device_line,
                "id": device_id,
                "name": device_name,
                "isPhone": is_phone_device(device_name) if device_name else False
            })
        
        return jsonify({
            "status": "success",
            "allDevices": usb_devices,
            "deviceDetails": device_details,
            "phoneDeviceMapping": phones,
            "phoneDevices": list(phones.values()),
            "phoneCount": len(phones)
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to scan devices: {str(e)}"
        }), 500

@app.route('/api/device/stats')
def device_stats():
    try:
        if not os.path.exists(DEVICE_EVENTS_FILE):
            return jsonify({
                "total_time": 0,
                "sessions": [],
                "isZenMode": False,
                "todayZenTime": 0,
                "zenPoints": 0,
                "todayPoints": 0,
                "weeklyData": [],
                "dailyTarget": 120
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
                "weeklyData": [],
                "dailyTarget": 120
            })
        
        # Get user config for calculations
        config = load_user_config()
        daily_target = config.get("dailyTarget", 120)
        
        # Process sessions
        data = df.values.tolist()
        sessions = get_sessions_from_data(data)
        
        # Calculate derived values
        total_time = sum(session["duration"] for session in sessions)
        today_zen_time = calculate_today_zen_time(sessions)
        zen_points = calculate_zen_points(sessions)
        today_points = calculate_today_points(sessions)
        weekly_data = calculate_weekly_data(sessions, daily_target)
        is_zen_mode = is_currently_in_zen_mode(sessions, data)
        
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
        
    except Exception as e:
        return jsonify({
            "error": f"Error processing device stats: {str(e)}",
            "total_time": 0,
            "sessions": [],
            "isZenMode": False,
            "todayZenTime": 0,
            "zenPoints": 0,
            "todayPoints": 0,
            "weeklyData": [],
            "dailyTarget": 120
        }), 500

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
        if not new_config:
            return jsonify({
                "status": "error",
                "message": "No configuration data provided"
            }), 400
            
        current_config = load_user_config()
        
        # Update configuration
        if "dailyTarget" in new_config:
            daily_target = new_config["dailyTarget"]
            if not isinstance(daily_target, (int, float)) or daily_target < 30 or daily_target > 480:
                return jsonify({
                    "status": "error",
                    "message": "Daily target must be a number between 30 and 480 minutes"
                }), 400
            current_config["dailyTarget"] = daily_target
        
        if "settings" in new_config:
            if not isinstance(new_config["settings"], dict):
                return jsonify({
                    "status": "error",
                    "message": "Settings must be an object"
                }), 400
            current_config["settings"].update(new_config["settings"])
        
        save_user_config(current_config)
        
        return jsonify({
            "status": "success",
            "message": "Configuration updated",
            "config": current_config
        })
    
    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON data"
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/user/daily-target', methods=['PUT'])
def update_daily_target():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
            
        daily_target = data.get("dailyTarget")
        
        if daily_target is None:
            return jsonify({
                "status": "error",
                "message": "dailyTarget is required"
            }), 400
            
        if not isinstance(daily_target, (int, float)) or daily_target < 30 or daily_target > 480:
            return jsonify({
                "status": "error",
                "message": "Daily target must be a number between 30 and 480 minutes"
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
    
    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON data"
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Start USB device monitoring when running the app
    start_device_monitor()
    
    try:
        app.run(debug=True, host='0.0.0.0', port=8182)
    except KeyboardInterrupt:
        print("\nShutting down...")
        stop_device_monitor()
    except Exception as e:
        print(f"Error running app: {e}")
        stop_device_monitor()
