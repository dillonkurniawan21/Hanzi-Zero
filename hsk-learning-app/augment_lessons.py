#!/usr/bin/env python3
"""
augment_lessons.py
==================
Dual-purpose script:
  1. Exercise Generation (original): python augment_lessons.py
  2. AI Tutor Server:               python augment_lessons.py --serve

Server dependencies:
  pip install flask flask-cors pandas tensorflow numpy
"""

import json, random, re, sys, os, argparse

DATA_JS_PATH = "/Users/dillonchristano/Documents/Antigravity/hsk-learning-app/data.js"
MODEL_WEIGHTS = os.path.join(os.path.dirname(__file__), "tutor_model.weights.h5")

# ─────────────────────────────────────────────────────────────────────────────
#  SECTION 1 — SMART KNOWLEDGE BASE (original exercise-gen data)
# ─────────────────────────────────────────────────────────────────────────────

CONTEXT_LIBRARY = {
    "你好": ["______, 认识你很高兴。", "老师，______！"],
    "谢谢": ["A: 这是你的书。 B: ______。", "______ 你的帮助。"],
    "不客气": ["A: 谢谢你！ B: ______。"],
    "再见": ["天黑了，我回家了，______！"],
    "老师": ["李______ 是我们的汉语老师。", "他是我的______，教我写汉字。"],
    "学生": ["我是一个大______，在学校学习。"],
    "医生": ["他在医院工作，他是一名______。"],
    "学校": ["我在______ 学习汉语。"],
    "中国": ["我是______ 人，我住在北京。"],
    "北京": ["______ 是中国的首都。"],
    "去": ["我想 ______ 中国旅游。", "你 ______ 哪儿？"],
    "看": ["我喜欢 ______ 电影。"],
    "吃": ["我喜欢 ______ 中国菜。"],
    "喝": ["我想 ______ 一杯水。"],
    "水": ["我渴了，想喝 ______。"],
    "咖啡": ["我不喜欢喝 ______，我喜欢喝茶。", "服务员，请给我一杯 ______。"],
    "羊肉": ["这个 ______ 很好吃。"],
    "面条": ["中国人过生日喜欢吃 ______。"],
    "好吃": ["中国菜很 ______。"],
    "快乐": ["祝你生日 ______！"],
    "旅游": ["我明年想去中国 ______。"],
    "运动": ["我每天早上都去 ______。"],
    "努力": ["只要你 ______ 学习，就能考好。"],
    "环境": ["这里的 ______ 非常好。", "我们要保护 ______。"],
    "热情": ["他待人非常 ______。"],
    "难过": ["听到这个消息，他很 ______。"],
    "银行": ["我去 ______ 换钱。"],
    "干净": ["这个房间很 ______。"],
    "安静": ["图书馆里很 ______。"],
    "经验": ["他有丰富的教学 ______。"],
    "责任": ["保护环境是每个人的 ______。"],
    "成功": ["祝你 ______！", "经过努力，他终于 ______ 了。"],
    "失败": ["______ 是成功之母。"],
    "招聘": ["公司正在 ______ 新员工。"],
    "工资": ["他的 ______ 很高。"],
    "办理": ["我在 ______ 签证手续。"],
    "报告": ["他正在写工作 ______。"],
    "简历": ["这是我的 ______。"],
    "项目": ["这个 ______ 非常重要。"],
}

STUDY_TIPS = {
    1: [
        "Focus on tones! Mandarin has 4 tones. Even with wrong vocabulary, correct tones aid comprehension.",
        "Learn the 150 HSK 1 characters with mnemonics — connect each to a visual story.",
        "Practice reading pinyin aloud every day. 10 minutes beats 1 hour of silent study.",
        "Use spaced repetition: review new words after 1 day, 3 days, 7 days, then monthly.",
        "Learn greetings first — 你好, 谢谢, 对不起 are your daily essentials.",
    ],
    2: [
        "Build basic sentences: Subject + Verb + Object. Chinese grammar is simpler than English!",
        "Learn measure words (量词): 一本书, 一杯水. They're essential for counting.",
        "Time expressions always come before the verb: 我明天去 (I tomorrow go).",
        "Practice numbers 1–100 until automatic — you need them for prices and dates.",
        "Connect new vocabulary to situations: dining, shopping, travel.",
    ],
    3: [
        "Learn the BECAUSE…THEREFORE pattern: 因为…所以… — used constantly in spoken Chinese.",
        "Start reading simple Chinese texts. Even children's books are great at HSK 3.",
        "Focus on time words: 以前/以后, 刚才, 马上.",
        "Complement patterns like 写得很好 (written very well) are critical at this level.",
        "Write a 3-sentence diary entry in Chinese every day.",
    ],
    4: [
        "Focus on chengyu (成语) — 4-character idioms appear constantly in media.",
        "Learn formal vs. informal registers. 你 vs. 您, written vs. spoken vocabulary.",
        "Consume Chinese media: dramas, news, podcasts — even 10 minutes daily helps.",
        "The 把 sentence pattern is crucial at HSK 4 — master it with daily practice.",
        "Work on paragraph construction: topic sentence → support → conclusion.",
    ],
    5: [
        "Read Chinese newspapers online — HSK 5 vocabulary appears frequently.",
        "Practice abstract vocabulary: concepts, opinions, analysis.",
        "Study formal written Chinese (书面语) — it differs significantly from spoken.",
        "Focus on nuanced conjunctions: 尽管…还是…, 虽然…但是…",
        "Aim for 2,500 character recognition. Build reading speed with timed practice.",
    ],
}

