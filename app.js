// --- State Management ---
const State = {
    xp: 120,
    coins: 500,
    hearts: 5,
    streak: 3,
    completedLessons: [],
    activityCount: 10,
    avgRandomQuizScore: 0,
    lastMonthlyQuizScore: 0,
    currentScreen: 'home',
    currentLesson: null,
    currentExerciseIndex: 0,
    selectedOptions: [],
    isQuizMode: false,
    quizTimerInterval: null,
    learningMode: 'hsk', // 'hsk' or 'thematic'
    currentTab: 'exercise',
    writingVocab: [],
    writingIndex: 0,
    hanziWriter: null,
};

// --- Button Ripple Helper ---
function addRipple(e) {
    const btn = e.currentTarget;
    const wave = document.createElement('span');
    wave.className = 'btn-ripple-wave';
    const rect = btn.getBoundingClientRect();
    wave.style.left = (e.clientX - rect.left - 5) + 'px';
    wave.style.top = (e.clientY - rect.top - 5) + 'px';
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
}
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-primary, .btn-promo-coupon, .option-btn, .lesson-node');
    if (btn) addRipple({ currentTarget: btn, clientX: e.clientX, clientY: e.clientY });
});

// --- Ranking Formula ---
function calculateRankScore(user) {
    // Formula: test (lastMonthlyQuizScore) + quiz (avgRandomQuizScore) + practice chapter (activityCount)
    return Math.floor(user.lastMonthlyQuizScore + user.avgRandomQuizScore + user.activityCount);
}

function getSortedLeaderboard() {
    const allUsers = [...HSK_DATA.leaderboard, {
        name: 'User (You)',
        xp: State.xp,
        activityCount: State.activityCount,
        avgRandomQuizScore: State.avgRandomQuizScore,
        lastMonthlyQuizScore: State.lastMonthlyQuizScore,
        avatar: '🐼',
        isMe: true
    }];

    allUsers.forEach(user => {
        user.rankScore = calculateRankScore(user);
    });

    allUsers.sort((a, b) => b.rankScore - a.rankScore);

    // Assign ranks after sorting
    allUsers.forEach((user, index) => {
        user.rank = index + 1;
    });

    return allUsers;
}

// --- DOM Elements ---
const screenContainer = document.getElementById('screen-container');
const lessonOverlay = document.getElementById('lesson-overlay');
const exerciseContainer = document.getElementById('exercise-container');
const progressBarFill = document.getElementById('lesson-progress');
const feedbackArea = document.getElementById('feedback-area');
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');

// --- Initialization ---
function init() {
    updateStats();
    renderScreen('home');
    setupNav();
    setupLessonEvents();
    initPromoSystem(); // Promotion system: ticker banner + floating pill
}

function updateStats() {
    const xpEl = document.querySelector('#stat-xp');
    if (xpEl) {
        xpEl.textContent = State.xp;
        const badge = xpEl.closest('.stat-badge');
        if (badge) { badge.classList.remove('stat-pop'); void badge.offsetWidth; badge.classList.add('stat-pop'); }
    }
    const coinsEl = document.querySelector('#stat-coins');
    if (coinsEl) {
        coinsEl.textContent = State.coins;
        const badge = coinsEl.closest('.stat-badge');
        if (badge) { badge.classList.remove('stat-pop'); void badge.offsetWidth; badge.classList.add('stat-pop'); }
    }
}

// --- Navigation ---
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screen = item.dataset.screen;
            renderScreen(screen);

            // Update active state
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll(`.nav-item[data-screen="${screen}"]`).forEach(n => n.classList.add('active'));
        });
    });
}

