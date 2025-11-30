import pandas as pd
import os

# Define the dataset structure
data = []

# ==========================================
# 1. IA PÉDAGOGIQUE (Pedagogical AI)
# ==========================================
pedagogy_data = [
    {
        "Question": "Explain the Pythagorean theorem to a 10-year-old.",
        "Answer": "Imagine you have a triangle where one corner is a perfect 'L' shape (a right angle). The side opposite to that corner is like a slide. If you draw a square on each of the three sides, the area of the biggest square (the slide) is exactly equal to the areas of the other two squares added together! Mathematically, we say a² + b² = c².",
        "Subject": "Mathematics",
        "Category": "Pedagogy"
    },
    {
        "Question": "I don't understand photosynthesis. Can you simplify it?",
        "Answer": "Think of plants as solar-powered chefs. 1. They take 'ingredients': Water (from roots) and Carbon Dioxide (from air). 2. They use 'energy': Sunlight (captured by green stuff called chlorophyll). 3. They cook up 'food': Sugar (glucose) for themselves and Oxygen for us to breathe! It's nature's cooking process.",
        "Subject": "Biology",
        "Category": "Pedagogy"
    },
    {
        "Question": "What is the difference between 'their', 'there', and 'they're'?",
        "Answer": "Here is a simple trick: \n- 'There' has 'here' inside it. It's about a place. (The book is over there.)\n- 'Their' has 'heir' inside it. It's about ownership. (It is their car.)\n- 'They're' is short for 'They are'. (They're going to the park.)",
        "Subject": "English",
        "Category": "Pedagogy"
    }
]

# ==========================================
# 2. CORRECTION AUTOMATIQUE (Correction)
# ==========================================
correction_data = [
    {
        "Question": "Correct this sentence: 'I goed to the store yesterday and buyed milk.'",
        "Answer": "Here is the correction:\n\n❌ Original: 'I goed to the store yesterday and buyed milk.'\n✅ Corrected: 'I went to the store yesterday and bought milk.'\n\n💡 Explanation: The verbs 'go' and 'buy' are irregular in the past tense. 'Go' becomes 'went' and 'buy' becomes 'bought'.",
        "Subject": "English",
        "Category": "Correction"
    },
    {
        "Question": "Check my math: 2x + 5 = 15 -> 2x = 20 -> x = 10",
        "Answer": "I found a mistake in your second step.\n\nYour step: 2x + 5 = 15 -> 2x = 20 (You added 5 instead of subtracting!)\n\nCorrection:\n1. Start: 2x + 5 = 15\n2. Subtract 5 from both sides: 2x = 10\n3. Divide by 2: x = 5\n\nThe correct answer is x = 5.",
        "Subject": "Mathematics",
        "Category": "Correction"
    }
]

# ==========================================
# 3. GÉNÉRATEUR DE CONTENU (Content Gen)
# ==========================================
content_data = [
    {
        "Question": "Create a quiz about World War II.",
        "Answer": "Here is a short quiz on WWII:\n\n1. When did WWII start?\n   A) 1914\n   B) 1939\n   C) 1945\n   (Correct: B)\n\n2. Which countries were the main Axis powers?\n   A) USA, UK, USSR\n   B) Germany, Italy, Japan\n   C) France, Germany, Spain\n   (Correct: B)\n\n3. What event brought the US into the war?\n   A) D-Day\n   B) Pearl Harbor\n   C) Battle of Midway\n   (Correct: B)",
        "Subject": "History",
        "Category": "Content Generation"
    },
    {
        "Question": "Generate a summary of Newton's Laws.",
        "Answer": "Newton's Three Laws of Motion:\n\n1. **Inertia**: An object stays still or keeps moving unless a force acts on it.\n2. **F=ma**: Force equals Mass times Acceleration. Pushing a heavy truck is harder than pushing a toy car.\n3. **Action/Reaction**: For every action, there is an equal and opposite reaction. (Like a rocket pushing gas down to go up!)",
        "Subject": "Physics",
        "Category": "Content Generation"
    }
]

# ==========================================
# 4. AGENT AUTONOME (Planning)
# ==========================================
planning_data = [
    {
        "Question": "Plan a revision schedule for my Biology exam in 3 days.",
        "Answer": "Here is a 3-Day Biology Revision Plan:\n\n📅 **Day 1: Core Concepts**\n- Morning: Cell Structure & Functions (2h)\n- Afternoon: Photosynthesis & Respiration (2h)\n- Evening: Quick Quiz (30m)\n\n📅 **Day 2: Systems & Genetics**\n- Morning: Human Digestive & Circulatory Systems (2h)\n- Afternoon: Genetics & DNA (2h)\n- Evening: Draw diagrams (1h)\n\n📅 **Day 3: Review & Practice**\n- Morning: Review weak spots (2h)\n- Afternoon: Past Exam Papers (3h)\n- Evening: Light review & Sleep early!",
        "Subject": "Methodology",
        "Category": "Planning"
    },
    {
        "Question": "I keep procrastinating. How can I focus?",
        "Answer": "Try the **Pomodoro Technique**:\n1. Set a timer for 25 minutes.\n2. Focus ONLY on one task.\n3. Take a 5-minute break.\n4. Repeat.\n\nAlso, remove distractions (put your phone in another room) and start with the easiest task to get momentum.",
        "Subject": "Methodology",
        "Category": "Coaching"
    }
]

# Combine all data
data.extend(pedagogy_data)
data.extend(correction_data)
data.extend(content_data)
data.extend(planning_data)

# Create DataFrame
df = pd.DataFrame(data)

# Ensure directory exists
os.makedirs('data', exist_ok=True)

# Save to Excel
output_path = 'data/advanced_edu_dataset.xlsx'
df.to_excel(output_path, index=False)

print(f"✅ Generated advanced dataset with {len(df)} high-quality examples at: {output_path}")
print("Columns:", df.columns.tolist())
