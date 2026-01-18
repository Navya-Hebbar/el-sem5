import streamlit as st
import paho.mqtt.client as mqtt
import json
import pandas as pd
from datetime import datetime
import queue
import time
import logging
import socket

# Suppress MQTT threading warnings
logging.getLogger("paho.mqtt.client").setLevel(logging.CRITICAL)
logging.disable(logging.CRITICAL)

# Module-level queue for MQTT (thread-safe, no Streamlit access)
mqtt_message_queue = queue.Queue()

def get_local_ip():
    """Finds the local IP address of this machine"""
    try:
        # This doesn't actually connect to the internet, but finds the local interface
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

# Page configuration
st.set_page_config(
    page_title="MQTT Packet Sender",
    page_icon="📡",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Custom CSS for professional look
st.markdown("""
<style>
    .main {
        background-color: #0e1117;
    }
    .stButton>button {
        width: 100%;
        background-color: #00D4AA;
        color: white;
        font-weight: bold;
        border-radius: 8px;
        padding: 12px;
        border: none;
        transition: all 0.3s;
    }
    .stButton>button:hover {
        background-color: #00A87E;
        box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
    }
    .success-box {
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        text-align: center;
        color: white;
        margin: 20px 0;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'mqtt_client' not in st.session_state:
    st.session_state.mqtt_client = None
    st.session_state.mqtt_connected = False
    st.session_state.sent_count = 0
    st.session_state.last_packet_type = None
    st.session_state.local_ip = get_local_ip()

# MQTT Callbacks - NO Streamlit operations
def on_connect(client, userdata, flags, rc):
    """Only subscribe, don't touch st.session_state"""
    if rc == 0:
        client.subscribe("nids/unique123/live_packets")

def on_disconnect(client, userdata, rc):
    """No Streamlit operations"""
    pass

def on_message(client, userdata, msg):
    """Only queue message, no Streamlit access"""
    try:
        data = json.loads(msg.payload.decode())
        data['timestamp'] = datetime.now().isoformat()
        mqtt_message_queue.put(data)
    except Exception:
        pass

def connect_mqtt(broker, port, target_ip):
    """Connect to MQTT broker"""
    try:
        # Create MQTT client with callback API version
        try:
            # For paho-mqtt >= 2.0
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, f"streamlit-sender-{int(time.time())}")
        except AttributeError:
            # For paho-mqtt < 2.0
            client = mqtt.Client(f"streamlit-sender-{int(time.time())}")
        
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect
        client.on_message = on_message
        
        client.connect(broker, port, keepalive=60)
        client.loop_start()
        
        st.session_state.mqtt_client = client
        st.session_state.mqtt_connected = True
        st.session_state.target_ip = target_ip
        return True
    except Exception as e:
        st.error(f"❌ Connection failed: {str(e)}")
        st.session_state.mqtt_connected = False
        return False

def disconnect_mqtt():
    """Disconnect from MQTT broker"""
    if st.session_state.mqtt_client:
        st.session_state.mqtt_client.loop_stop()
        st.session_state.mqtt_client.disconnect()
        st.session_state.mqtt_client = None
        st.session_state.mqtt_connected = False

# Header
st.markdown("""
<div style="text-align: center; padding: 20px 0;">
    <h1 style="color: #00D4AA; font-size: 3em; margin: 0;">MQTT Packet Sender</h1>
    <p style="color: #888; font-size: 1.2em; margin-top: 10px;">Professional KDD Dataset Transmission Tool</p>
</div>
""", unsafe_allow_html=True)

st.markdown("---")

# Connection Section
col1, col2, col3 = st.columns([2, 2, 1])

with col1:
    mqtt_broker = st.text_input("MQTT Broker", value="broker.hivemq.com", key="broker")

with col2:
    mqtt_port = st.number_input("Port", value=1883, min_value=1, max_value=65535, key="port")

with col3:
    st.write("")
    st.write("")
    if st.session_state.mqtt_connected:
        if st.button("Disconnect"):
            disconnect_mqtt()
            st.rerun()
    else:
        if st.button("Connect"):
            with st.spinner("Connecting..."):
                if connect_mqtt(mqtt_broker, mqtt_port, "127.0.0.1"):
                    st.success("Connected!")
                    time.sleep(0.5)
                    st.rerun()

# Target IP Configuration
if st.session_state.mqtt_connected:
    st.markdown("### Target System Configuration")
    col1, col2 = st.columns(2)
    
    with col1:
        st.text_input("Target System IP", value="127.0.0.1", key="target_ip",
                                 help="IP address of the system running the website dashboard")
    
    with col2:
        st.write("")
        st.write("")
        st.info(f"📍 Your IP: `{st.session_state.local_ip}`")

# Connection Status
if st.session_state.mqtt_connected:
    st.markdown("""
    <div style="padding: 15px; background: linear-gradient(90deg, #00D4AA 0%, #00A87E 100%); 
         border-radius: 10px; text-align: center; color: white; font-weight: bold; margin: 20px 0;">
        CONNECTED TO MQTT BROKER
    </div>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <div style="padding: 15px; background: linear-gradient(90deg, #FF6B6B 0%, #C92A2A 100%); 
         border-radius: 10px; text-align: center; color: white; font-weight: bold; margin: 20px 0;">
        NOT CONNECTED - Please connect to MQTT broker first
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# Load KDD dataset
KDD_COLUMNS = [
    'duration','protocol_type','service','flag','src_bytes','dst_bytes','land',
    'wrong_fragment','urgent','hot','num_failed_logins','logged_in',
    'num_compromised','root_shell','su_attempted','num_root',
    'num_file_creations','num_shells','num_access_files','num_outbound_cmds',
    'is_host_login','is_guest_login','count','srv_count','serror_rate',
    'srv_serror_rate','rerror_rate','srv_rerror_rate','same_srv_rate',
    'diff_srv_rate','srv_diff_host_rate','dst_host_count','dst_host_srv_count',
    'dst_host_same_srv_rate','dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate','dst_host_srv_diff_host_rate',
    'dst_host_serror_rate','dst_host_srv_serror_rate','dst_host_rerror_rate',
    'dst_host_srv_rerror_rate','label','difficulty'
]

@st.cache_data
def load_kdd_data():
    """Load KDD test dataset from file or embedded source"""
    import os
    
    # Try multiple possible file paths
    possible_paths = [
        'KDDTest-21.txt',  # Local/Streamlit Cloud root
        os.path.join(os.path.dirname(__file__), 'KDDTest-21.txt'),  # Same directory as script
        '../KDDTest-21.txt',  # Parent directory
    ]
    
    for file_path in possible_paths:
        if os.path.exists(file_path):
            try:
                st.info(f"✅ Loaded KDD dataset from {file_path}")
                df = pd.read_csv(file_path, header=None, names=KDD_COLUMNS)
                return df
            except Exception as e:
                st.warning(f"Could not load from {file_path}: {e}")
                continue
    
    # If file not found, create sample data for testing
    st.warning("⚠️ KDD dataset file not found. Using sample data.")
    sample_data = {
        'duration': [0, 0, 0, 0, 0],
        'protocol_type': ['tcp', 'tcp', 'udp', 'tcp', 'tcp'],
        'service': ['http', 'ftp', 'domain', 'http', 'ssh'],
        'flag': ['SF', 'S0', 'SF', 'SF', 'SF'],
        'src_bytes': [215.0, 12105.0, 0.0, 162.0, 521.0],
        'dst_bytes': [45076.0, 0.0, 0.0, 4528.0, 0.0],
        'land': [0, 0, 0, 0, 0],
        'wrong_fragment': [0, 0, 0, 0, 0],
        'urgent': [0, 0, 0, 0, 0],
        'hot': [0, 0, 0, 0, 0],
        'num_failed_logins': [0, 0, 0, 0, 0],
        'logged_in': [1, 0, 0, 1, 0],
        'num_compromised': [0, 0, 0, 0, 0],
        'root_shell': [0, 0, 0, 0, 0],
        'su_attempted': [0, 0, 0, 0, 0],
        'num_root': [0, 0, 0, 0, 0],
        'num_file_creations': [0, 0, 0, 0, 0],
        'num_shells': [0, 0, 0, 0, 0],
        'num_access_files': [0, 0, 0, 0, 0],
        'num_outbound_cmds': [0, 0, 0, 0, 0],
        'is_host_login': [0, 0, 0, 0, 0],
        'is_guest_login': [0, 0, 0, 0, 0],
        'count': [1.0, 13.0, 1.0, 4.0, 40.0],
        'srv_count': [1.0, 1.0, 1.0, 1.0, 1.0],
        'serror_rate': [0.0, 0.77, 0.0, 0.0, 0.0],
        'srv_serror_rate': [0.0, 1.0, 0.0, 0.0, 0.0],
        'rerror_rate': [0.0, 0.0, 0.0, 0.0, 0.0],
        'srv_rerror_rate': [0.0, 0.0, 0.0, 0.0, 0.0],
        'same_srv_rate': [0.0, 0.0, 0.0, 0.25, 0.1],
        'diff_srv_rate': [0.0, 0.0, 0.0, 0.75, 0.9],
        'srv_diff_host_rate': [0.0, 0.0, 0.0, 0.75, 0.1],
        'dst_host_count': [8.0, 1.0, 1.0, 9.0, 8.0],
        'dst_host_srv_count': [8.0, 1.0, 1.0, 9.0, 8.0],
        'dst_host_same_srv_rate': [1.0, 0.0, 0.0, 1.0, 1.0],
        'dst_host_diff_srv_rate': [0.0, 0.0, 0.0, 0.0, 0.0],
        'dst_host_same_src_port_rate': [0.25, 0.0, 0.0, 0.78, 0.0],
        'dst_host_srv_diff_host_rate': [0.0, 0.0, 0.0, 0.0, 0.0],
        'dst_host_serror_rate': [0.0, 1.0, 0.0, 0.0, 0.0],
        'dst_host_srv_serror_rate': [0.0, 1.0, 0.0, 0.0, 0.0],
        'dst_host_rerror_rate': [0.0, 0.0, 0.0, 0.0, 0.0],
        'label': ['normal', 'neptune', 'normal', 'normal', 'normal'],
        'difficulty': [0, 0, 0, 0, 0]
    }
    df = pd.DataFrame(sample_data)
    return df

kdd_df = load_kdd_data()

# Define attack categories
DOS_ATTACKS = ['back', 'land', 'neptune', 'pod', 'smurf', 'teardrop', 'mailbomb', 'apache2']
PROBE_ATTACKS = ['satan', 'ipsweep', 'nmap', 'portsweep', 'mscan', 'saint']
R2L_ATTACKS = ['guess_passwd', 'ftp_write', 'imap', 'phf', 'httptunnel', 'warezmaster', 'warezclient']
U2R_ATTACKS = ['buffer_overflow', 'loadmodule', 'perl', 'rootkit', 'sqlattack', 'xterm']

if kdd_df is not None:
    st.markdown("### KDD Dataset Configuration")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Demo options matching demo_dataset_runner.py
        demo_options = [
            "1. Run all attacks (diverse demo)",
            "2. Show DoS attacks (neptune, smurf, etc.)",
            "3. Show Probe attacks (nmap, ipsweep, etc.)",
            "4. Show R2L attacks (httptunnel, ftp_write, etc.)",
            "5. Show U2R attacks (buffer_overflow, etc.)",
            "6. Show only normal traffic"
        ]
        
        packet_filter = st.selectbox("Select Demo Type", demo_options, key="demo_type")
    
    with col2:
        packet_count = st.number_input("Number of Packets", min_value=1, max_value=1000, value=50, key="count")
    
    # Send button
    if st.button("SEND PACKETS", use_container_width=True):
        if st.session_state.mqtt_connected and st.session_state.mqtt_client:
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Filter dataset based on selection
            if packet_filter.startswith("1."):
                # All attacks - diverse demo
                filtered_df = kdd_df.sample(n=min(packet_count, len(kdd_df)))
            elif packet_filter.startswith("2."):
                # DoS attacks
                filtered_df = kdd_df[kdd_df['label'].isin(DOS_ATTACKS)]
            elif packet_filter.startswith("3."):
                # Probe attacks
                filtered_df = kdd_df[kdd_df['label'].isin(PROBE_ATTACKS)]
            elif packet_filter.startswith("4."):
                # R2L attacks
                filtered_df = kdd_df[kdd_df['label'].isin(R2L_ATTACKS)]
            elif packet_filter.startswith("5."):
                # U2R attacks
                filtered_df = kdd_df[kdd_df['label'].isin(U2R_ATTACKS)]
            elif packet_filter.startswith("6."):
                # Normal only
                filtered_df = kdd_df[kdd_df['label'] == 'normal']
            else:
                filtered_df = kdd_df
            
            if len(filtered_df) == 0:
                st.error("No data found for this filter!")
            else:
                # Sample packets
                sample_df = filtered_df.sample(n=min(packet_count, len(filtered_df)))
                
                sent_count = 0
                attack_count = 0
                
                for idx, row in sample_df.iterrows():
                    packet = {
                        "src_ip": st.session_state.local_ip,
                        "dst_ip": st.session_state.target_ip,
                        "protocol": row['protocol_type'],
                        "service": row['service'],
                        "flag": row['flag'],
                        "src_bytes": float(row['src_bytes']),
                        "dst_bytes": float(row['dst_bytes']),
                        "length": float(row['src_bytes']) + float(row['dst_bytes']),
                        "count": float(row['count']),
                        "srv_count": float(row['srv_count']),
                        "serror_rate": float(row['serror_rate']),
                        "srv_serror_rate": float(row['srv_serror_rate']),
                        "rerror_rate": float(row['rerror_rate']),
                        "same_srv_rate": float(row['same_srv_rate']),
                        "diff_srv_rate": float(row['diff_srv_rate']),
                        "dst_host_count": float(row['dst_host_count']),
                        "dst_host_srv_count": float(row['dst_host_srv_count']),
                        "dst_host_same_srv_rate": float(row['dst_host_same_srv_rate']),
                        "dst_host_diff_srv_rate": float(row['dst_host_diff_srv_rate']),
                        "dst_host_same_src_port_rate": float(row['dst_host_same_src_port_rate']),
                        "dst_host_srv_diff_host_rate": float(row['dst_host_srv_diff_host_rate']),
                        "dst_host_serror_rate": float(row['dst_host_serror_rate']),
                        "dst_host_srv_serror_rate": float(row['dst_host_srv_serror_rate']),
                        "dst_host_rerror_rate": float(row['dst_host_rerror_rate']),
                        "dst_host_srv_rerror_rate": float(row['dst_host_srv_rerror_rate']),
                        "label": row['label'],
                        "client": "StreamlitSender",
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    try:
                        st.session_state.mqtt_client.publish(
                            "nids/unique123/live_packets",
                            json.dumps(packet),
                            qos=1
                        )
                        sent_count += 1
                        
                        if row['label'] != 'normal':
                            attack_count += 1
                        
                        progress = sent_count / len(sample_df)
                        progress_bar.progress(progress)
                        status_text.text(f"Sending: {sent_count}/{len(sample_df)} packets...")
                        time.sleep(0.05)
                    except Exception as e:
                        st.error(f"Error: {e}")
                        break
                
                st.session_state.sent_count += sent_count
                st.session_state.last_packet_type = packet_filter
                
                st.markdown(f"""
                <div class="success-box">
                    <h2 style="margin: 0;">TRANSMISSION COMPLETE</h2>
                    <p style="font-size: 1.5em; margin: 10px 0;"><strong>{sent_count}</strong> Packets Sent Successfully</p>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.error("Please connect to MQTT broker first!")
    
    # Stats footer
    if st.session_state.sent_count > 0:
        st.markdown("---")
        st.markdown(f"""
        <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <p style="color: #888; margin: 0;">
                Session Total: <strong style="color: #00D4AA;">{st.session_state.sent_count}</strong> packets sent
            </p>
        </div>
        """, unsafe_allow_html=True)

else:
    st.error("Failed to load KDD dataset")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; font-size: 0.9em; padding: 20px;">
    <p>Network Intrusion Detection System | MQTT Data Transmission Tool</p>
</div>
""", unsafe_allow_html=True)