function renderScreen(screen) {
    State.currentScreen = screen;

    // ── Phase 1: exit animation ──
    screenContainer.classList.add('screen-exit');

    setTimeout(function () {
        screenContainer.classList.remove('screen-exit');
        screenContainer.innerHTML = '';
        screenContainer.classList.add('screen-enter');

        switch (screen) {
            case 'home': renderHomeScreen(); break;
            case 'leaderboard': renderLeaderboardScreen(); break;
            case 'events': renderEventsScreen(); break;
            case 'shop': renderShopScreen(); break;
            case 'profile': renderProfileScreen(); break;
            case 'more': renderMoreScreen(); break;
            case 'writing-quiz': renderWritingQuizScreen(); break;
        }

        // ── Stagger cards / list items / nodes ──
        var delay = 0;
        screenContainer.querySelectorAll(
            '.leaderboard-item, .shop-card, .lesson-node-wrapper, .prize-card, .milestone-card'
        ).forEach(function (el) {
            el.style.setProperty('--stagger-i', delay + 'ms');
            el.classList.add('anim-stagger');
            delay += 60;
        });

        // ── Animate lesson nodes individually ──
        screenContainer.querySelectorAll('.lesson-node-wrapper').forEach(function (el, i) {
            el.style.setProperty('--node-delay', (i * 80) + 'ms');
            el.classList.add('node-enter');
        });

        setTimeout(function () { screenContainer.classList.remove('screen-enter'); }, 600);
    }, 160);
}

// --- Screen Renderers ---

function renderEventsScreen() {
    screenContainer.innerHTML = `
        <div class="event-hero">
            <h1 style="font-size: 40px; font-weight: 800; margin-bottom: 10px; color: var(--text-main);">✨ Year-End Grand Prize ✨</h1>
            <p style="font-size: 18px; color: var(--text-muted);">Compete with the best and win amazing rewards!</p>
            
            <div class="event-prize-grid">
                <div class="prize-card highlight" style="background: var(--bg-card); border-color: var(--primary);">
                    <div class="prize-badge" style="background: var(--primary);">1st - 3rd</div>
                    <div class="prize-rank">TOP 1 - 3</div>
                    <div class="prize-icon">📱</div>
                    <div class="prize-title">iPhone 17E</div>
                    <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">The latest flagship device for our best learners.</p>
                </div>

                <div class="prize-card" style="background: var(--bg-card); border-color: var(--border);">
                    <div class="prize-rank">TOP 4 - 5</div>
                    <div class="prize-icon">💸</div>
                    <div class="prize-title">Rp 5,000,000</div>
                    <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">Cash reward credited to your GoPay/OVO.</p>
                </div>

                <div class="prize-card highlight" style="background: var(--bg-card); border-color: var(--secondary);">
                    <div class="prize-rank">TOP 1 - 5</div>
                    <div class="prize-icon">💎</div>
                    <div class="prize-title">6 Months Premium</div>
                    <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">Unlimited hearts, no ads, and advanced analytics.</p>
                </div>
            </div>

            <div style="margin-top: 40px; padding: 30px; background: var(--bg-card-glass); border-radius: 8px; border: 1px solid var(--border);">
                <h3 style="margin-bottom: 20px; color: var(--text-main);">Exclusive Benefits for Top 5:</h3>
                <ul style="text-align: left; display: inline-block; font-size: 16px; color: var(--text-muted); list-style: none;">
                    <li>✨ VIP Profile Badge "Grand Master"</li>
                    <li>✨ Early access to new HSK 6 lessons</li>
                    <li>✨ Exclusive invitation to Brand Partnership events</li>
                    <li>✨ Lifetime discount on E-commerce shop items</li>
                </ul>
            </div>

            <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-primary" style="background: white; color: var(--bg-dark);" onclick="renderScreen('leaderboard')">VIEW CURRENT RANKING</button>
                <button class="btn-primary" onclick="openCouponModal()">🎟️ REDEEM COUPON</button>
            </div>
        </div>
    `;
    injectScreenPromo();
}

