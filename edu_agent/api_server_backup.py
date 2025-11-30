"""
Backend API Server for Educational AI Agent
Connects: React Frontend <-> LM Studio + Excel Dataset
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import requests
import os

app = Flask(__name__)
CORS(app)  # Allow React frontend to connect

# Configuration
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
DATASET_PATH = "data/advanced_edu_dataset.xlsx"

# Load dataset on startup
print("Loading dataset...")
try:
    df = pd.read_excel(DATASET_PATH)
    print(f"✅ Loaded {len(df)} Q&A pairs from dataset")
    print(f"Columns: {df.columns.tolist()}")
except Exception as e:
    print(f"❌ Error loading dataset: {e}")
    df = pd.DataFrame()

def search_dataset(query, subject=None, top_k=3):
    """
    Search the dataset for relevant Q&A pairs (RAG)
    """
    if df.empty:
        return []
    
    # 1. Identify Columns (Case Insensitive)
    cols = {c.lower(): c for c in df.columns}
    q_col = cols.get('question', df.columns[1] if len(df.columns) > 1 else df.columns[0])
    a_col = cols.get('answer', df.columns[2] if len(df.columns) > 2 else df.columns[1])
    s_col = cols.get('subject', None)

    # 2. Filter by Subject (if exists)
    search_df = df.copy()
    if subject and s_col:
        # Fuzzy subject matching
        search_df = search_df[search_df[s_col].astype(str).str.lower().str.contains(subject.lower(), na=False)]
    
    # 3. Search Logic (Keyword Overlap)
    query_words = set(query.lower().split())
    
    def calculate_score(text):
        text = str(text).lower()
        # Count how many query words appear in the question
        score = sum(2 for word in query_words if word in text) 
        # Bonus for exact phrase match
        if query.lower() in text:
            score += 5
        return score

    search_df['score'] = search_df[q_col].apply(calculate_score)
    
    # 4. Get Best Matches
    results = search_df.nlargest(top_k, 'score')
    results = results[results['score'] > 0]  # Must have at least some match
    
    return [
        {
            'question': row[q_col],
            'answer': row[a_col],
            'score': row['score']
        }
        for _, row in results.iterrows()
    ]

def get_model_id():
    """
    Get the ID of the currently loaded model in LM Studio
    """
    try:
        response = requests.get("http://localhost:1234/v1/models", timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data['data']:
                return data['data'][0]['id']
    except:
        pass
    return "llama-3.2-1b-instruct-uncensored"  # Fallback

def query_lm_studio(messages):
    """
    Send query to LM Studio
    """
    model_id = get_model_id()
    print(f"🤖 Using Model: {model_id}")

    try:
        response = requests.post(
            LM_STUDIO_URL,
            json={
                "model": model_id,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2500
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return f"Error from LM Studio: {response.status_code} - {response.text}"
    except requests.exceptions.ConnectionError:
        return "❌ Cannot connect to LM Studio. Make sure it's running on port 1234."
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    """
    data = request.json
    user_message = data.get('message', '')
    subject = data.get('subject', None)
    
    # Step 1: Search dataset (RAG)
    relevant_qa = search_dataset(user_message, subject)
    
    # Step 2: Build Prompt
    if relevant_qa:
        # STRICT MODE: Found a match in dataset
        context_str = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in relevant_qa])
        
        messages = [
            {"role": "system", "content": "You are a helpful tutor. You have access to a specific Knowledge Base. \nIMPORTANT: If the user's question matches the Knowledge Base, you MUST use the provided Answer. Do not make up new facts."},
            {"role": "user", "content": f"Knowledge Base:\n{context_str}\n\nUser Question: {user_message}\n\nAnswer the user's question using the Knowledge Base above."}
        ]
        source = "Knowledge Base + LM Studio"
    else:
        # GENERAL MODE: No match found
        messages = [
            {"role": "system", "content": f"You are a helpful educational tutor. The subject is {subject or 'General'}. Be concise and accurate."},
            {"role": "user", "content": user_message}
        ]
        source = "LM Studio"
    
    # Step 3: Get response
    ai_response = query_lm_studio(messages)
    
    return jsonify({
        'response': ai_response,
        'source': source,
        'relevant_examples': len(relevant_qa)
    })

