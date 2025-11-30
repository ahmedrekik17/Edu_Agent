import requests

print("Testing LM Studio connection...")

try:
    response = requests.post(
        "http://localhost:1234/v1/chat/completions",
        json={
            "model": "local-model",
            "messages": [
                {"role": "system", "content": "You are a helpful educational tutor."},
                {"role": "user", "content": "Say hello and introduce yourself as an AI tutor."}
            ],
            "temperature": 0.7
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS! LM Studio is working!")
        print(f"\nResponse: {result['choices'][0]['message']['content']}")
    else:
        print(f"\n❌ Error: Status code {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Cannot connect to LM Studio")
    print("\nMake sure:")
    print("1. LM Studio is open")
    print("2. A model is loaded")
    print("3. The Local Server is started (green button)")
    print("4. Server is running on port 1234")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
