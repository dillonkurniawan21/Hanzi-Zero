from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.environ.get("GOOGLE_GENAI_API_KEY"))

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})

@app.route("/api/analyze", methods=["POST"])
def analyze():
    # Placeholder for actual analysis logic
    data = request.get_json()
    return jsonify({
        "weaknesses": {
            "vocabulary": 0.3,
            "grammar": 0.4,
            "reading": 0.2,
            "listening": 0.3,
            "writing": 0.5
        },
        "recommended_difficulty": "medium",
        "recommendations": ["hsk1-1", "hsk1-2", "hsk1-3"],
        "level_stats": { "total_words": "150", "total_lessons": "10" },
        "tips": ["Keep practicing daily!", "Focus on your tones."]
    })

@app.route("/api/tip", methods=["GET"])
def get_tip():
    level = request.args.get("level", 1)
    return jsonify({"tip": "Consistency is key to learning Hanzi!", "level": level})

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        message = data.get("message", "")
        character = data.get("character", "not selected")
        points = data.get("points", 0)

        prompt = f"""
You are a friendly AI study helper for a Chinese learning app.

Help the student study Chinese characters.

Current character: {character}
Student points: {points}

Student message:
{message}

Rules:
- Explain Chinese characters simply.
- Give example words and sentences.
- Correct mistakes gently.
- Keep the answer short.
- Encourage the student.
"""

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        print(e)
        return jsonify({
            "response": "Sorry, the AI helper is not available right now."
        }), 500