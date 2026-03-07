from flask import Flask, jsonify, request
from flask_socketio import SocketIO
import os
from mqtt.mqtt_subscriber import start_mqtt, get_stats, reset_stats, process_packet_data
from models.classifier import get_classifier
from ips import get_ips_orchestrator
from env_loader import load_env_file

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Load local environment configuration from backend/.env if present.
load_env_file(os.path.join(os.path.dirname(__file__), ".env"))


@app.after_request
def add_cors_headers(response):
    """Allow frontend dev server to call Flask REST APIs."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Initialize classifier (loads ML model)
print("\n" + "="*60)
print("🤖 INITIALIZING ML MODEL")
print("="*60)
classifier = get_classifier()
if classifier.model:
    print("✅ ML MODEL LOADED SUCCESSFULLY!")
else:
    print("⚠️  ML MODEL NOT LOADED - USING HEURISTICS")
print("="*60 + "\n")

start_mqtt(socketio)

# Initialize IPS orchestrator (separate from current IDS dashboard pipeline)
ips_orchestrator = get_ips_orchestrator()
ips_orchestrator.bind_socket(socketio)

# REST API Endpoints
@app.route('/api/stats', methods=['GET'])
def stats():
    """Get current network statistics"""
    return jsonify(get_stats())

@app.route('/api/stats/reset', methods=['POST'])
def reset():
    """Reset statistics"""
    reset_stats()
    return jsonify({'message': 'Statistics reset'})

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'IDS Backend'})

@app.route('/api/inject-packet', methods=['POST'])
def inject_packet():
    """Inject packet data directly (for local mode simulator)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Process the packet through the classifier
        process_packet_data(data, socketio)
        
        return jsonify({'status': 'success', 'message': 'Packet injected'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ips/start', methods=['POST'])
def ips_start():
    """Start live IPS capture pipeline."""
    try:
        data = request.get_json(silent=True) or {}
        interface = data.get('interface')
        ips_orchestrator.start(interface=interface)
        return jsonify({'status': 'started', 'ips': ips_orchestrator.status()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ips/stop', methods=['POST'])
def ips_stop():
    """Stop live IPS capture pipeline."""
    try:
        ips_orchestrator.stop()
        return jsonify({'status': 'stopped', 'ips': ips_orchestrator.status()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ips/status', methods=['GET'])
def ips_status():
    """Get IPS runtime status."""
    return jsonify(ips_orchestrator.status())


@app.route('/api/ips/interfaces', methods=['GET'])
def ips_interfaces():
    """List available capture interfaces (best effort)."""
    try:
        get_if_list = __import__('scapy.all', fromlist=['get_if_list']).get_if_list
        return jsonify({'interfaces': get_if_list()})
    except Exception as e:
        return jsonify({'interfaces': [], 'error': str(e)})


@app.route('/api/ips/events', methods=['GET'])
def ips_events():
    """Get recent IPS events."""
    limit = request.args.get('limit', default=50, type=int)
    return jsonify({'events': ips_orchestrator.get_events(limit=max(1, min(limit, 300)))})


@app.route('/api/ips/enforcement/status', methods=['GET'])
def ips_enforcement_status():
    """Get host enforcement runtime status and validation health."""
    return jsonify(ips_orchestrator.status().get('enforcement', {}))


@app.route('/api/ips/enforcement/logs', methods=['GET'])
def ips_enforcement_logs():
    """Get recent enforcement audit logs."""
    limit = request.args.get('limit', default=50, type=int)
    return jsonify({'logs': ips_orchestrator.get_enforcement_logs(limit=max(1, min(limit, 500)))})


@app.route('/api/ips/inject-packet', methods=['POST'])
def ips_inject_packet():
    """Inject packet data directly into IPS pipeline (testing/demo)."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        result = ips_orchestrator.inject_packet(data)
        return jsonify({'status': 'success', 'event': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