CHAT_RESPONSES = {
    "greeting": "你好！I'm your AI Tutor 🤖 Ask me about vocabulary, tones, grammar, or your HSK progress!",
    "tone": "Mandarin has 4 tones:\n• 1st (ā) High flat — like singing one note\n• 2nd (á) Rising — like asking 'What?'\n• 3rd (ǎ) Dip then rise — like saying 'hm'\n• 4th (à) Falling — like saying 'No!'\nExaggerate tones when practicing — it helps memory!",
    "pinyin": "Pinyin is the romanization system for Mandarin. Special sounds: x = 'sh', zh = 'j', q = 'ch'. Each syllable = initial (consonant) + final (vowel). Practice with audio daily!",
    "character": "Chinese characters are logograms — each represents a morpheme. Start with radicals (部首): 日 (sun), 月 (moon), 水 (water) appear in hundreds of characters. Learn radicals first!",
    "grammar": "Good news: Chinese grammar is logical! No verb conjugation, no gender, no plural forms. Word ORDER carries meaning: Subject-Verb-Object. Time words come first, adverbs before verbs.",
    "vocabulary": "For vocabulary, learn words in context — not bare lists. The fill-in-the-blank exercises in this app do exactly that. Aim for 15 new words per day with review.",
    "hsk": "HSK has 7 levels:\n• HSK 1–2: 300–600 words, daily survival\n• HSK 3–4: 600–1200 words, intermediate\n• HSK 5–6: 1200–2500 words, professional\n• HSK 7–9: Advanced academic/professional\nConsistency beats speed — one level at a time!",
    "default": "Great question! 💡 Consistent daily practice — even 15 minutes — beats 2 hours once a week. Keep using the lessons here and you'll see steady progress!",
}

# ─────────────────────────────────────────────────────────────────────────────
#  SECTION 2 — PANDAS DATA LAYER
# ─────────────────────────────────────────────────────────────────────────────

def _extract_obj(name, text):
    match = re.search(fr"const {name} = (\{{.*?\}});", text, re.DOTALL)
    if not match:
        return None
    start, count = match.start(1), 0
    for i in range(start, len(text)):
        if text[i] == "{":
            count += 1
        elif text[i] == "}":
            count -= 1
        if count == 0:
            return json.loads(text[start : i + 1])
    return None


