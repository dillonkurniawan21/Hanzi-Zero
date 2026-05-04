from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

client = genai.Client(api_key=os.environ.get("GOOGLE_GENAI_API_KEY") or os.environ.get("GEMINI_API_KEY"))

# ── API routes ──────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})

@app.route("/api/debug", methods=["GET"])
def debug():
    import os
    try:
        cur_dir = os.path.dirname(__file__)
        files = os.listdir(cur_dir)
        return jsonify({
            "__file__": __file__,
            "cur_dir": cur_dir,
            "files": files,
            "cwd": os.getcwd()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

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
            model="gemini-2.0-flash",
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

# ── Serve frontend (Catch-all route at the bottom) ──────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    static_dir = os.path.abspath(os.path.dirname(__file__))
    if path and os.path.exists(os.path.join(static_dir, path)):
        return send_from_directory(static_dir, path)
    return send_from_directory(static_dir, 'index.html')
