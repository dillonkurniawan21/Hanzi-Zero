/**
 * augment_lessons.js (AiTutorBridge)
 * =================================
 * This script acts as the bridge between the browser and the Python AI backend.
 * It includes a full heuristic fallback in case the server is offline.
 */

window.AiTutor = (function() {
    const API_URL = "/api";
    let isOnline = false;

    // Check server health on load
    async function checkHealth() {
        try {
            const resp = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(1000) });
            const data = await resp.json();
            isOnline = data.status === "ok";
            console.log("[AiTutor] Backend is " + (isOnline ? "ONLINE" : "OFFLINE (Health check failed)"));
        } catch (e) {
            isOnline = false;
            console.warn("[AiTutor] Backend is OFFLINE (Connection refused)");
        }
        return isOnline;
    }

    // Heuristic Fallback Engine (for when server is offline)
    function localHeuristicAnalyze(perf) {
        const level = perf.hsk_level || 1;
        const correct = perf.correct_pct || 0.7;
        
        // Simple mock weakness calculation
        const weaknesses = {
            vocabulary: Math.max(0.1, 1 - correct),
            grammar: Math.max(0.2, (1 - correct) * 1.1),
            reading: Math.max(0.15, (1 - correct) * 0.9),
            listening: 0.3,
            writing: 0.4
        };

        const difficulty = correct > 0.8 ? "easy" : (correct > 0.5 ? "medium" : "hard");
        
        // Mock recommendations
        const recs = [`hsk${level}-1`, `hsk${level}-2`, `hsk${level}-3`].slice(0, 3);

        return {
            weaknesses,
            recommended_difficulty: difficulty,
            recommendations: recs,
            level_stats: { total_words: "??", total_lessons: "??" },
            tips: ["Keep practicing daily!", "Try to focus on character recognition."],
            offline: true
        };
    }

    const localChatResponses = {
        "hello": "Hi! I'm your AI Tutor. My server is currently offline, but I can still help with basics!",
        "hsk": "HSK is the Chinese Proficiency Test. Keep learning to reach Level 6!",
        "tone": "Mandarin has 4 tones. Try practicing them with a voice recorder!",
        "default": "I'm in offline mode right now, so my brain is a bit limited. Try starting the Python backend!"
    };

    return {
        isOnline: () => isOnline,
        
        init: async function() {
            await checkHealth();
        },

        analyze: async function(performanceData) {
            if (!isOnline) return localHeuristicAnalyze(performanceData);
            
            try {
                const resp = await fetch(`${API_URL}/analyze`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(performanceData)
                });
                return await resp.json();
            } catch (e) {
                return localHeuristicAnalyze(performanceData);
            }
        },

        getTip: async function(level) {
            if (!isOnline) return { tip: "Consistency is key to learning Hanzi!", level };
            try {
                const resp = await fetch(`${API_URL}/tip?level=${level}`);
                return await resp.json();
            } catch (e) {
                return { tip: "Keep going!", level };
            }
        },

        chat: async function(message) {
            if (!isOnline) {
                const lower = message.toLowerCase();
                let reply = localChatResponses.default;
                if (lower.includes("hi") || lower.includes("hello")) reply = localChatResponses.hello;
                else if (lower.includes("hsk")) reply = localChatResponses.hsk;
                else if (lower.includes("tone")) reply = localChatResponses.tone;
                return { response: reply, offline: true };
            }

            try {
                const resp = await fetch(`${API_URL}/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });
                return await resp.json();
            } catch (e) {
                return { response: localChatResponses.default, offline: true };
            }
        }
    };
})();
