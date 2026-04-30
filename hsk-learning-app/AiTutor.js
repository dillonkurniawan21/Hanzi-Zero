/**
 * AiTutor.js
 * ==========
 * The UI layer for the AI Tutor. Renders the floating button, 
 * the slide-in tutor panel, chat widget, and data visualizations.
 */

const AiTutorUI = (function() {
    let panelOpen = false;
    let selectedLevel = 1;

    function createStyles() {
        if (document.getElementById('ai-tutor-styles')) return;
        const style = document.createElement('style');
        style.id = 'ai-tutor-styles';
        style.innerHTML = `
            #ai-tutor-btn {
                position: fixed;
                bottom: 100px;
                left: 30px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #6e8efb, #a777e3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(110, 142, 251, 0.4);
                z-index: 1000;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                font-size: 28px;
            }
            #ai-tutor-btn:hover { transform: scale(1.1) rotate(5deg); }
            #ai-tutor-btn.pulse { animation: tutorPulse 2s infinite; }
            @keyframes tutorPulse {
                0% { box-shadow: 0 0 0 0 rgba(110, 142, 251, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(110, 142, 251, 0); }
                100% { box-shadow: 0 0 0 0 rgba(110, 142, 251, 0); }
            }

            #ai-tutor-panel {
                position: fixed;
                top: 0;
                left: -400px;
                width: 400px;
                height: 100%;
                background: var(--bg-sidebar);
                border-right: 1px solid var(--border);
                z-index: 2000;
                transition: left 0.4s cubic-bezier(0.77, 0, 0.175, 1);
                display: flex;
                flex-direction: column;
                box-shadow: 10px 0 30px rgba(0,0,0,0.5);
            }
            #ai-tutor-panel.open { left: 0; }

            .tutor-header {
                padding: 25px;
                background: linear-gradient(90deg, #1a1d29, #252a3d);
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .tutor-title { font-size: 20px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px; }
            .tutor-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 20px; }

            .tutor-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                scrollbar-width: thin;
            }

            .tutor-tabs {
                display: flex;
                gap: 5px;
                margin-bottom: 20px;
                background: rgba(0,0,0,0.2);
                padding: 5px;
                border-radius: 10px;
            }
            .tutor-tab {
                flex: 1;
                padding: 8px;
                border: none;
                background: none;
                color: var(--text-muted);
                cursor: pointer;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
            }
            .tutor-tab.active { background: var(--primary); color: #fff; }

            .tutor-section-title { font-size: 14px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 25px 0 15px; display: flex; align-items: center; gap: 8px; }
            
            .analysis-card {
                background: var(--bg-card);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid var(--border);
            }
            
            .weakness-row { margin-bottom: 12px; }
            .weakness-label { font-size: 12px; color: var(--text-main); margin-bottom: 5px; display: flex; justify-content: space-between; }
            .weakness-bar-bg { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
            .weakness-bar-fill { height: 100%; background: var(--primary); transition: width 0.8s ease-out; }

            .rec-lesson {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: rgba(255,255,255,0.03);
                border-radius: 10px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .rec-lesson:hover { background: rgba(255,255,255,0.07); }
            .rec-icon { font-size: 20px; }
            .rec-info { flex: 1; }
            .rec-name { font-size: 13px; font-weight: 600; }
            .rec-diff { font-size: 10px; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; }
            .diff-easy { background: #4caf5022; color: #4caf50; }
            .diff-medium { background: #ff980022; color: #ff9800; }
            .diff-hard { background: #f4433622; color: #f44336; }

            .chat-container {
                height: 250px;
                display: flex;
                flex-direction: column;
                background: rgba(0,0,0,0.15);
                border-radius: 15px;
                border: 1px solid var(--border);
            }
            .chat-messages { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
            .chat-msg { max-width: 85%; padding: 10px 14px; border-radius: 15px; font-size: 13px; line-height: 1.4; }
            .msg-ai { align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); border-bottom-left-radius: 2px; }
            .msg-user { align-self: flex-end; background: var(--primary); color: #fff; border-bottom-right-radius: 2px; }
            
            .chat-input-row { padding: 10px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
            .chat-input { flex: 1; background: none; border: none; color: #fff; font-size: 13px; outline: none; }
            .chat-send { background: var(--primary); border: none; color: #fff; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

            .offline-badge { font-size: 10px; background: #f44336; color: #fff; padding: 2px 6px; border-radius: 4px; margin-left: 10px; }
            .radar-placeholder { height: 150px; background: rgba(255,255,255,0.02); border-radius: 50%; margin: 10px auto; width: 150px; border: 1px dashed var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 10px; text-align: center; }
        `;
        document.head.appendChild(style);
    }

    async function updatePanel() {
        const content = document.querySelector('.tutor-content');
        if (!content) return;

        // Fetch analysis (using mock performance for now)
        const perf = { hsk_level: selectedLevel, correct_pct: 0.75, attempts: 12, streak: 5 };
        const data = await window.AiTutor.analyze(perf);

        const isOnline = window.AiTutor.isOnline();
        const offlineBadge = isOnline ? '' : '<span class="offline-badge">OFFLINE MODE</span>';

        content.innerHTML = `
            <div class="tutor-tabs">
                ${[1,2,3,4,5].map(l => `<button class="tutor-tab ${selectedLevel === l ? 'active' : ''}" onclick="AiTutorUI.setLevel(${l})">HSK ${l}</button>`).join('')}
            </div>

            <div class="tutor-section-title">📊 Performance Analysis ${offlineBadge}</div>
            <div class="analysis-card">
                <div class="radar-placeholder">Neural Network Analysis<br>(TensorFlow Inference)</div>
                ${Object.entries(data.weaknesses).map(([skill, val]) => `
                    <div class="weakness-row">
                        <div class="weakness-label">
                            <span>${skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                            <span>${Math.round(val * 100)}%</span>
                        </div>
                        <div class="weakness-bar-bg">
                            <div class="weakness-bar-fill" style="width: ${val * 100}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="tutor-section-title">🎯 Recommended Lessons</div>
            <div class="rec-list">
                ${data.recommendations.map(id => {
                    const lesson = typeof ALL_LESSONS !== 'undefined' ? ALL_LESSONS[id] : null;
                    return `
                        <div class="rec-lesson" onclick="startLesson('${id}')">
                            <div class="rec-icon">📖</div>
                            <div class="rec-info">
                                <div class="rec-name">${lesson ? lesson.title : id}</div>
                                <div class="rec-diff diff-${data.recommended_difficulty}">${data.recommended_difficulty}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="tutor-section-title">💬 Chat with AI Tutor</div>
            <div class="chat-container">
                <div class="chat-messages" id="tutor-chat-box">
                    <div class="chat-msg msg-ai">Hello! I'm your AI Tutor. How can I help you with HSK Level ${selectedLevel} today?</div>
                </div>
                <div class="chat-input-row">
                    <input type="text" class="chat-input" id="tutor-chat-input" placeholder="Ask about grammar, tones..." onkeydown="if(event.key==='Enter')AiTutorUI.sendMessage()">
                    <button class="chat-send" onclick="AiTutorUI.sendMessage()">➔</button>
                </div>
            </div>

            <div class="tutor-section-title">💡 Study Tip</div>
            <div class="analysis-card" style="font-size: 13px; line-height: 1.5; color: var(--text-main); font-style: italic;">
                "${data.tips ? data.tips[0] : 'Consistency is key to mastering Mandarin!'}"
            </div>
        `;
    }

    return {
        init: function() {
            createStyles();
            const btn = document.createElement('div');
            btn.id = 'ai-tutor-btn';
            btn.className = 'pulse';
            btn.innerHTML = '🤖';
            btn.onclick = this.toggle;
            document.body.appendChild(btn);

            const panel = document.createElement('div');
            panel.id = 'ai-tutor-panel';
            panel.innerHTML = `
                <div class="tutor-header">
                    <div class="tutor-title">🤖 AI Tutor</div>
                    <button class="tutor-close" onclick="AiTutorUI.toggle()">✕</button>
                </div>
                <div class="tutor-content"></div>
            `;
            document.body.appendChild(panel);
            window.AiTutor.init();
        },

        toggle: function() {
            panelOpen = !panelOpen;
            const panel = document.getElementById('ai-tutor-panel');
            const btn = document.getElementById('ai-tutor-btn');
            if (panelOpen) {
                panel.classList.add('open');
                btn.classList.remove('pulse');
                updatePanel();
            } else {
                panel.classList.remove('open');
                btn.classList.add('pulse');
            }
        },

        setLevel: function(l) {
            selectedLevel = l;
            updatePanel();
        },

        sendMessage: async function() {
            const input = document.getElementById('tutor-chat-input');
            const box = document.getElementById('tutor-chat-box');
            const text = input.value.trim();
            if (!text) return;

            // Add user message
            const uMsg = document.createElement('div');
            uMsg.className = 'chat-msg msg-user';
            uMsg.textContent = text;
            box.appendChild(uMsg);
            input.value = '';
            box.scrollTop = box.scrollHeight;

            // Fetch AI response
            const data = await window.AiTutor.chat(text);
            const aMsg = document.createElement('div');
            aMsg.className = 'chat-msg msg-ai';
            aMsg.textContent = data.response;
            box.appendChild(aMsg);
            box.scrollTop = box.scrollHeight;
        }
    };
})();

// Wait for app to be ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => AiTutorUI.init(), 1000);
});
