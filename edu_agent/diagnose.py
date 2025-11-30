import requests
import sys
import time

print("🔍 DIAGNOSTIC TOOL - Educational AI Agent")
print("="*50)

# 1. Test Backend
print("\n[1/3] Testing Backend API (Port 5000)...")
try:
    # Increased timeout to 10s to allow for model loading latency
    response = requests.get("http://localhost:5000/api/health", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print("✅ Backend is RUNNING")
        print(f"   - Dataset Loaded: {data.get('dataset_loaded')}")
        print(f"   - Dataset Size: {data.get('dataset_size')}")
        
        if data.get('lm_studio') == 'connected':
            print("   - LM Studio Status: ✅ CONNECTED")
        else:
            print("   - LM Studio Status: ❌ DISCONNECTED (Backend can't see LM Studio)")
    else:
        print(f"❌ Backend returned error: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ Backend is NOT RUNNING or blocked.")
    print("   -> Run 'python api_server.py' in a new terminal.")

# 2. Test LM Studio Direct
print("\n[2/3] Testing LM Studio Direct (Port 1234)...")
try:
    response = requests.get("http://localhost:1234/v1/models", timeout=2)
    if response.status_code == 200:
        print("✅ LM Studio is RUNNING")
    else:
        print(f"❌ LM Studio returned error: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ LM Studio is NOT RUNNING.")
    print("   -> Open LM Studio -> Local Server -> Click 'Start Server'")

# 3. Test Chat Endpoint
print("\n[3/3] Testing Full Chat Flow...")
try:
    response = requests.post(
        "http://localhost:5000/api/chat",
        json={"message": "Hello", "subject": "general"},
        timeout=5
    )
    if response.status_code == 200:
        print("✅ Chat API is WORKING!")
        print(f"   Response: {response.json().get('response')[:50]}...")
    else:
        print(f"❌ Chat API failed: {response.status_code}")
except:
    print("❌ Could not connect to Chat API")

print("\n" + "="*50)
