let quizWriter = null;
let quizChars = [];
let quizIndex = 0;
let sessionScores = [];

function renderWritingQuizScreen() {
    // Collect all characters from all lessons in ALL_LESSONS
    const allChars = new Set();
    Object.values(ALL_LESSONS).forEach(lesson => {
        if (lesson.exercises) {
            lesson.exercises.forEach(ex => {
                if (ex.type === 'matching' && ex.pairs) {
                    ex.pairs.forEach(p => {
                        [...p.hanzi].forEach(c => {
                            if (c.match(/[\u4e00-\u9fa5]/)) allChars.add(c);
                        });
                    });
                }
            });
        }
    });

    // Fallback if no characters found
    if (allChars.size === 0) {
        allChars.add('好');
        allChars.add('你');
        allChars.add('学');
        allChars.add('习');
    }

    // Pick 10 random characters
    quizChars = Array.from(allChars).sort(() => Math.random() - 0.5).slice(0, 10);
    quizIndex = 0;
    sessionScores = [];

    const container = document.getElementById('screen-container');
    container.innerHTML = `
        <div class="dedicated-quiz-wrapper">
            <div class="dedicated-quiz-header" style="border-bottom: 1px solid var(--border); padding: 30px 0; margin-bottom: 40px;">
                <button class="btn-back" onclick="renderScreen('more')" style="background: none; border: none; font-size: 14px; font-weight: 800; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 1.5px;">❮ BACK</button>
                <h1 class="exercise-title" style="margin: 0; color: var(--text-main);">Writing Practice</h1>
                <div style="width: 80px;"></div> <!-- Spacer -->
            </div>
            
            <div class="dedicated-quiz-body">
                <div class="quiz-card">
                    <div class="quiz-nav">
                        <button class="btn-secondary" onclick="prevQuizChar()" style="background: var(--bg-card-glass); border: 1px solid var(--border); color: white; width: 40px; height: 40px; border-radius: 4px;">←</button>
                        <span id="quiz-char-index" style="font-size: 20px; letter-spacing: 2px;">${quizIndex + 1} / ${quizChars.length}</span>
                        <button class="btn-secondary" onclick="nextQuizChar()" style="background: var(--bg-card-glass); border: 1px solid var(--border); color: white; width: 40px; height: 40px; border-radius: 4px;">→</button>
                    </div>
                    
                    <div id="quiz-char-target-container" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                        <div id="quiz-char-target"></div>
                    </div>
                    
                    <div class="quiz-controls">
                        <button id="start-quiz-btn" class="btn-primary quiz-ctrl-btn">START QUIZ</button>
                        <button id="show-demo-btn" class="btn-primary quiz-ctrl-btn" style="background: #31343e; color: white; border-color: var(--border);">SHOW DEMO</button>
                        <button id="reset-quiz-btn" class="btn-primary quiz-ctrl-btn" style="background: none; border-color: transparent; color: var(--text-muted);">RESET</button>
                    </div>
                    
                    <p id="quiz-status" style="letter-spacing: 1px; text-transform: uppercase; font-size: 14px;">Ready to practice?</p>
                </div>
            </div>
        </div>
    `;

    initQuizWriter();
}

function initQuizWriter() {
    const char = quizChars[quizIndex];
    document.getElementById('quiz-char-index').textContent = `${quizIndex + 1} / ${quizChars.length}`;
    document.getElementById('quiz-char-target').innerHTML = '';
    document.getElementById('quiz-status').textContent = 'Ready to practice?';
    document.getElementById('quiz-status').style.color = 'var(--text-muted)';

    quizWriter = HanziWriter.create('quiz-char-target', char, {
        width: 250,
        height: 250,
        padding: 12,
        showOutline: true,
        outlineColor: '#D9D9D9',
        showCharacter: false,
        highlightOnComplete: true,
        drawingColor: '#111111',
        strokeColor: '#111111',
        highlightColor: 'rgba(0, 0, 0, 0.2)',
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 250
    });

    setupQuizButtons();
}

