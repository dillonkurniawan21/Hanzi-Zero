from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Hardcoded users for now
USERS = {
    "tester": "tester",
    "admin": "admin"
}

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "version": "login-system"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    if username in USERS and USERS[username] == password:
        return jsonify({
            "success": True, 
            "token": f"mock-token-{username}",
            "username": username,
            "role": "admin" if username == "admin" else "user"
        })
    
    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route("/api/analyze", methods=["POST"])
def analyze():
    # In a real app, we would verify the token here
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
    return jsonify({"response": "the ai currently unavailabe wait until next update"})
