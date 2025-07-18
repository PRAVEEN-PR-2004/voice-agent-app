# app.py
import os
import sys
from flask import Flask, request, jsonify
from groq import Groq
from dotenv import load_dotenv
from flask_cors import CORS


# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)
# --- Groq API Configuration ---
try:
    groq_api_key = os.environ['GROQ_API_KEY']
    client = Groq(api_key=groq_api_key)
    # --- Choose your Llama model ---
    LLAMA_MODEL = 'llama3-8b-8192'
except KeyError:
    sys.stderr.write("ERROR: GROQ_API_KEY environment variable not set.\n")
    sys.stderr.write("Please create a .env file with GROQ_API_KEY=your_key\n")
    sys.exit(1)
except Exception as e:
    sys.stderr.write(f"ERROR: Failed to initialize Groq client: {e}\n")
    sys.exit(1)

# --- System Prompt for the Chatbot ---
SYSTEM_PROMPT = """
You are a helpful assistant embedded within the 'Academic Planner – Your Smart Study Scheduler' web application.
Your goal is to assist students with questions related to managing their academic life using the planner's features.
Be proactive in suggesting useful ways students can take control of their academic journey.

You are knowledgeable about:
- Calendar integration for tasks, assignments, and exams.
- Creating and managing To-Do lists (daily, weekly, monthly) with priorities.
- Setting reminders and alerts for deadlines.
- Understanding the Progress Tracker (completed vs. pending tasks visualization).
- Helping users set short-term and long-term academic goals.
- Managing subjects, professors, and class times.
- Using the Notes section effectively.

Additionally, provide helpful suggestions on:
- How to create a personalized study plan from scratch, based on the user's goals and deadlines.
- How to break down a course syllabus into manageable weekly or daily learning targets.
- How to set realistic, trackable milestones for completing chapters or assignments.
- How to balance study time with breaks using the timetable feature.
- How to best utilize the app for regular revision and tracking consistency.
- Tips for maintaining discipline, avoiding procrastination, and staying motivated.
- Sample strategies like the Pomodoro Technique, spaced repetition, and priority matrices (e.g., Eisenhower box).
- How to evaluate weekly progress and adjust their study plans accordingly.

Your tone should be friendly, concise, and encouraging. Always focus on guiding students to organize, plan, and achieve their academic goals using the planner.

If a user asks something unrelated to academic planning or the app's features, gently steer them back or state you cannot help with that topic.

Do not invent features the planner doesn't have based on the project description.
"""


# --- Flask Routes ---
@app.route('/')
def index():
    """Simple endpoint to verify the API is running"""
    return jsonify({"status": "API is running", "usage": "Send POST requests to /chat endpoint"})

@app.route('/chat', methods=['POST'])
def chat():
    """Handles the chat request from curl or any client"""
    try:
        user_message = request.json.get('message')
        custom_system_prompt = request.json.get('system_prompt')
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Concise, conversational instruction
        CONCISE_INSTRUCTION = (
            "Always keep your responses concise, conversational, and to the point, like a real person in a voice chat. "
            "Limit your answers to 2-3 sentences unless the user asks for more detail. Avoid long monologues."
        )
        # Prepend instruction to the system prompt
        if custom_system_prompt:
            system_prompt = f"{CONCISE_INSTRUCTION}\n\n{custom_system_prompt}"
        else:
            system_prompt = f"{CONCISE_INSTRUCTION}\n\n{SYSTEM_PROMPT}"
        
        # --- Call the Groq API ---
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
            model=LLAMA_MODEL,
            temperature=0.7,
            max_tokens=300,
            top_p=1,
            stop=None,
            stream=False,
        )
        
        bot_response = chat_completion.choices[0].message.content
        return jsonify({"reply": bot_response})
    
    except Exception as e:
        app.logger.error(f"Error processing chat request: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# --- Run the Application ---
if __name__ == '__main__':

    # Use debug=True for development, False for production
    app.run(debug=True, host='0.0.0.0', port=5001)