function renderHomeScreen() {
    const currentLevel = HSK_DATA.levels[0];

    let html = `
        <div class="milestone-card">
            <div class="milestone-info">
                <div class="milestone-subtitle">CURRENT MILESTONE</div>
                <div class="milestone-title">HSK Level 1</div>
                <div class="milestone-desc">Mastering the fundamentals: 150 essential words and basic grammar structures for everyday communication.</div>
            </div>
            <div class="milestone-progress-container">
                <div class="milestone-progress-header">
                    <span>Progress</span>
                    <span>65%</span>
                </div>
                <div class="milestone-progress-bar">
                    <div class="milestone-progress-fill" style="width: 65%;"></div>
                </div>
            </div>
        </div>
        
        <div class="path-container">
            <svg class="path-svg" viewBox="0 0 300 800" preserveAspectRatio="none">
                <path d="M150,0 C250,150 50,300 150,450 C250,600 50,750 150,900" stroke="rgba(255,255,255,0.05)" stroke-width="30" fill="none" stroke-linecap="round"/>
            </svg>
    `;

    // Path offsets for the S-curve
    const offsets = [0, 60, -20, 40, -50, 0];

    currentLevel.lessonIds.forEach((lessonId, index) => {
        const lesson = ALL_LESSONS[lessonId];
        const isCompleted = State.completedLessons.includes(lessonId);

        let isCurrent = false;
        let isLocked = false;

        if (!isCompleted) {
            const indexInLevel = currentLevel.lessonIds.indexOf(lessonId);
            if (indexInLevel === 0) {
                isCurrent = true;
            } else {
                const prevLessonId = currentLevel.lessonIds[indexInLevel - 1];
                if (State.completedLessons.includes(prevLessonId)) {
                    isCurrent = true;
                } else {
                    isLocked = true;
                }
            }
        }

        let stateClass = isCompleted ? 'completed' : (isCurrent ? 'current' : 'locked');
        let icon = isCompleted ? '✓' : (isCurrent ? '▶' : '🔒');

        let xOffset = offsets[index % offsets.length] || 0;

        html += `
            <div class="lesson-node-wrapper" style="transform: translateX(${xOffset}px); margin-bottom: 30px;">
        `;

        if (isCurrent) {
            html += `<div class="current-tag">CURRENT</div>`;
            html += `
                <div class="mascot-container">
                    <div class="mascot-bubble">Ready for the next lesson?</div>
                    <img src="dragon_mascot.png" class="mascot-img" alt="Hanzi Zero Mascot">
                </div>
            `;
        }

        html += `
                <div class="lesson-node ${stateClass}" onclick="startLesson('${lessonId}')">
                    ${icon}
                </div>
                <div class="node-title">${lesson.title}</div>
                <div class="node-subtitle">Unit ${index + 1}</div>
            </div>
        `;
    });

    html += `
            <div class="lesson-node-wrapper" style="transform: translateX(-40px); margin-top: 20px;">
                <div class="lesson-node bonus">
                    🎁
                </div>
                <div class="node-title">Bonus Chest</div>
                <div class="node-subtitle">Unlocks at Level 10</div>
            </div>
        </div>
        
        <button class="quick-review-btn">
            ⚡ Quick Review
        </button>
    `;

    screenContainer.innerHTML = html;
    injectScreenPromo();
}

function setLearningMode(mode) {
    State.learningMode = mode;
    renderHomeScreen();
}

function renderCategoryLessons(catId) {
    const cat = THEMATIC_DATA.find(c => c.id === catId);
    let html = `
        <button class="btn-primary" style="margin-bottom: 20px; padding: 10px 20px; font-size: 14px; background: var(--bg-gray); color: var(--text-main); box-shadow: 0 4px 0 var(--border);" onclick="renderHomeScreen()">❮ BACK TO CATEGORIES</button>
        <h1 class="exercise-title">${cat.icon} ${cat.title}</h1>
        <div class="path-container">
    `;

    cat.lessonIds.forEach(lessonId => {
        const lesson = ALL_LESSONS[lessonId];
        const isCompleted = State.completedLessons.includes(lessonId);
        html += `
            <div style="display: flex; align-items: center; gap: 20px; width: 100%; max-width: 400px; padding: 15px; border: 2px solid var(--border); border-radius: 15px; margin-bottom: 10px; cursor: pointer;" onclick="startLesson('${lessonId}')">
                <div class="lesson-node ${isCompleted ? 'completed' : ''}" style="width: 50px; height: 45px; margin: 0;">
                    ${isCompleted ? '✅' : '📖'}
                </div>
                <div style="font-weight: 800;">${lesson.title}</div>
            </div>
        `;
    });

    html += `</div>`;
    screenContainer.innerHTML = html;
}

// --- Lesson Overlay Helpers ---
function showLessonOverlay() {
    lessonOverlay.classList.remove('hidden', 'overlay-exiting');
    lessonOverlay.classList.remove('overlay-entering');
    void lessonOverlay.offsetWidth; // force reflow
    lessonOverlay.classList.add('overlay-entering');
}

function hideLessonOverlay() {
    lessonOverlay.classList.add('overlay-exiting');
    setTimeout(function () {
        lessonOverlay.classList.add('hidden');
        lessonOverlay.classList.remove('overlay-entering', 'overlay-exiting');
    }, 280);
}

