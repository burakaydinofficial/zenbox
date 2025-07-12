from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import pandas as pd
import os
import datetime
from datetime import datetime

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

DEVICE_EVENTS_FILE = 'device_events.csv'

def init_events_file():
    if not os.path.exists(DEVICE_EVENTS_FILE):
        df = pd.DataFrame(columns=['timestamp', 'isConnected'])
        df.to_csv(DEVICE_EVENTS_FILE, index=False)

init_events_file()

def get_data():
    df = pd.read_csv('device_logs.csv')
    return df.to_dict(orient='records')

def aggregate(data):
    total_time = 0
    connected = False
    connected_timestamp = {}
    sessions = []
    
    for entry in data:
        time = entry[0]
        entry_connected_before_parse = entry[1]
        entry_connected = entry_connected_before_parse.lower() == "true"
        parsed_time = datetime.strptime(time, "%Y-%m-%d %H:%M")
        
        if entry_connected:
            connected = True
            connected_timestamp = parsed_time
        elif connected:
            diff = parsed_time - connected_timestamp
            total_time += diff.total_seconds()
            connected = False
            connected_timestamp = {}
            sessions.append((connected_timestamp, diff.total_seconds()))

    return (total_time, sessions)

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
        return jsonify({"total_time": 0, "sessions": []})
    
    df = pd.read_csv(DEVICE_EVENTS_FILE)
    if df.empty:
        return jsonify({"total_time": 0, "sessions": []})
    
    data = df.values.tolist()
    total_time, sessions = aggregate(data)
    
    # Convert sessions to a JSON-serializable format
    sessions_json = [{"start": str(start), "duration": duration} for start, duration in sessions]
    
    return jsonify({
        "total_time": total_time,
        "sessions": sessions_json
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
