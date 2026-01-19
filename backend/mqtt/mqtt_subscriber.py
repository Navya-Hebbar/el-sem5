import json
import paho.mqtt.client as mqtt
import threading
import time
from models.classifier import get_classifier
from collections import defaultdict
from datetime import datetime
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from firebase_logger import get_firebase_logger

# Global statistics
network_stats = {
    'total_packets': 0,
    'attack_count': 0,
    'packets_per_sec': 0,
    'active_sessions': set(),
    'attack_distribution': defaultdict(int),
    'recent_attacks': [],
    'last_packet_time': time.time()
}

def process_packet_data(data, socketio):
    """Process packet data (used by both MQTT and HTTP injection)"""
    try:
        classifier = get_classifier()
        firebase_logger = get_firebase_logger()
        
        # Prepare features for classification (20 selected features required by trained model)
        features = {
            'src_bytes': float(data.get('src_bytes', 0)),
            'same_srv_rate': float(data.get('same_srv_rate', 0)),
            'flag': data.get('flag', 'S0'),
            'dst_host_serror_rate': float(data.get('dst_host_serror_rate', 0)),
            'srv_serror_rate': float(data.get('srv_serror_rate', 0)),
            'dst_host_same_srv_rate': float(data.get('dst_host_same_srv_rate', 0.5)),
            'diff_srv_rate': float(data.get('diff_srv_rate', 0)),
            'count': float(data.get('packet_count', data.get('count', 1))),
            'dst_host_srv_serror_rate': float(data.get('dst_host_srv_serror_rate', 0)),
            'serror_rate': float(data.get('serror_rate', 0)),
            'dst_host_same_src_port_rate': float(data.get('dst_host_same_src_port_rate', 0)),
            'dst_host_srv_diff_host_rate': float(data.get('dst_host_srv_diff_host_rate', 0)),
            'dst_bytes': float(data.get('dst_bytes', data.get('length', 0))),
            'dst_host_diff_srv_rate': float(data.get('dst_host_diff_srv_rate', 0)),
            'protocol_type': data.get('protocol', 'tcp'),
            'dst_host_srv_count': float(data.get('dst_host_srv_count', 1)),
            'service': data.get('service', 'http'),
            'srv_count': float(data.get('srv_count', 1)),
            'dst_host_count': float(data.get('dst_host_count', 1)),
            'dst_host_rerror_rate': float(data.get('dst_host_rerror_rate', 0)),
        }
        
        # Get classification
        classification = classifier.classify_packet(features)
        
        # Update statistics
        network_stats['total_packets'] += 1
        session_key = f"{data.get('src_ip', '')}:{data.get('dst_ip', '')}"
        network_stats['active_sessions'].add(session_key)
        
        is_attack = classification['attack_type'] != 'normal'
        if is_attack:
            network_stats['attack_count'] += 1
            network_stats['attack_distribution'][classification['attack_type']] += 1
        
        # Prepare enriched data
        enriched_data = {
            **data,
            'attack_type': classification['attack_type'],
            'attack_category': classification['category'],
            'confidence': classification['confidence'],
            'is_attack': is_attack,
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
        }
        
        # Track recent attacks
        if is_attack:
            network_stats['recent_attacks'].insert(0, enriched_data)
            network_stats['recent_attacks'] = network_stats['recent_attacks'][:100]  # Keep last 100
        
        # Calculate packets per second
        current_time = time.time()
        if current_time - network_stats['last_packet_time'] > 1:
            network_stats['packets_per_sec'] = network_stats['total_packets']
            network_stats['last_packet_time'] = current_time
        
        # 🔥 LOG TO FIREBASE (non-blocking)
        firebase_logger.log_packet(enriched_data)
        
        # Emit to frontend
        socketio.emit("network_logs", enriched_data)
        socketio.emit("stats_update", {
            'total_packets': network_stats['total_packets'],
            'attack_count': network_stats['attack_count'],
            'packets_per_sec': network_stats['packets_per_sec'],
            'active_sessions': len(network_stats['active_sessions']),
            'attack_distribution': dict(network_stats['attack_distribution'])
        })
        
        print(f"[{enriched_data['timestamp'].split('T')[1][:8]}] {data.get('src_ip')} → {data.get('dst_ip')} | "
              f"Type: {classification['attack_type']} | Confidence: {classification['confidence']}%")
        
    except Exception as e:
        print(f"Error processing packet: {e}")

def start_mqtt(socketio):
    def on_message(client, userdata, msg):
        try:
            print(f"📨 MQTT message received on topic {msg.topic}")
            data = json.loads(msg.payload.decode())
            print(f"📦 Processing packet: {data.get('src_ip')} → {data.get('dst_ip')}")
            process_packet_data(data, socketio)
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {msg.payload}")
        except Exception as e:
            print(f"Error processing message: {e}")

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print(f"✅ MQTT Connected successfully")
            client.subscribe("nids/unique123/live_packets")
            print(f"✅ Subscribed to nids/unique123/live_packets")
        else:
            print(f"❌ MQTT Connection failed with code {rc}")

    client = mqtt.Client()
    client.on_message = on_message
    client.on_connect = on_connect

    def try_connect():
        for attempt in range(1, 6):
            try:
                print(f"🔗 MQTT connect attempt {attempt}/5 to broker.hivemq.com:1883...")
                client.connect("broker.hivemq.com", 1883, 60)
                client.loop_start()
                print(f"✅ MQTT loop started")
                return
            except Exception as e:
                print(f"❌ MQTT connect attempt {attempt} failed: {e}")
                time.sleep(5)
        print("❌ MQTT: all connect attempts failed — continuing without MQTT")

    threading.Thread(target=try_connect, daemon=True).start()

def get_stats():
    """Return current network statistics"""
    return {
        'total_packets': network_stats['total_packets'],
        'attack_count': network_stats['attack_count'],
        'packets_per_sec': network_stats['packets_per_sec'],
        'active_sessions': len(network_stats['active_sessions']),
        'attack_distribution': dict(network_stats['attack_distribution']),
        'recent_attacks': network_stats['recent_attacks']
    }

def reset_stats():
    """Reset all statistics"""
    global network_stats
    network_stats = {
        'total_packets': 0,
        'attack_count': 0,
        'packets_per_sec': 0,
        'active_sessions': set(),
        'attack_distribution': defaultdict(int),
        'recent_attacks': [],
        'last_packet_time': time.time()
    }
