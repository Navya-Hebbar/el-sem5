"""
Firebase Logger Module
Handles saving network logs to Firebase Firestore with separation of:
- Normal network logs (benign traffic)
- Anomaly network logs (detected attacks)
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import threading
import json
from pathlib import Path

# Global instance
_firebase_logger = None
_lock = threading.Lock()


class FirebaseLogger:
    """Singleton class for Firebase logging operations"""
    
    def __init__(self):
        """Initialize Firebase connection"""
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if credentials exist
            cred_path = Path("serviceAccountKey.json")
            if not cred_path.exists():
                print("⚠️  WARNING: serviceAccountKey.json not found - Firebase logging disabled")
                print("   Place your Firebase credentials at: backend/serviceAccountKey.json")
                return
            
            # Initialize Firebase if not already done
            if not firebase_admin._apps:
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK initialized")
            
            self.db = firestore.client()
            print("✅ Firebase Firestore connected")
            
        except Exception as e:
            print(f"⚠️  Firebase initialization warning: {e}")
            self.db = None
    
    def log_packet(self, enriched_data):
        """
        Log packet data to Firebase with separation of normal and anomaly logs
        
        Args:
            enriched_data: Dictionary containing packet info with classification results
        """
        if self.db is None:
            return
        
        try:
            is_attack = enriched_data.get('is_attack', False)
            
            # Prepare the log document (excluding duplicate ML features that are already in main fields)
            log_doc = {
                'timestamp': enriched_data.get('timestamp', datetime.now().isoformat()),
                'src_ip': enriched_data.get('src_ip', ''),
                'dst_ip': enriched_data.get('dst_ip', ''),
                'src_port': enriched_data.get('src_port', ''),
                'dst_port': enriched_data.get('dst_port', ''),
                'protocol': enriched_data.get('protocol', enriched_data.get('protocol_type', 'tcp')),
                'service': enriched_data.get('service', 'unknown'),
                'flag': enriched_data.get('flag', ''),
                
                # Classification results
                'attack_type': enriched_data.get('attack_type', 'normal'),
                'attack_category': enriched_data.get('attack_category', 'normal'),
                'is_attack': is_attack,
                
                # Traffic metrics (not duplicating from ml_features)
                'src_bytes': enriched_data.get('src_bytes', 0),
                'dst_bytes': enriched_data.get('dst_bytes', 0),
                'packet_count': enriched_data.get('packet_count', enriched_data.get('count', 1)),
            }
            
            # Determine collection based on attack status
            if is_attack:
                # Save to anomaly_network_logs collection
                collection_ref = self.db.collection('anomaly_network_logs')
                
            else:
                # Save to normal_network_logs collection
                collection_ref = self.db.collection('normal_network_logs')
                log_doc['log_type'] = 'benign_traffic'
            
            # Add common metadata
            log_doc['date'] = datetime.now().date().isoformat()  # For easy querying by date
            
            # Save asynchronously to avoid blocking
            threading.Thread(
                target=self._async_save,
                args=(collection_ref, log_doc, is_attack),
                daemon=True
            ).start()
            
        except Exception as e:
            print(f"❌ Error preparing packet log: {e}")
    
    def _async_save(self, collection_ref, log_doc, is_attack):
        """Asynchronously save document to Firestore"""
        try:
            doc_ref = collection_ref.document()
            doc_ref.set(log_doc)
            
            attack_str = "Anomaly" if is_attack else "Normal"
            print(f"✅ {attack_str} log saved: {log_doc['src_ip']} → {log_doc['dst_ip']}")
            
        except Exception as e:
            print(f"❌ Error saving to Firebase: {e}")
    
    def log_stats_update(self, stats_data):
        """Log statistics update to Firebase"""
        if self.db is None:
            return
        
        try:
            stats_doc = {
                'timestamp': datetime.now().isoformat(),
                'total_packets': stats_data.get('total_packets', 0),
                'attack_count': stats_data.get('attack_count', 0),
                'normal_count': stats_data.get('total_packets', 0) - stats_data.get('attack_count', 0),
                'packets_per_sec': stats_data.get('packets_per_sec', 0),
                'active_sessions': stats_data.get('active_sessions', 0),
                'attack_distribution': stats_data.get('attack_distribution', {}),
            }
            
            threading.Thread(
                target=self._async_save_stats,
                args=(stats_doc,),
                daemon=True
            ).start()
            
        except Exception as e:
            print(f"❌ Error preparing stats log: {e}")
    
    def _async_save_stats(self, stats_doc):
        """Asynchronously save statistics to Firestore"""
        try:
            self.db.collection('system_statistics').document(
                datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            ).set(stats_doc)
            print(f"✅ Stats update logged")
        except Exception as e:
            print(f"❌ Error saving stats to Firebase: {e}")


def get_firebase_logger():
    """Get or create the Firebase logger singleton"""
    global _firebase_logger
    
    if _firebase_logger is None:
        with _lock:
            if _firebase_logger is None:
                _firebase_logger = FirebaseLogger()
    
    return _firebase_logger
