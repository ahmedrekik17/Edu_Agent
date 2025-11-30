# Educational AI Agent

An autonomous agent designed to teach, correct, and guide students using a hybrid AI architecture (Google Gemini + Local LLM).

## Features
- **Hybrid Brain**: Uses Google Gemini for complex reasoning and Local LLM (via LM Studio) for privacy/speed.
- **RAG Capabilities**: Loads educational data (e.g., Math problems) to answer specific questions.
- **Course Planning**: Generates personalized learning paths.
- **Correction**: Reviews and corrects student input.

## Quick Start
1. `pip install -r requirements.txt`
2. Set `GOOGLE_API_KEY` in `.env`
3. Start LM Studio Server (Port 1234)
4. `python main.py`
