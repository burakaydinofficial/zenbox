from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

def get_data():
    df = pd.read_csv('device_logs.csv')
    return df.to_dict(orient='records')

@app.route('/api/data')
def api_data():
    return jsonify(get_data())

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