@app.route('/api/learn', methods=['POST'])
def learn():
    """
    Endpoint to add new Q&A to the dataset
    """
    global df
    data = request.json
    question = data.get('question')
    answer = data.get('answer')
    subject = data.get('subject', 'General')
    
    if not question or not answer:
        return jsonify({'error': 'Question and Answer are required'}), 400
        
    try:
        # Create new row
        new_data = {
            'ID': len(df) + 1 if not df.empty else 1,
            'Question': question,
            'Answer': answer,
            'Subject': subject
        }
        
        # Append to DataFrame
        new_row = pd.DataFrame([new_data])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save to Excel
        # We use 'mode='a'' if we want to append, but pandas to_excel overwrites.
        # So we just write the updated df back to file.
        df.to_excel(DATASET_PATH, index=False)
        
        print(f"✅ Learned new fact: {question[:30]}...")
        
        return jsonify({
            'success': True, 
            'message': 'Successfully added to Knowledge Base!',
            'total_items': len(df)
        })
    except Exception as e:
        print(f"❌ Error saving to dataset: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """
    Check if backend and LM Studio are working
    """
    lm_status = "connected"
    try:
        test_response = requests.get("http://localhost:1234/v1/models", timeout=2)
        if test_response.status_code != 200:
            lm_status = "error"
    except:
        lm_status = "disconnected"
    
    return jsonify({
        'backend': 'running',
        'lm_studio': lm_status,
        'dataset_loaded': not df.empty,
        'dataset_size': len(df) if not df.empty else 0
    })

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """
    Get available subjects from dataset
    """
    if df.empty or 'subject' not in df.columns:
        return jsonify(['mathematics', 'physics', 'chemistry', 'english'])
    
    subjects = df['subject'].unique().tolist()
    return jsonify(subjects)

import random

@app.route('/api/generate_quiz', methods=['POST'])
def generate_quiz():
    """
    Generate a quiz based on a topic using LM Studio
    """
    data = request.json
    topic = data.get('topic', 'General Knowledge')
    num_questions = int(data.get('num_questions', 5))
        # Fuzzy subject matching
        search_df = search_df[search_df[s_col].astype(str).str.lower().str.contains(subject.lower(), na=False)]
    
    # 3. Search Logic (Keyword Overlap)
    query_words = set(query.lower().split())
    
    def calculate_score(text):
        text = str(text).lower()
        # Count how many query words appear in the question
        score = sum(2 for word in query_words if word in text) 
        # Bonus for exact phrase match
        if query.lower() in text:
            score += 5
        return score

    search_df['score'] = search_df[q_col].apply(calculate_score)
    
    # 4. Get Best Matches
    results = search_df.nlargest(top_k, 'score')
    results = results[results['score'] > 0]  # Must have at least some match
    
    return [
        {
            'question': row[q_col],
            'answer': row[a_col],
            'score': row['score']
        }
        for _, row in results.iterrows()
    ]

def get_model_id():
    """
    Get the ID of the currently loaded model in LM Studio
    """
    try:
        response = requests.get("http://localhost:1234/v1/models", timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data['data']:
                return data['data'][0]['id']
    except:
        pass
    return "llama-3.2-1b-instruct-uncensored"  # Fallback

def query_lm_studio(messages):
    """
    Send query to LM Studio
    """
    model_id = get_model_id()
    print(f"🤖 Using Model: {model_id}")

    try:
        response = requests.post(
            LM_STUDIO_URL,
            json={
                "model": model_id,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2500
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return f"Error from LM Studio: {response.status_code} - {response.text}"
    except requests.exceptions.ConnectionError:
        return "❌ Cannot connect to LM Studio. Make sure it's running on port 1234."
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    """
    data = request.json
    user_message = data.get('message', '')
    subject = data.get('subject', None)
    
    # Step 1: Search dataset (RAG)
    relevant_qa = search_dataset(user_message, subject)
    
    # Step 2: Build Prompt
    if relevant_qa:
        # STRICT MODE: Found a match in dataset
        context_str = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in relevant_qa])
        
        messages = [
            {"role": "system", "content": "You are a helpful tutor. You have access to a specific Knowledge Base. \nIMPORTANT: If the user's question matches the Knowledge Base, you MUST use the provided Answer. Do not make up new facts."},
            {"role": "user", "content": f"Knowledge Base:\n{context_str}\n\nUser Question: {user_message}\n\nAnswer the user's question using the Knowledge Base above."}
        ]
        source = "Knowledge Base + LM Studio"
    else:
        # GENERAL MODE: No match found
        messages = [
            {"role": "system", "content": f"You are a helpful educational tutor. The subject is {subject or 'General'}. Be concise and accurate."},
            {"role": "user", "content": user_message}
        ]
        source = "LM Studio"
    
    # Step 3: Get response
    ai_response = query_lm_studio(messages)
    
    return jsonify({
        'response': ai_response,
        'source': source,
        'relevant_examples': len(relevant_qa)
    })

