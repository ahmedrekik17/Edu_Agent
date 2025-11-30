"""
Backend API Server for Educational AI Agent
Connects: React Frontend <-> LM Studio + Excel Dataset
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import requests
import os
import random
import json
import re
import PyPDF2
from io import BytesIO

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
    Prioritizes Gamma/Gemma models if available
    """
    try:
        response = requests.get("http://localhost:1234/v1/models", timeout=2)
        if response.status_code == 200:
            data = response.json()
            models = data.get('data', [])
            if models:
                # Prefer Gamma/Gemma models if available
                for m in models:
                    if 'gamma' in m['id'].lower() or 'gemma' in m['id'].lower():
                        return m['id']
                return models[0]['id']
    except:
        pass
    return "local-model"  # Fallback

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
            timeout=120  # Increased timeout for PDF analysis
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return f"Error from LM Studio: {response.status_code} - {response.text}"
    except requests.exceptions.Timeout:
        return "⏱️ Error: The AI model took too long to respond. Please try a smaller PDF or a faster model in LM Studio."
    except requests.exceptions.ConnectionError:
        return "❌ Cannot connect to LM Studio. Make sure it's running on port 1234."
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint with enhanced dataset filtering
    """
    data = request.json
    user_message = data.get('message', '')
    subject = data.get('subject', None)
    
    print(f"💬 Chat request: '{user_message}' (Subject: {subject})")
    
    # Step 1: Search dataset (RAG) - get more candidates
    relevant_qa = search_dataset(user_message, subject, top_k=10)
    
    # Step 2: FILTER - Only use dataset facts that are truly relevant
    valid_qa = []
    if relevant_qa:
        # Extract key words from user's question (ignore common words)
        query_words = set(word.lower() for word in user_message.split() if len(word) > 3)
        
        for qa in relevant_qa:
            qa_text = (qa['question'] + " " + qa['answer']).lower()
            # Check if the Q&A actually contains relevant keywords
            if any(word in qa_text for word in query_words):
                valid_qa.append(qa)
        
        print(f"📚 Found {len(relevant_qa)} initial matches, {len(valid_qa)} are truly relevant")
    
    # Step 3: Build Prompt based on what we found
    if valid_qa:
        # DATASET MODE: We have relevant information from the dataset
        context_str = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in valid_qa[:5]])  # Use top 5
        
        messages = [
            {"role": "system", "content": "You are a helpful tutor with access to a Knowledge Base. IMPORTANT: When the user's question matches information in the Knowledge Base, use that information in your answer. Be conversational and helpful."},
            {"role": "user", "content": f"Knowledge Base:\n{context_str}\n\nUser Question: {user_message}\n\nPlease answer the user's question. If the Knowledge Base has relevant information, use it. Otherwise, use your general knowledge."}
        ]
        source = f"📚 Dataset ({len(valid_qa)} facts) + AI"
    else:
        # GENERAL MODE: No relevant dataset info, use AI's general knowledge
        print(f"⚠️ No relevant dataset info found for: '{user_message}'")
        messages = [
            {"role": "system", "content": f"You are a helpful educational tutor specializing in {subject or 'general education'}. Provide clear, accurate, and concise explanations."},
            {"role": "user", "content": user_message}
        ]
        source = "🤖 AI General Knowledge"
    
    # Step 4: Get response from LM Studio
    ai_response = query_lm_studio(messages)
    
    print(f"✅ Response generated (Source: {source})")
    
    return jsonify({
        'response': ai_response,
        'source': source,
        'relevant_examples': len(valid_qa)
    })

@app.route('/api/learn', methods=['POST'])
def learn():
    """
    Add new knowledge to the dataset (Teach AI feature)
    """
    global df
    
    data = request.json
    question = data.get('question', '').strip()
    answer = data.get('answer', '').strip()
    subject = data.get('subject', 'general').strip()
    
    if not question or not answer:
        return jsonify({'error': 'Question and answer are required'}), 400
    
    print(f"📝 Learning new fact: Q: '{question[:50]}...' (Subject: {subject})")
    
    try:
        # Create new row
        new_row = pd.DataFrame([{
            'question': question,
            'answer': answer,
            'subject': subject
        }])
        
        # Append to dataframe
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save to Excel file
        df.to_excel(DATASET_PATH, index=False)
        
        print(f"✅ Successfully added to dataset. Total entries: {len(df)}")
        
        return jsonify({
            'success': True,
            'message': f'Added new knowledge about {subject}',
            'total_entries': len(df)
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

@app.route('/api/generate_quiz', methods=['POST'])
def generate_quiz():
    """
    Generate quiz using AI that learns from the dataset (RAG approach)
    """
    data = request.json
    raw_topic = data.get('topic', 'General Knowledge')
    num_questions = int(data.get('num_questions', 5))
    
    # AGGRESSIVE TOPIC CLEANING
    # Remove "quiz", "questions", "about", "with" from the end (repeatable)
    topic = re.sub(r'(?:\s+(?:with|about|for|on|quiz|questions?|in))+$', '', raw_topic, flags=re.IGNORECASE).strip()
    topic = re.sub(r'^(?:quiz|questions?|about|create|generate)\s+', '', topic, flags=re.IGNORECASE).strip()
    
    print(f"📝 Generating quiz for topic: {topic} (Raw: {raw_topic})")
    
    # 1. Search dataset for relevant knowledge (RAG)
    relevant_qa = search_dataset(topic, top_k=15)
    
    knowledge_context = ""
    
    # FILTER: Only use dataset facts if they actually contain the topic keywords
    valid_qa = []
    if relevant_qa:
        topic_words = set(topic.lower().split())
        for qa in relevant_qa:
            qa_text = (qa['question'] + " " + qa['answer']).lower()
            if any(word in qa_text for word in topic_words if len(word) > 2):
                valid_qa.append(qa)
    
    if not valid_qa:
        print(f"⚠️ No RELEVANT knowledge found in dataset for: {topic}")
        knowledge_context = f"IMPORTANT: I don't have specific data about '{topic}' in my files. Please generate questions based on your own general knowledge about '{topic}'."
        relevant_qa = []
    else:
        knowledge_context = "Here is the relevant information from my dataset:\n"
        for qa in valid_qa[:10]:
            knowledge_context += f"- {qa['question']}: {qa['answer']}\n"
        relevant_qa = valid_qa
            
    print(f"📚 Found {len(relevant_qa)} relevant facts in dataset")
    
    # 2. Ask AI to generate ALL questions at once in SIMPLEST format
    prompt = f"""You are a quiz creator. Based on this knowledge, create {num_questions} quiz questions about {topic}.