def load_lessons_df():
    """Read data.js and return (DataFrame, all_lessons dict, hsk_data dict)."""
    import pandas as pd

    with open(DATA_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    all_lessons = _extract_obj("ALL_LESSONS", content)
    hsk_data = _extract_obj("HSK_DATA", content)

    rows = []
    for lesson_id, lesson in all_lessons.items():
        parts = lesson_id.replace("hsk", "").split("-")
        hsk_level = int(parts[0]) if parts else 1
        lesson_num = int(parts[1]) if len(parts) > 1 else 0
        exercises = lesson.get("exercises", [])
        vocab_words = []

        for ex in exercises:
            if ex["type"] == "matching":
                for pair in ex.get("pairs", []):
                    vocab_words.append(pair["hanzi"])
                    rows.append({
                        "lesson_id": lesson_id,
                        "lesson_title": lesson.get("title", ""),
                        "hsk_level": hsk_level,
                        "lesson_num": lesson_num,
                        "vocab_word": pair["hanzi"],
                        "pinyin": pair.get("pinyin", ""),
                        "english": pair.get("english", ""),
                    })

        # Summary row
        rows.append({
            "lesson_id": lesson_id,
            "lesson_title": lesson.get("title", ""),
            "hsk_level": hsk_level,
            "lesson_num": lesson_num,
            "vocab_word": "__summary__",
            "pinyin": "",
            "english": "",
            "exercise_count": len(exercises),
            "vocab_count": len(vocab_words),
        })

    df = pd.DataFrame(rows)
    return df, all_lessons, hsk_data


def compute_level_stats(df):
    """Return per-HSK-level stats dict computed with pandas."""
    stats = {}
    vocab_df = df[df["vocab_word"] != "__summary__"].copy()
    summary_df = df[df["vocab_word"] == "__summary__"].copy()

    for level in range(1, 6):
        lv = vocab_df[vocab_df["hsk_level"] == level]
        ls = summary_df[summary_df["hsk_level"] == level]
        stats[level] = {
            "total_words": int(len(lv)),
            "total_lessons": int(len(ls)),
            "avg_exercises": float(ls["exercise_count"].mean()) if len(ls) else 0,
            "lesson_ids": ls["lesson_id"].tolist(),
            "sample_words": lv["vocab_word"].dropna().unique().tolist()[:10],
        }
    return stats


# ─────────────────────────────────────────────────────────────────────────────
#  SECTION 3 — TENSORFLOW AI MODEL
# ─────────────────────────────────────────────────────────────────────────────

class AITutorModel:
    """
    3-layer dense network.
    Input (8 features): [correct_pct, attempts_norm, streak_norm, hsk_level_norm,
                          lesson_progress, time_per_q_norm, hint_rate, mistake_rate]
    Outputs:
      - weakness_scores (5): [vocabulary, grammar, reading, listening, writing]
      - difficulty (3):      [easy, medium, hard] probabilities
    """

    SKILL_NAMES = ["vocabulary", "grammar", "reading", "listening", "writing"]

    def __init__(self):
        self.model = None
        self.trained = False

    def _build(self):
        import tensorflow as tf

        inp = tf.keras.Input(shape=(8,), name="perf_input")
        x = tf.keras.layers.Dense(64, activation="relu")(inp)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        x = tf.keras.layers.Dense(32, activation="relu")(x)
        x = tf.keras.layers.Dropout(0.1)(x)
        x = tf.keras.layers.Dense(16, activation="relu")(x)

        weakness = tf.keras.layers.Dense(5, activation="sigmoid", name="weakness_scores")(x)
        difficulty = tf.keras.layers.Dense(3, activation="softmax", name="difficulty")(x)

        self.model = tf.keras.Model(inputs=inp, outputs=[weakness, difficulty])
        self.model.compile(
            optimizer="adam",
            loss={"weakness_scores": "mse", "difficulty": "categorical_crossentropy"},
        )

    def _synthetic_data(self, n=2000):
        import numpy as np

        X, Yw, Yd = [], [], []
        for _ in range(n):
            cp = random.uniform(0, 1)
            att = random.randint(1, 50)
            strk = random.randint(0, 30)
            lvl = random.randint(1, 5)
            prog = random.uniform(0, 1)
            tpq = random.uniform(0, 1)
            hint = random.uniform(0, 0.5)
            mist = max(0, min(1, (1 - cp) + random.uniform(-0.1, 0.1)))

            X.append([cp, att / 50, strk / 30, lvl / 5, prog, tpq, hint, mist])

            w = [
                max(0, min(1, (1 - cp) * 0.9 + random.gauss(0, 0.1))),
                max(0, min(1, mist * 0.8 + random.gauss(0, 0.08))),
                max(0, min(1, (1 - prog) * 0.7 + random.gauss(0, 0.1))),
                max(0, min(1, hint * 0.6 + random.gauss(0, 0.08))),
                max(0, min(1, tpq * 0.5 + random.gauss(0, 0.08))),
            ]
            Yw.append(w)

            if cp > 0.8:
                Yd.append([0.8, 0.15, 0.05])
            elif cp > 0.5:
                Yd.append([0.1, 0.8, 0.1])
            else:
                Yd.append([0.05, 0.2, 0.75])

        return np.array(X), np.array(Yw), np.array(Yd)

    def ensure_trained(self):
        if self.trained:
            return
        if self.model is None:
            self._build()
        if os.path.exists(MODEL_WEIGHTS):
            try:
                self.model.load_weights(MODEL_WEIGHTS)
                self.trained = True
                print("[AITutor] Loaded saved weights.")
                return
            except Exception as e:
                print(f"[AITutor] Could not load weights ({e}), retraining…")
        print("[AITutor] Training on synthetic data…")
        X, Yw, Yd = self._synthetic_data()
        self.model.fit(
            X,
            {"weakness_scores": Yw, "difficulty": Yd},
            epochs=25,
            batch_size=64,
            validation_split=0.15,
            verbose=0,
        )
        self.model.save_weights(MODEL_WEIGHTS)
        self.trained = True
        print("[AITutor] Model trained and saved.")

    def predict(self, correct_pct, attempts, streak, hsk_level, lesson_progress,
                time_per_q=0.5, hint_rate=0.0):
        import numpy as np

        self.ensure_trained()
        mist = max(0, min(1, 1 - correct_pct))
        feat = np.array([[correct_pct, min(1, attempts / 50), min(1, streak / 30),
                          hsk_level / 5, lesson_progress, time_per_q, hint_rate, mist]])
        w_raw, d_raw = self.model.predict(feat, verbose=0)
        weaknesses = {n: round(float(s), 3) for n, s in zip(self.SKILL_NAMES, w_raw[0])}
        labels = ["easy", "medium", "hard"]
        difficulty = labels[int(d_raw[0].argmax())]
        return weaknesses, difficulty


# ─────────────────────────────────────────────────────────────────────────────
#  SECTION 4 — FLASK REST API
# ─────────────────────────────────────────────────────────────────────────────

def create_flask_app(tutor: AITutorModel, stats: dict):
    from flask import Flask, request, jsonify
    from flask_cors import CORS

    app = Flask(__name__)
    CORS(app)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "model_trained": tutor.trained, "version": "1.0"})

    @app.route("/api/analyze", methods=["POST"])
    def analyze():
        d = request.get_json(force=True) or {}
        level = int(d.get("hsk_level", 1))
        weaknesses, difficulty = tutor.predict(
            correct_pct=float(d.get("correct_pct", 0.7)),
            attempts=int(d.get("attempts", 5)),
            streak=int(d.get("streak", 0)),
            hsk_level=level,
            lesson_progress=float(d.get("lesson_progress", 0.3)),
            time_per_q=float(d.get("time_per_q", 0.5)),
            hint_rate=float(d.get("hint_rate", 0.0)),
        )
        lvl_stats = stats.get(level, {})
        return jsonify({
            "weaknesses": weaknesses,
            "recommended_difficulty": difficulty,
            "recommendations": lvl_stats.get("lesson_ids", [])[:3],
            "level_stats": {
                "total_words": lvl_stats.get("total_words", 0),
                "total_lessons": lvl_stats.get("total_lessons", 0),
            },
            "tips": random.sample(STUDY_TIPS.get(level, STUDY_TIPS[1]), 2),
        })

    @app.route("/api/tip")
    def tip():
        level = int(request.args.get("level", 1))
        return jsonify({"tip": random.choice(STUDY_TIPS.get(level, STUDY_TIPS[1])), "level": level})

    @app.route("/api/chat", methods=["POST"])
    def chat():
        d = request.get_json(force=True) or {}
        msg = d.get("message", "").lower()
        if any(w in msg for w in ["hi", "hello", "hey", "你好"]):
            key = "greeting"
        elif any(w in msg for w in ["tone", "声调", "pitch"]):
            key = "tone"
        elif any(w in msg for w in ["pinyin", "pronunciation"]):
            key = "pinyin"
        elif any(w in msg for w in ["character", "hanzi", "汉字", "radical"]):
            key = "character"
        elif any(w in msg for w in ["grammar", "语法", "sentence"]):
            key = "grammar"
        elif any(w in msg for w in ["vocab", "word", "词汇", "memorize"]):
            key = "vocabulary"
        elif any(w in msg for w in ["hsk", "level", "exam"]):
            key = "hsk"
        else:
            key = "default"
        return jsonify({"response": CHAT_RESPONSES[key], "intent": key})

    return app