function startLesson(lessonId) {
    const lesson = ALL_LESSONS[lessonId];
    if (!lesson) return;

    State.isQuizMode = false;
    State.currentLesson = { ...lesson, score: 0 };
    State.currentExerciseIndex = 0;
    State.currentTab = 'exercise';

    document.getElementById('quiz-timer').classList.add('hidden');
    document.getElementById('lesson-hearts-display').classList.remove('hidden');
    showLessonOverlay();

    // Reset tabs UI
    switchLessonTab('exercise');

    renderExercise();
}

function switchLessonTab(tab) {
    State.currentTab = tab;

    // Update UI
    document.querySelectorAll('.lesson-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    if (tab === 'exercise') {
        document.getElementById('exercise-container').classList.remove('hidden');
        document.getElementById('writing-container').classList.add('hidden');
        document.querySelector('.lesson-footer').classList.remove('hidden');
    } else {
        document.getElementById('exercise-container').classList.add('hidden');
        document.getElementById('writing-container').classList.remove('hidden');
        document.querySelector('.lesson-footer').classList.add('hidden'); // Writing has its own controls or is just practice
        renderWritingPractice();
    }
}

function renderWritingPractice() {
    // Extract vocabulary if not already done for this lesson
    if (State.writingVocab.length === 0 || State.writingVocab[0].lessonId !== State.currentLesson.id) {
        extractLessonVocabulary();
    }

    if (State.writingVocab.length === 0) {
        document.getElementById('writing-container').innerHTML = `<p style="text-align:center; padding: 50px;">No characters available for writing practice in this lesson.</p>`;
        return;
    }

    const vocab = State.writingVocab[State.writingIndex];
    document.getElementById('char-index').textContent = `${State.writingIndex + 1} / ${State.writingVocab.length}`;

    // Clear previous writer
    document.getElementById('character-target').innerHTML = '';

    // Initialize HanziWriter
    State.hanziWriter = HanziWriter.create('character-target', vocab.char, {
        width: 250,
        height: 250,
        padding: 5,
        showOutline: true,
        showCharacter: false,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 100,
        strokeColor: '#58cc02', // Primary green
        outlineColor: '#eeeeee'
    });

    State.hanziWriter.quiz({
        onMistake: function (summary) {
            console.log('mistake', summary);
        },
        onComplete: function (summary) {
            const mistakes = summary.totalMistakes;
            const charScore = Math.max(0, 100 - (mistakes * 15));

            const hintEl = document.getElementById('writing-hint');
            hintEl.innerHTML = `<span style="color: var(--primary); font-weight: 800;">Perfect! Score: ${charScore}%</span>`;

            setTimeout(() => {
                hintEl.textContent = "Draw the character above!";
                if (State.writingIndex < State.writingVocab.length - 1) {
                    nextWritingChar();
                }
            }, 1500);
        }
    });
}

function extractLessonVocabulary() {
    const lesson = State.currentLesson;
    const chars = new Set();
    const vocabList = [];

    lesson.exercises.forEach(ex => {
        if (ex.type === 'matching' && ex.pairs) {
            ex.pairs.forEach(p => {
                // Split Hanzi into individual characters if it's a word
                [...p.hanzi].forEach(c => {
                    if (!chars.has(c)) {
                        chars.add(c);
                        vocabList.push({ char: c, lessonId: lesson.id });
                    }
                });
            });
        } else if (ex.answer && typeof ex.answer === 'string') {
            [...ex.answer].forEach(c => {
                // Check if it's a Chinese character (rudimentary check)
                if (c.match(/[\u4e00-\u9fa5]/) && !chars.has(c)) {
                    chars.add(c);
                    vocabList.push({ char: c, lessonId: lesson.id });
                }
            });
        }
    });

    State.writingVocab = vocabList;
    State.writingIndex = 0;
}

function prevWritingChar() {
    if (State.writingIndex > 0) {
        State.writingIndex--;
        renderWritingPractice();
    }
}

function nextWritingChar() {
    if (State.writingIndex < State.writingVocab.length - 1) {
        State.writingIndex++;
        renderWritingPractice();
    }
}