function setupQuizButtons() {
    document.getElementById('show-demo-btn').onclick = async () => {
        quizWriter.cancelQuiz();
        await quizWriter.animateCharacter();
    };

    document.getElementById('start-quiz-btn').onclick = () => {
        document.getElementById('quiz-status').textContent = 'Writing...';
        quizWriter.quiz({
            leniency: 1,
            showHintAfterMisses: 1,
            highlightOnComplete: true,
            onMistake: function (strokeData) {
                document.getElementById('quiz-status').textContent = 'Try again!';
                document.getElementById('quiz-status').style.color = 'var(--accent)';
            },
            onCorrectStroke: function (strokeData) {
                document.getElementById('quiz-status').textContent = 'Great stroke!';
                document.getElementById('quiz-status').style.color = 'var(--primary)';
            },
            onComplete: function (summary) {
                const char = quizChars[quizIndex];
                // Strict scoring: penalty for every mistake
                // We'll estimate stroke count from the writer object if possible, or just use a base
                const strokeCount = summary.character.length * 5; // Rough estimate or we could get actual
                const mistakes = summary.totalMistakes;
                const charScore = Math.max(0, 100 - (mistakes * 15)); // 15% penalty per mistake - very strict!

                sessionScores.push(charScore);

                document.getElementById('quiz-status').innerHTML = `
                    <span style="color: var(--primary)">Fantastic! Score: ${charScore}%</span>
                `;

                setTimeout(() => {
                    if (quizIndex < quizChars.length - 1) {
                        nextQuizChar();
                    } else {
                        showFinalResults();
                    }
                }, 1500);
            }
        });
    };

    document.getElementById('reset-quiz-btn').onclick = () => {
        quizWriter.cancelQuiz();
        quizWriter.hideCharacter();
        quizWriter.showOutline();
        document.getElementById('quiz-status').textContent = 'Reset! Ready again.';
        document.getElementById('quiz-status').style.color = 'var(--text-muted)';
    };
}

function prevQuizChar() {
    if (quizIndex > 0) {
        quizIndex--;
        initQuizWriter();
    }
}

function nextQuizChar() {
    if (quizIndex < quizChars.length - 1) {
        quizIndex++;
        initQuizWriter();
    }
}

function showFinalResults() {
    const avgScore = Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length);
    let rank = 'C';
    let message = 'Keep practicing!';
    let color = 'var(--accent)';

    if (avgScore >= 95) { rank = 'S'; message = 'Calligraphy Master!'; color = 'var(--warning)'; }
    else if (avgScore >= 85) { rank = 'A'; message = 'Excellent Work!'; color = 'var(--primary)'; }
    else if (avgScore >= 70) { rank = 'B'; message = 'Good Job!'; color = 'var(--secondary)'; }

    const container = document.getElementById('screen-container');
    container.innerHTML = `
        <div class="dedicated-quiz-wrapper">
            <div class="dedicated-quiz-header">
                <button class="btn-back" onclick="renderScreen('more')">❮ BACK</button>
                <h1 class="exercise-title">Practice Results</h1>
                <div style="width: 60px;"></div>
            </div>
            
            <div class="dedicated-quiz-body">
                <div class="quiz-card result-card">
                    <div class="result-rank" style="font-size: 80px; font-weight: 800; color: ${color}; margin-bottom: 10px;">${rank}</div>
                    <div class="result-score" style="font-size: 32px; font-weight: 800;">${avgScore}%</div>
                    <p style="font-weight: 700; color: var(--text-muted); margin-bottom: 30px;">${message}</p>
                    
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn-primary" onclick="renderWritingQuizScreen()">PRACTICE AGAIN</button>
                        <button class="btn-primary" style="background: var(--bg-gray); color: var(--text-main); box-shadow: 0 4px 0 var(--border);" onclick="renderScreen('more')">BACK TO MENU</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