# ─────────────────────────────────────────────────────────────────────────────
#  SECTION 5 — ORIGINAL EXERCISE GENERATION (unchanged)
# ─────────────────────────────────────────────────────────────────────────────

def get_random_distractors(all_vocab, exclude_list, count):
    available = [v for v in all_vocab if v not in exclude_list]
    if len(available) < count:
        fallbacks = ["我", "你", "他", "是", "的", "不", "了", "在", "这", "有", "个", "人", "大", "小", "好"]
        available.extend([f for f in fallbacks if f not in exclude_list and f not in available])
    return random.sample(available, min(count, len(available)))


def generate_smart_exercises(lesson_id, lesson_vocab, all_vocab):
    exercises = []
    vocab_list = list(lesson_vocab.keys())
    random.shuffle(vocab_list)
    usage = {w: 0 for w in vocab_list}

    # 1. Matching
    matching_words = vocab_list[:4]
    exercises.append({
        "type": "matching",
        "question": f"Match the vocabulary for {lesson_id}",
        "pairs": [{"hanzi": w, "pinyin": lesson_vocab[w].get("pinyin", ""),
                   "english": lesson_vocab[w].get("english", "")} for w in matching_words],
    })
    for w in matching_words:
        usage[w] += 1

    # 2. Contextual fill-in-the-blank
    ctx_count = 0
    for w in vocab_list:
        if ctx_count >= 4:
            break
        if w in CONTEXT_LIBRARY:
            tmpl = random.choice(CONTEXT_LIBRARY[w])
            exercises.append({
                "type": "fill_blank",
                "question": f"Fill in the blank: {tmpl}",
                "answer": w,
                "options": sorted([w] + get_random_distractors(all_vocab, [w], 3), key=lambda x: random.random()),
            })
            usage[w] += 1
            ctx_count += 1

    # 3. Pinyin → Hanzi
    py_count = 0
    for w in sorted(vocab_list, key=lambda x: usage[x]):
        if py_count >= 3:
            break
        info = lesson_vocab[w]
        if info.get("pinyin"):
            exercises.append({
                "type": "fill_blank",
                "question": f"Which Hanzi represents the pinyin '{info['pinyin']}'?",
                "answer": w,
                "options": sorted([w] + get_random_distractors(all_vocab, [w], 3), key=lambda x: random.random()),
            })
            usage[w] += 1
            py_count += 1

    # 4. Fill to 12
    while len(exercises) < 12:
        w = sorted(vocab_list, key=lambda x: usage[x])[0]
        info = lesson_vocab[w]
        exercises.append({
            "type": "translate",
            "question": f"How do you write '{info.get('english', w)}' in Chinese?",
            "answer": [w],
            "options": sorted([w] + get_random_distractors(all_vocab, [w], 5), key=lambda x: random.random()),
        })
        usage[w] += 1

    return exercises[:12]


