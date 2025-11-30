"""
Test script to verify quiz generation functionality
Tests various scenarios including topics with/without dataset coverage
"""
import requests
import json

API_URL = "http://localhost:5000/api/generate_quiz"

def test_quiz(topic, num_questions=5):
    """Test quiz generation for a given topic"""
    print(f"\n{'='*60}")
    print(f"Testing: '{topic}' ({num_questions} questions)")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            API_URL,
            json={"topic": topic, "num_questions": num_questions},
            timeout=30
        )
        
        if response.status_code == 200:
            quiz_data = response.json()
            print(f"✅ SUCCESS: Got {len(quiz_data)} questions")
            
            # Display each question
            for i, q in enumerate(quiz_data, 1):
                print(f"\n--- Question {i} ---")
                print(f"Q: {q['question']}")
                print(f"Options: {q['options']}")
                print(f"Correct: {q['options'][q['correct']]} (index {q['correct']})")
                print(f"Explanation: {q['explanation'][:80]}...")
            
            return True
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Starting Quiz Generation Tests")
    print("="*60)
    
    # Test 1: Topic likely in dataset (World War II)
    print("\n📝 TEST 1: Topic with good dataset coverage")
    test_quiz("World War II", 3)
    
    # Test 2: Topic unlikely in dataset (Quantum Computing)
    print("\n📝 TEST 2: Topic with limited/no dataset coverage")
    test_quiz("Quantum Computing", 3)
    
    # Test 3: Simple topic
    print("\n📝 TEST 3: Simple topic")
    test_quiz("Python programming", 3)
    
    # Test 4: Edge case - topic with extra words
    print("\n📝 TEST 4: Topic with extra words (should be cleaned)")
    test_quiz("5 questions about Ancient Rome quiz", 5)
    
    print("\n" + "="*60)
    print("🏁 Testing Complete!")
    print("="*60)
