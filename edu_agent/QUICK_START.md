# LM Studio - Quick Start Steps

## You've Downloaded: Llama 3.2 1B Instruct Uncensored ✅

### Step 1: Load the Model
1. In LM Studio, click the **"💬 Chat"** tab (left sidebar)
2. At the top, you'll see a dropdown that says "Select a model"
3. Click it and find: **"llama-3.2-1b-instruct-uncensored"**
4. Click **"Load Model"** button
5. Wait 10-30 seconds for it to load into memory

### Step 2: Start the Local Server
1. Click the **"↔ Local Server"** tab (left sidebar)
2. You should see your loaded model listed
3. Click the big green **"Start Server"** button
4. You should see: `✅ Server running on http://localhost:1234`

### Step 3: Test the Connection
Open a NEW terminal and run:
```bash
python test_lm_studio.py
```

You should see:
```
✅ SUCCESS! LM Studio is working!
Response: Hello! I'm an AI tutor...
```

### Step 4: Run Your Educational Agent
```bash
python main.py
```

### Step 5: Try It Out!
Ask questions like:
- "Solve for x: 2x + 5 = 15"
- "Explain photosynthesis"
- "Create a study plan for Python"

---

## Troubleshooting

**If test_lm_studio.py fails:**
- Make sure the green "Start Server" button is ON
- Check that port shows 1234
- Try restarting LM Studio

**If responses are slow:**
- This is normal for 1B model on CPU
- Llama 3.2 1B is lightweight, should be fast!

**If you get gibberish:**
- Go to Server tab → Settings
- Set "Temperature" to 0.7
- Set "Max Tokens" to 500
