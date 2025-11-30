# LM Studio Setup Guide - Using Your Own Dataset

## Step 1: Install LM Studio

1. Download from: https://lmstudio.ai/
2. Install and open the application

## Step 2: Download a Model

1. Click **"Search"** tab in LM Studio
2. Recommended models for education:
   - **Mistral 7B Instruct** (Good balance, fast)
   - **Llama 3.2 3B** (Faster, lighter)
   - **Phi-3 Mini** (Optimized for reasoning)
   
3. Click **Download** on your chosen model
4. Wait for download to complete

## Step 3: Load the Model

1. Go to **"Chat"** tab
2. At the top, select your downloaded model from the dropdown
3. Click **"Load Model"**

## Step 4: Start the Local Server

1. Go to **"Local Server"** tab (left sidebar)
2. Click the **green "Start Server"** button
3. Verify it says: `Server running on http://localhost:1234`
4. **Keep LM Studio open** while using the agent

## Step 5: Fine-Tuning with Your Dataset (Optional)

### Method 1: System Prompt (Easiest - No Training)

In LM Studio's Chat tab:
1. Click **"System Prompt"** at the top
2. Add your educational context:

```
You are an expert educational tutor specializing in:
- Mathematics (Algebra, Geometry, Calculus)
- Science (Physics, Chemistry, Biology)
- Programming (Python, JavaScript)

When answering:
- Explain step-by-step
- Use examples from the student's level
- Be encouraging and patient
```

This will influence how the model responds!

### Method 2: Add Data to Knowledge Base (RAG)

**Our agent already does this!** Just add more JSON files to the `data/` folder:

**Example: `data/science_samples.json`**
```json
[
  {
    "id": "sci_001",
    "subject": "science",
    "topic": "physics",
    "question": "What is Newton's First Law?",
    "solution": "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.",
    "level": "beginner"
  }
]
```

Then update `src/tools.py` to load it:

```python
def load_science_samples(self):
    path = os.path.join(self.data_dir, "science_samples.json")
    if not os.path.exists(path):
        return []
    with open(path, 'r') as f:
        return json.load(f)

def get_rag_context(self, topic):
    # Load ALL datasets
    math_data = self.load_math_samples()
    science_data = self.load_science_samples()
    all_data = math_data + science_data
    
    # Search across all
    relevant_items = [item for item in all_data if topic.lower() in item['topic'].lower() or topic.lower() in item['question'].lower()]
    
    if not relevant_items:
        return "No specific examples found in database."
    
    context = "Here are relevant examples from the database:\n"
    for item in relevant_items:
        context += f"- Question: {item['question']}\n  Solution: {item['solution']}\n"
    return context
```

### Method 3: Fine-Tune the Model (Advanced)

LM Studio doesn't support fine-tuning directly. For this, you'd need:
1. Use **Hugging Face** or **Ollama** with custom training
2. Export your dataset as JSONL format
3. Use tools like `unsloth` or `axolotl` for fine-tuning

**For most educational use cases, Method 1 + Method 2 (RAG) is sufficient!**

## Step 6: Test Your Setup

Run this test:
```bash
python test_lm_studio.py
```

If you see a response, you're ready!

## Step 7: Run the Agent

```bash
python main.py
```

Try:
- "Solve for x: 2x + 5 = 15" (Should use Knowledge Base)
- "Explain photosynthesis" (Should use Local Brain)
- "Create a study plan for algebra" (Should use Local Brain)

## Troubleshooting

**Error: "Connection refused"**
- Make sure LM Studio server is running (green button)
- Check port is 1234

**Slow responses**
- Use a smaller model (Phi-3 Mini, Llama 3.2 3B)
- Reduce context length in LM Studio settings

**Model not answering well**
- Adjust the System Prompt
- Try a different model (Mistral is usually best for education)