function renderLeaderboardScreen() {
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h1 class="exercise-title" style="margin-bottom: 0;">Leaderboard</h1>
            <div style="background: var(--bg-gray); padding: 5px 15px; border-radius: 10px; font-weight: 800; color: var(--text-muted);">YEAR-END RANKING</div>
        </div>
        <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-muted);">Rank based on: Test + Quiz + Practice Chapter.</p>
        <div class="leaderboard-list">
    `;

    const sortedLeaderboard = getSortedLeaderboard();

    sortedLeaderboard.forEach(user => {
        html += `
            <div class="leaderboard-item ${user.isMe ? 'user-me' : ''}">
                <div class="rank ${user.rank <= 3 ? 'rank-top' : ''}">${user.rank}</div>
                <div class="user-avatar" style="font-size: 30px;">${user.avatar}</div>
                <div class="user-name">${user.name} <br><span style="font-size: 12px; color: var(--text-muted);">Score: ${user.rankScore}</span></div>
                <div class="user-xp">${user.xp} XP</div>
            </div>
        `;
    });

    html += `
        </div>
        <div class="reward-banner" style="margin-top: 40px; background: linear-gradient(135deg, #0063e5, #00b0f0); color: white; padding: 30px; border-radius: 8px; font-weight: 800; border: 1px solid white; box-shadow: var(--glow);">
            <h3 style="letter-spacing: 2px;">🏆 YEAR-END COMPETITION</h3>
            <p style="opacity: 0.9;">Win an iPhone 17E or Rp 5,000,000!</p>
            <p style="margin-top: 10px;">Current Rank: 154</p>
            <button class="btn-primary" style="margin-top: 15px; background: white; color: var(--bg-dark);" onclick="openCouponModal()">🎟️ REDEEM COUPON</button>
        </div>
    `;
    screenContainer.innerHTML = html;
    injectScreenPromo();
}

function renderShopScreen() {
    let html = `
        <h1 class="exercise-title">Rewards Shop</h1>
        <div class="shop-grid">
    `;

    HSK_DATA.shopItems.forEach(item => {
        html += `
            <div class="shop-card">
                <div class="shop-card-icon">${item.icon}</div>
                <div class="shop-card-title">${item.name}</div>
                <div class="shop-card-price">🪙 ${item.price}</div>
                <button class="btn-primary" style="padding: 10px 20px; font-size: 14px;" 
                        onclick="buyItem('${item.id}', ${item.price})">REDEEM</button>
            </div>
        `;
    });

    html += `</div>`;
    screenContainer.innerHTML = html;
    injectScreenPromo();
}

function renderProfileScreen() {
    screenContainer.innerHTML = `
        <h1 class="exercise-title">Profile</h1>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
            <img src="dragon_mascot.png" alt="Hanzi Zero Dragon Mascot" style="width: 120px; height: 120px; border-radius: 20px; background: #20232e;">
            <div>
                <h2 style="font-size: 32px;">User (You)</h2>
                <p style="color: var(--text-muted);">Joined April 2026</p>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="border: 2px solid var(--border); padding: 20px; border-radius: 20px;">
                <p style="font-weight: 800; color: var(--text-muted);">TOTAL XP</p>
                <p style="font-size: 24px; font-weight: 800;">${State.xp}</p>
            </div>
            <div style="border: 2px solid var(--border); padding: 20px; border-radius: 20px;">
                <p style="font-weight: 800; color: var(--text-muted);">CURRENT STREAK</p>
                <p style="font-size: 24px; font-weight: 800;">${State.streak} Days</p>
            </div>
        </div>
    `;
    injectScreenPromo();
}

function renderMoreScreen() {
    screenContainer.innerHTML = `
        <h1 class="exercise-title">More</h1>
        <div class="shop-grid">
            <div class="shop-card" onclick="startMonthlyQuiz()">
                <div class="shop-card-icon">📝</div>
                <div class="shop-card-title">Test</div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">Take the monthly test to evaluate your progress.</p>
                <button class="btn-primary" style="padding: 10px 20px; font-size: 14px;">START TEST</button>
            </div>
            <div class="shop-card" onclick="startRandomQuiz()">
                <div class="shop-card-icon">🧠</div>
                <div class="shop-card-title">Quiz</div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">Test your knowledge with a random quick quiz.</p>
                <button class="btn-primary" style="padding: 10px 20px; font-size: 14px;">START QUIZ</button>
            </div>
            <div class="shop-card" onclick="renderScreen('home')">
                <div class="shop-card-icon">📚</div>
                <div class="shop-card-title">Practice Chapter</div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">Go back to the learning path to practice chapters.</p>
                <button class="btn-primary" style="padding: 10px 20px; font-size: 14px;">PRACTICE</button>
            </div>
            <div class="shop-card" onclick="renderScreen('writing-quiz')">
                <div class="shop-card-icon">✍️</div>
                <div class="shop-card-title">Writing Practice</div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">Master the art of Chinese calligraphy with interactive quizzes.</p>
                <button class="btn-primary" style="padding: 10px 20px; font-size: 14px;">START WRITING</button>
            </div>
        </div>
    `;
    injectScreenPromo();
}

// --- Lesson Logic ---

function startRandomQuiz() {
    if (State.completedLessons.length === 0) {
        alert("Please complete at least one lesson first!");
        return;
    }

    // Gather all exercises from completed lessons
    let allExercises = [];
    Object.values(ALL_LESSONS).forEach(lesson => {
        if (State.completedLessons.includes(lesson.id) && lesson.exercises && lesson.exercises.length > 0) {
            allExercises = allExercises.concat(lesson.exercises);
        }
    });

    // In a real app, we'd shuffle and pick 5. For prototype, we just take available ones.
    const quizExercises = allExercises.sort(() => 0.5 - Math.random()).slice(0, 5);

    if (quizExercises.length === 0) {
        alert("Not enough exercises available yet. Keep learning!");
        return;
    }

    State.isQuizMode = 'random';
    State.currentLesson = { id: 'random-quiz', title: 'Daily Random Quiz', exercises: quizExercises, score: 0 };
    State.currentExerciseIndex = 0;

    document.getElementById('quiz-timer').classList.add('hidden');
    document.getElementById('lesson-hearts-display').classList.add('hidden'); // Unlimited hearts in quiz
    showLessonOverlay();
    renderExercise();
}

function startMonthlyQuiz() {
    // Collect all exercises from all lessons in the pool
    let allExercises = [];
    Object.values(ALL_LESSONS).forEach(lesson => {
        if (lesson.exercises && lesson.exercises.length > 0) {
            allExercises = allExercises.concat(lesson.exercises);
        }
    });

    const quizExercises = allExercises.sort(() => 0.5 - Math.random()).slice(0, 10);

    State.isQuizMode = 'monthly';
    State.currentLesson = { id: 'monthly-quiz', title: 'Monthly Evaluation', exercises: quizExercises, score: 0 };
    State.currentExerciseIndex = 0;

    document.getElementById('lesson-hearts-display').classList.add('hidden');

    // Setup Timer
    const timerEl = document.getElementById('quiz-timer');
    timerEl.classList.remove('hidden');
    let timeLeft = 15 * 60; // 15 minutes in seconds

    clearInterval(State.quizTimerInterval);
    State.quizTimerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        timerEl.textContent = `⏱️ ${mins}:${secs}`;

        if (timeLeft <= 0) {
            clearInterval(State.quizTimerInterval);
            alert("Time's up! Submitting quiz.");
            completeLesson();
        }
    }, 1000);

    showLessonOverlay();
    renderExercise();
}

function renderExercise() {
    const exercise = State.currentLesson.exercises[State.currentExerciseIndex];
    State.selectedOptions = [];
    checkBtn.disabled = true;
    feedbackArea.className = 'feedback-hidden';
    checkBtn.classList.remove('hidden');

    const progress = (State.currentExerciseIndex / State.currentLesson.exercises.length) * 100;
    progressBarFill.style.width = `${progress}%`;

    let html = `<h2 class="exercise-title">${exercise.question}</h2>`;

    if (exercise.type === 'matching') {
        html += `<div class="options-grid">`;
        exercise.pairs.forEach((pair, idx) => {
            html += `<button class="option-btn" onclick="selectOption('${pair.hanzi}')">${pair.hanzi} (${pair.pinyin})</button>`;
        });
        html += `</div>`;
    } else if (exercise.type === 'translate') {
        html += `<div class="options-grid">`;
        exercise.options.forEach(opt => {
            html += `<button class="option-btn" onclick="toggleOption('${opt}', this)">${opt}</button>`;
        });
        html += `</div>`;
        html += `<div id="sentence-preview" style="margin-top: 30px; padding: 20px; border-bottom: 2px solid var(--border); min-height: 60px; font-size: 24px; font-weight: 600;"></div>`;
    } else if (exercise.type === 'fill_blank') {
        html += `<div class="options-grid">`;
        exercise.options.forEach(opt => {
            html += `<button class="option-btn" onclick="selectOption('${opt}')">${opt}</button>`;
        });
        html += `</div>`;
    }

    exerciseContainer.innerHTML = html;

    // ── Stagger option buttons ──
    exerciseContainer.querySelectorAll('.option-btn').forEach(function (btn, i) {
        btn.classList.add('option-enter');
        btn.style.setProperty('--opt-delay', (i * 55) + 'ms');
    });
}

function toggleOption(word, btn) {
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        State.selectedOptions = State.selectedOptions.filter(w => w !== word);
    } else {
        btn.classList.add('selected');
        State.selectedOptions.push(word);
    }

    const preview = document.getElementById('sentence-preview');
    if (preview) preview.textContent = State.selectedOptions.join(' ');

    checkBtn.disabled = State.selectedOptions.length === 0;
}

function selectOption(val) {
    // Simplified selection for matching
    State.selectedOptions = [val];
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    event.target.classList.add('selected');
    checkBtn.disabled = false;
}

function setupLessonEvents() {
    if (State.quizTimerInterval) {
        clearInterval(State.quizTimerInterval);
    }

    checkBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', nextExercise);
    document.getElementById('close-lesson').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit? You will lose progress.')) {
            if (State.quizTimerInterval) clearInterval(State.quizTimerInterval);
            hideLessonOverlay();
        }
    });
}

function checkAnswer() {
    const exercise = State.currentLesson.exercises[State.currentExerciseIndex];
    let isCorrect = false;

    if (exercise.type === 'translate') {
        isCorrect = JSON.stringify(State.selectedOptions) === JSON.stringify(exercise.answer);
    } else if (exercise.type === 'fill_blank') {
        isCorrect = State.selectedOptions[0] === exercise.answer;
    } else if (exercise.type === 'matching') {
        // Simplified: check if the selected option is a correct pair member
        const selected = State.selectedOptions[0];
        isCorrect = exercise.pairs.some(p => p.hanzi === selected);
    }

    if (isCorrect) {
        State.currentLesson.score += 1;
    }

    feedbackArea.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
    feedbackArea.querySelector('.feedback-title').textContent = isCorrect ? 'Correct!' : 'Incorrect';

    checkBtn.classList.add('hidden');
}

function nextExercise() {
    State.currentExerciseIndex++;
    if (State.currentExerciseIndex >= State.currentLesson.exercises.length) {
        completeLesson();
    } else {
        renderExercise();
    }
}

function completeLesson() {
    if (State.quizTimerInterval) clearInterval(State.quizTimerInterval);

    const totalQuestions = State.currentLesson.exercises.length;
    const finalScore = Math.round((State.currentLesson.score / totalQuestions) * 100);

    if (State.isQuizMode === 'random') {
        State.avgRandomQuizScore = finalScore;
        alert(`Random Quiz Completed! Score: ${finalScore}%`);
    } else if (State.isQuizMode === 'monthly') {
        State.lastMonthlyQuizScore = finalScore;
        alert(`Monthly Evaluation Completed! Score: ${finalScore}%`);
    } else {
        State.xp += 20;
        State.coins += 10;
        if (!State.completedLessons.includes(State.currentLesson.id)) {
            State.completedLessons.push(State.currentLesson.id);
        }
        alert('Lesson Completed! +20 XP, +10 Coins');
    }

    State.activityCount += 1; // Increment activity

    // ── Celebrate on lesson complete ──
    if (!State.isQuizMode || State.isQuizMode === false) {
        document.querySelectorAll('.stat-badge').forEach(function (b) {
            b.classList.remove('celebrate');
            void b.offsetWidth;
            b.classList.add('celebrate');
            setTimeout(function () { b.classList.remove('celebrate'); }, 700);
        });
    }

    hideLessonOverlay();
    setTimeout(function () {
        updateStats();
        renderScreen('home');
    }, 300); // wait for overlay exit
}

function buyItem(id, price) {
    if (State.coins >= price) {
        State.coins -= price;
        updateStats();
        alert('Item Redeemed successfully!');
    } else {
        alert('Not enough coins!');
    }
}

// Start the app
init();
