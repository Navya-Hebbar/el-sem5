#!/usr/bin/env python3
"""
Firebase Connection Tester
Run this to verify Firebase is properly configured
"""

import sys
import json
from datetime import datetime
from pathlib import Path

def test_firebase_connection():
    """Test Firebase connection and basic operations"""
    
    print("\n" + "="*60)
    print("🔥 FIREBASE CONNECTION TEST")
    print("="*60 + "\n")
    
    # Check credentials file
    cred_path = Path("serviceAccountKey.json")
    if not cred_path.exists():
        print("❌ ERROR: serviceAccountKey.json not found in backend/")
        print("   Please save your Firebase service account key there first.")
        return False
    
    print("✅ serviceAccountKey.json found")
    
    # Validate JSON
    try:
        with open(cred_path) as f:
            creds = json.load(f)
        print("✅ JSON credentials valid")
        print(f"   Project ID: {creds.get('project_id', 'Unknown')}")
    except json.JSONDecodeError:
        print("❌ ERROR: serviceAccountKey.json is not valid JSON")
        return False
    
    # Try to import Firebase
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        print("✅ Firebase admin SDK installed")
    except ImportError:
        print("❌ ERROR: firebase-admin not installed")
        print("   Run: pip install firebase-admin==6.2.0")
        return False
    
    # Try to initialize
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(str(cred_path))
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"❌ ERROR initializing Firebase: {e}")
        return False
    
    # Try a test write
    try:
        test_doc = {
            'test': True,
            'timestamp': datetime.now().isoformat(),
            'message': 'Test log from Firebase setup script'
        }
        db.collection('_test').add(test_doc)
        print("✅ Test write to Firestore successful")
    except Exception as e:
        print(f"❌ ERROR writing to Firestore: {e}")
        return False
    
    # Try a test read
    try:
        docs = list(db.collection('_test').stream())
        print(f"✅ Test read from Firestore successful ({len(docs)} test docs)")
    except Exception as e:
        print(f"❌ ERROR reading from Firestore: {e}")
        return False
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED - Firebase is ready!")
    print("="*60 + "\n")
    print("You can now run:")
    print("  python app.py")
    print("\nAll packet logs will be sent to Firebase in real-time! 🚀\n")
    
    return True


if __name__ == "__main__":
    success = test_firebase_connection()
    sys.exit(0 if success else 1)