def run_exercise_generation():
    with open(DATA_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    all_lessons = _extract_obj("ALL_LESSONS", content)
    hsk_data = _extract_obj("HSK_DATA", content)

    global_vocab = []
    for lesson in all_lessons.values():
        for ex in lesson.get("exercises", []):
            if ex["type"] == "matching":
                for p in ex["pairs"]:
                    if p["hanzi"] not in global_vocab:
                        global_vocab.append(p["hanzi"])

    for lid, lesson in all_lessons.items():
        lesson_vocab = {}
        for ex in lesson.get("exercises", []):
            if ex["type"] == "matching":
                for p in ex["pairs"]:
                    lesson_vocab[p["hanzi"]] = {"pinyin": p["pinyin"], "english": p["english"]}
        if not lesson_vocab:
            continue
        lesson["exercises"] = generate_smart_exercises(lid, lesson_vocab, global_vocab)

    new_content = (
        f"const ALL_LESSONS = {json.dumps(all_lessons, indent=4, ensure_ascii=False)};\n\n"
        f"const HSK_DATA = {json.dumps(hsk_data, indent=4, ensure_ascii=False)};\n\n"
        "const THEMATIC_DATA = null;\n"
    )
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully augmented lessons.")


# ─────────────────────────────────────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HSK AI Tutor")
    parser.add_argument("--serve", action="store_true", help="Start Flask AI Tutor server")
    parser.add_argument("--port", type=int, default=5050, help="Server port (default 5050)")
    args = parser.parse_args()

    if args.serve:
        print("[AITutor] Loading lesson data with pandas…")
        df, _, _ = load_lessons_df()
        stats = compute_level_stats(df)
        print(f"[AITutor] Loaded {len(df)} rows across 5 HSK levels.")
        for lvl, s in stats.items():
            print(f"  HSK {lvl}: {s['total_lessons']} lessons, {s['total_words']} vocab words")

        print("[AITutor] Initialising TensorFlow model…")
        model = AITutorModel()
        model.ensure_trained()

        app = create_flask_app(model, stats)
        print(f"[AITutor] Server running at http://localhost:{args.port}")
        app.run(host="0.0.0.0", port=args.port, debug=False)
    else:
        run_exercise_generation()
        print("Done.")