@app.route('/api/learn', methods=['POST'])
def learn():
    """
    Endpoint to add new Q&A to the dataset
    """
    global df
    data = request.json
    question = data.get('question')
    answer = data.get('answer')
    subject = data.get('subject', 'General')
    
    if not question or not answer:
        return jsonify({'error': 'Question and Answer are required'}), 400
        
    try:
        # Create new row
        new_data = {
            'ID': len(df) + 1 if not df.empty else 1,
            'Question': question,
            'Answer': answer,
            'Subject': subject
        }
        
        # Append to DataFrame
        new_row = pd.DataFrame([new_data])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save to Excel
        # We use 'mode='a'' if we want to append, but pandas to_excel overwrites.
        # So we just write the updated df back to file.
        df.to_excel(DATASET_PATH, index=False)
        
        print(f"✅ Learned new fact: {question[:30]}...")
        
        return jsonify({
            'success': True, 
            'message': 'Successfully added to Knowledge Base!',
            'total_items': len(df)
        })
    except Exception as e:
        print(f"❌ Error saving to dataset: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """
    Check if backend and LM Studio are working
    """
    lm_status = "connected"
    try:
        test_response = requests.get("http://localhost:1234/v1/models", timeout=2)
        if test_response.status_code != 200:
            lm_status = "error"
    except:
        lm_status = "disconnected"
    
    return jsonify({
        'backend': 'running',
        'lm_studio': lm_status,
        'dataset_loaded': not df.empty,
        'dataset_size': len(df) if not df.empty else 0
    })

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """
    Get available subjects from dataset
    """
    if df.empty or 'subject' not in df.columns:
        return jsonify(['mathematics', 'physics', 'chemistry', 'english'])
    
    subjects = df['subject'].unique().tolist()
    return jsonify(subjects)

import random

@app.route('/api/generate_quiz', methods=['POST'])
def generate_quiz():
    """
    Generate a quiz based on a topic using LM Studio
    """
    data = request.json
    topic = data.get('topic', 'General Knowledge')
    num_questions = int(data.get('num_questions', 5))
    
    print(f"📝 Generating quiz for topic: {topic} ({num_questions} questions)")
    
    # 1. Search dataset for relevant content to base the quiz on
    relevant_qa = search_dataset(topic, top_k=num_questions)
    
    context_str = "\n".join([f"Fact: {qa['question']} - {qa['answer']}" for qa in relevant_qa])
    
    # 2. Build Prompt - SIMPLIFIED for small models
    system_prompt = f"""Generate {num_questions} quiz questions about {topic}. Return ONLY a JSON array.

Format:
[{"question":"...", "options":["A","B","C","D"], "correct":0, "explanation":"..."}}]

Rules:
- correct is 0-3
- NO markdown
- Just JSON"""
    
    user_prompt = f"Create {num_questions} questions about: {topic}"
    if context_str:
        user_prompt += f"\n\nFacts:\n{context_str}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    # 3. Query LM Studio
    response_text = query_lm_studio(messages)
    
    print(f"🤖 LM Studio Response (first 500 chars):\n{response_text[:500]}")
    
    # 4. Parse JSON
    import json
    import re
    
    try:
        # Clean up potential markdown code blocks
        cleaned_text = re.sub(r'```json\s*|\s*```', '', response_text).strip()
        # Find the first [ and last ]
        start = cleaned_text.find('[')
        end = cleaned_text.rfind(']') + 1
        if start != -1 and end != -1:
            json_str = cleaned_text[start:end]
            print(f"📋 Extracted JSON:\n{json_str[:300]}...")
            quiz_data = json.loads(json_str)
            
            # 5. Shuffle Options
            for q in quiz_data:
                if 'options' in q and 'correct' in q:
                    options = q['options']
                    if 0 <= q['correct'] < len(options):
                        correct_option = options[q['correct']]
                        random.shuffle(options)
                        q['correct'] = options.index(correct_option)
            
            print(f"✅ Successfully generated {len(quiz_data)} questions")
            return jsonify(quiz_data)
        else:
            raise ValueError("No JSON array found in response")
            
    except Exception as e:
        print(f"❌ Error parsing quiz JSON: {e}")
        print(f"Raw response: {response_text}")
        # Fallback questions if generation fails
        fallback_quiz = [
            {
                "question": f"What is a key concept in {topic}?",
                "options": ["Concept A", "Concept B", "Concept C", "Concept D"],
                "correct": 0,
                "explanation": "This is a fallback question because the AI failed to generate valid JSON."
            }
        ]
        return jsonify(fallback_quiz)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Educational AI Backend Server")
    print("="*60)
    print(f"Backend API: http://localhost:5000")
    print(f"LM Studio: http://localhost:1234")
    print(f"Dataset: {DATASET_PATH}")
    print("="*60 + "\n")
    
    # Run on 0.0.0.0 to ensure it's accessible
    app.run(host='0.0.0.0', port=5000, debug=True)