{knowledge_context}

For EACH question, write EXACTLY in this format:

Q1: [question text]
A: [option 1]
B: [option 2]
C: [option 3]
D: [option 4]
Correct: [A/B/C/D]

Q2: [question text]
A: [option 1]
B: [option 2]
C: [option 3]
D: [option 4]
Correct: [A/B/C/D]

Continue for all {num_questions} questions. Put the correct answer in a RANDOM position (A, B, C, or D)."""

    messages = [
        {"role": "system", "content": "You are a quiz generator. Follow the format exactly."},
        {"role": "user", "content": prompt}
    ]
    
    # 3. Query LM Studio
    response = query_lm_studio(messages)
    print(f"\n🤖 AI Response:\n{response[:500]}...\n")
    
    # 4. Parse the simple format
    quiz_data = []
    
    try:
        # Split by question markers
        questions_text = re.split(r'Q\d+:', response)[1:]  # Skip first empty split
        
        for i, q_text in enumerate(questions_text[:num_questions]):
            lines = [line.strip() for line in q_text.strip().split('\n') if line.strip()]
            
            if len(lines) >= 5:  # Need question + 4 options + correct answer line
                # First line is the question
                question = lines[0]
                
                # Next 4 lines should be options A, B, C, D
                options = []
                for line in lines[1:5]:
                    # Remove A:, B:, C:, D: prefixes
                    option = re.sub(r'^[A-D][:)]\s*', '', line).strip()
                    if option:
                        options.append(option)
                
                # Find which one is correct
                correct_letter = None
                for line in lines:
                    # Robust regex to find "Correct: [A-D]" or "Correct Answer: **B**"
                    correct_match = re.search(r'Correct(?: Answer)?:\s*(?:\*\*)?([A-D])(?:\*\*)?', line, re.IGNORECASE)
                    if correct_match:
                        correct_letter = correct_match.group(1).upper()
                        break
                
                if len(options) == 4 and correct_letter:
                    # Convert letter to index (A=0, B=1, C=2, D=3)
                    correct_index = ord(correct_letter) - ord('A')
                    
                    # DON'T shuffle - keep the order A, B, C, D as the AI generated
                    quiz_data.append({
                        "question": question,
                        "options": options,
                        "correct": correct_index,
                        "explanation": f"The correct answer is {correct_letter}: {options[correct_index]}"
                    })
                    print(f"✅ Parsed question {i+1}: {question[:50]}... (Correct: {correct_letter})")
                else:
                    print(f"⚠️ Question {i+1} failed parsing. Options: {len(options)}, Correct: {correct_letter}")
                    print(f"   Raw lines: {lines}")
            else:
                print(f"⚠️ Question {i+1} has {len(lines)} lines, expected at least 5")

    except Exception as e:
        print(f"❌ Error parsing AI response: {e}")
        print(f"Full response: {response}")

    # Fallback: If we didn't get enough questions from AI, try to use dataset
    if len(quiz_data) < num_questions:
        print(f"⚠️ Only got {len(quiz_data)} questions from AI")
        
        if relevant_qa:
            print("Using relevant dataset questions to fill gaps")
            for i in range(len(quiz_data), num_questions):
                if i < len(relevant_qa):
                    qa = relevant_qa[i]
                    # Get other answers as distractors
                    all_answers = [q['answer'] for q in relevant_qa if q['answer'] != qa['answer']]
                    
                    # If not enough distractors in relevant data, use generic ones
                    wrong = []
                    if len(all_answers) >= 3:
                        wrong = random.sample(all_answers, 3)
                    else:
                        wrong = ["Incorrect Option 1", "Incorrect Option 2", "Incorrect Option 3"]
                    
                    options = [qa['answer']] + wrong
                    random.shuffle(options)
                    
                    quiz_data.append({
                        "question": qa['question'],
                        "options": options,
                        "correct": options.index(qa['answer']),
                        "explanation": f"From knowledge base: {qa['answer']}"
                    })
        else:
            print("❌ No relevant data to fill gaps.")

    # Final safety check - ensure we have at least some questions
    if len(quiz_data) == 0:
        print("❌ No questions generated! Returning fallback")
        quiz_data = [{
            "question": f"What is an important concept in {topic}?",
            "options": ["Concept A", "Concept B", "Concept C", "Concept D"],
            "correct": 0,
            "explanation": "This is a fallback question - check backend logs for details."
        }]
    
    print(f"✅ Returning {len(quiz_data)} questions to frontend")
    return jsonify(quiz_data)

@app.route('/api/analyze_pdf', methods=['POST'])
def analyze_pdf():
    """
    Analyze uploaded PDF and generate a summary/resume
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'File must be a PDF'}), 400
        
        print(f"📄 Analyzing PDF: {file.filename}")
        
        # Read PDF content
        pdf_reader = PyPDF2.PdfReader(BytesIO(file.read()))
        
        # Extract text from all pages
        text_content = ""
        num_pages = len(pdf_reader.pages)
        
        for page_num, page in enumerate(pdf_reader.pages):
            text_content += page.extract_text() + "\n"
        
        print(f"📖 Extracted {len(text_content)} characters from {num_pages} pages")
        
        # Truncate if too long (to avoid token limits)
        max_chars = 8000
        if len(text_content) > max_chars:
            text_content = text_content[:max_chars] + "\n... [content truncated]"
        
        # Generate summary using AI
        prompt = f"""Please analyze this PDF document and provide a comprehensive summary/resume. Include:

1. **Main Topic/Subject**: What is this document about?
2. **Key Points**: List the main ideas or concepts (3-5 bullet points)
3. **Important Details**: Any crucial information, dates, names, or facts
4. **Conclusion/Takeaway**: What should the reader remember?

Document Content:
{text_content}

Please provide a well-structured, clear summary."""

        messages = [
            {"role": "system", "content": "You are an expert document analyzer. Provide clear, structured summaries of documents."},
            {"role": "user", "content": prompt}
        ]
        
        # Get AI analysis
        ai_summary = query_lm_studio(messages)
        
        print(f"✅ Generated summary for {file.filename}")
        
        return jsonify({
            'success': True,
            'filename': file.filename,
            'num_pages': num_pages,
            'summary': ai_summary,
            'word_count': len(text_content.split())
        })
        
    except Exception as e:
        print(f"❌ Error analyzing PDF: {e}")
        return jsonify({'error': str(e)}), 500



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
