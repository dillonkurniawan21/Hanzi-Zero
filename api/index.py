from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.environ.get("GOOGLE_GENAI_API_KEY") or os.environ.get("GEMINI_API_KEY"))

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})

@app.route("/api/analyze", methods=["POST"])
def analyze():
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
Student message: {message}
Rules: Explain characters simply, give examples, be short and encouraging.
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return jsonify({"response": response.text})
    except Exception as e:
        print(e)
        return jsonify({"response": "Sorry, the AI helper is not available right now."}), 500

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    if path != "" and os.path.exists(os.path.join(static_dir, path)):
        return send_from_directory(static_dir, path)
    return send_from_directory(static_dir, 'index.html')
