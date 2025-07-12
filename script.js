
// --- DOM Elements ---
const mascotEl = document.getElementById('mascot');
const playerNameEl = document.getElementById('player-name');
const streakCounterEl = document.getElementById('streak-counter');
const achievementsUnlockedEl = document.getElementById('achievements-unlocked');
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const themeOptionsContainer = document.getElementById('theme-options-container');
const toastEl = document.getElementById('toast-notification');
const toastTextEl = document.getElementById('toast-text');
const quoteTextEl = document.getElementById('quote-text');
const skeletonLoader = document.getElementById('skeleton-loader');
const questionContent = document.getElementById('question-content');
const shareTwitterBtn = document.getElementById('share-twitter-btn');
const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
const shareCopyBtn = document.getElementById('share-copy-btn');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const nextBtn = document.getElementById('next-btn');
const bookmarkBtn = document.getElementById('bookmark-btn');
const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
const startBookmarkedBtn = document.getElementById('start-bookmarked-btn');
const reviewMistakesBtn = document.getElementById('review-mistakes-btn');
const yearSelect = document.getElementById('year-select');
const moduleSelect = document.getElementById('module-select');
const topicSelect = document.getElementById('topic-select');
const questionCountSelect = document.getElementById('question-count-select');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const questionImageEl = document.getElementById('question-image');
const questionTextEl = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices-container');
const explanationBox = document.getElementById('explanation-box');
const explanationText = document.getElementById('explanation-text');
const finalScoreEl = document.getElementById('final-score');
const progressBarEl = document.getElementById('progress-bar');
const timerModeSelect = document.getElementById('timer-mode-select');
const timerContainer = document.getElementById('timer-container');

// --- App Shell and Navigation Elements ---
const appShell = document.getElementById('app-shell');
const appContent = document.getElementById('app-content');
const allScreens = document.querySelectorAll('#app-content > .screen');
const tabBar = document.getElementById('tab-bar');
const tabButtons = document.querySelectorAll('.tab-btn');
const playerAvatarEl = document.getElementById('player-avatar');

// --- NEW: Auth Elements ---
const authScreen = document.getElementById('auth-screen');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');


// --- Player Data, Themes, Achievements, and Quotes ---
let playerData = {}; // This will now be populated from Supabase
const themes = {
    'theme-dark-blue': { name: 'Deep Blue', color: '#3A41C9' },
    'theme-forest': { name: 'Forest', color: '#166534' },
    'theme-rose-gold': { name: 'Rose Gold', color: '#fdf2f8' }
};
const achievementsList = { // This is now a reference/default structure
    firstQuiz: { name: "First Step", unlocked: false },
    perfectScore: { name: "Perfectionist", unlocked: false },
    dailyPlayer: { name: "Consistent", unlocked: false },
    streak5: { name: "On Fire!", unlocked: false },
    bookmark5: { name: "Librarian", unlocked: false }
};
const motivationalQuotes = [
    "The expert in anything was once a beginner.", "Strive for progress, not perfection.",
    "The secret of getting ahead is getting started.", "Well done is better than well said.",
    "A little progress each day adds up to big results.", "Believe you can and you're halfway there."
];

// --- State Variables ---
let quizStructure = {};
let masterQuestionList = [];
let bookmarkedQuestions = [];
let incorrectlyAnswered = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 20;
let isTimerMode = true;

// --- Data Management & UI Updates (Now with Supabase) ---
// loadPlayerData is removed. Data is loaded on auth change.

async function savePlayerData() {
    const user = (await db.auth.getUser()).data.user;
    if (!user) return;

    // We only update fields that can change during a session
    const { error } = await db.from('profiles').update({
        username: playerData.username,
        theme: playerData.theme,
        last_played_date: playerData.last_played_date,
        streak: playerData.streak,
        achievements: playerData.achievements,
        quizzes_completed: playerData.quizzes_completed
    }).eq('id', user.id);

    if (error) {
        console.error('Error saving player data:', error);
        showToast('Error: Could not save progress.');
    }
}

function updateUI() {
    if (!playerData.username) return; // Don't update UI if no data
    const playerName = playerData.username || 'Player';
    playerNameEl.textContent = playerName;
    playerAvatarEl.textContent = playerName.charAt(0).toUpperCase() || 'P';
    streakCounterEl.textContent = playerData.streak || 0;
    document.body.className = playerData.theme || 'theme-dark-blue';
    const unlockedCount = Object.values(playerData.achievements || {}).filter(a => a.unlocked).length;
    achievementsUnlockedEl.textContent = `${unlockedCount}/${Object.keys(achievementsList).length}`;
}

function populateThemeOptions() {
    themeOptionsContainer.innerHTML = '';
    for (const themeClass in themes) {
        const option = document.createElement('button');
        option.className = 'theme-option';
        option.style.backgroundColor = themes[themeClass].color;
        if (themeClass === 'theme-rose-gold') option.style.borderColor = '#fda4af';
        if (playerData.theme === themeClass) option.classList.add('selected');
        option.onclick = async () => { // Make async
            playerData.theme = themeClass;
            updateUI(); // Update immediately for responsiveness
            populateThemeOptions();
            await savePlayerData(); // Save to backend
        };
        themeOptionsContainer.appendChild(option);
    }
}

function showToast(message, isError = false) {
    toastTextEl.textContent = message;
    toastEl.style.backgroundColor = isError ? 'var(--red)' : 'var(--green)';
    toastEl.classList.add('show');
    setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

async function unlockAchievement(id) {
    if (!playerData.achievements[id] || playerData.achievements[id].unlocked) return;
    playerData.achievements[id].unlocked = true;
    showToast(`Achievement Unlocked: ${playerData.achievements[id].name}`);
    updateUI();
    await savePlayerData();
}

async function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (playerData.last_played_date === today) return;

    const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    playerData.streak = (playerData.last_played_date === yesterday) ? (playerData.streak || 0) + 1 : 1;
    
    if (playerData.streak > 1) {
        showToast(`Streak extended to ${playerData.streak} days!`);
    }
    
    playerData.last_played_date = today;
    await unlockAchievement('dailyPlayer');
    if (playerData.streak >= 5) await unlockAchievement('streak5');
}

// --- Utility Functions ---
function triggerConfetti() { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, zIndex: 1000 }); }
const playSound = (sound) => { try { new Audio(`assets/sounds/${sound}.mp3`).play(); } catch (e) { console.warn("Sound could not be played.", e); } };

// --- Screen Management for App Shell ---
const showScreen = (screenId) => {
    allScreens.forEach(s => s.classList.add('hidden'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === screenId);
    });
    const isImmersive = screenId === 'quiz-screen' || screenId === 'end-screen';
    appShell.classList.toggle('in-quiz-mode', isImmersive);
};

// --- Bookmark Management (Now uses local storage for simplicity, but could be moved to a Supabase table) ---
const loadBookmarks = () => {
    const saved = localStorage.getItem('medQuizBookmarks');
    bookmarkedQuestions = saved ? JSON.parse(saved) : [];
    startBookmarkedBtn.classList.toggle('hidden', bookmarkedQuestions.length === 0);
};
const saveBookmarks = () => {
    localStorage.setItem('medQuizBookmarks', JSON.stringify(bookmarkedQuestions));
    startBookmarkedBtn.classList.toggle('hidden', bookmarkedQuestions.length === 0);
};

// --- Core App Logic (Now triggered by Auth) ---
async function initializeApp() {
    // This function now only handles non-user-specific setup
    loadBookmarks();
    try {
        const response = await fetch('data/manifest.json');
        if (!response.ok) throw new Error('Manifest not found');
        quizStructure = await response.json();
        populateYears();
        preloadAllQuestions();
    } catch (error) {
        console.error("Could not initialize app:", error);
        alert("Failed to load critical app data.");
    }
}

async function loadUserAndStartApp() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { data, error } = await db.from('profiles').select('*').eq('id', user.id).single();

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    playerData = data;
    // Ensure achievements object is valid
    if (!playerData.achievements || typeof playerData.achievements !== 'object') {
        playerData.achievements = achievementsList;
    } else {
        // Merge with defaults to add new achievements if they exist
        playerData.achievements = { ...achievementsList, ...playerData.achievements };
    }

    updateUI();
    populateThemeOptions();

    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    showScreen('start-screen');
}


async function preloadAllQuestions() {
    const allFilePaths = [];
    for (const year in quizStructure) for (const module in quizStructure[year]) for (const topic in quizStructure[year][module]) {
        allFilePaths.push(quizStructure[year][module][topic]);
    }
    const allPromises = allFilePaths.map(path => fetch(path).then(res => res.ok ? res.json() : Promise.reject()).catch(() => []));
    masterQuestionList = (await Promise.all(allPromises)).flat();
    console.log(`Preloaded ${masterQuestionList.length} questions in total.`);
}

function populateYears() {
    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    Object.keys(quizStructure).forEach(year => yearSelect.add(new Option(year, year)));
    populateModules('');
}
function populateModules(selectedYear) {
    moduleSelect.innerHTML = '<option value="">Select Module...</option>';
    moduleSelect.disabled = true;
    if (selectedYear && quizStructure[selectedYear]) {
        Object.keys(quizStructure[selectedYear]).forEach(module => moduleSelect.add(new Option(module, module)));
        moduleSelect.disabled = false;
    }
    populateTopics('', '');
}
function populateTopics(selectedYear, selectedModule) {
    topicSelect.innerHTML = '<option value="">Select Topic...</option>';
    topicSelect.disabled = true;
    startBtn.disabled = true;
    if (selectedYear && selectedModule && quizStructure[selectedYear][selectedModule]) {
        Object.keys(quizStructure[selectedYear][selectedModule]).forEach(topic => topicSelect.add(new Option(topic, topic)));
        topicSelect.disabled = false;
    }
}

// --- Quiz Lifecycle ---
async function setupAndStartQuiz(questionArray, mode = "standard") {
    if (!questionArray || questionArray.length === 0) { alert(mode === 'bookmarks' ? 'You have no bookmarked questions!' : 'No questions available.'); return; }
    await updateStreak(); // Await this to ensure it completes
    const count = questionCountSelect.value;
    isTimerMode = timerModeSelect.value === 'timed';
    timerContainer.style.display = isTimerMode ? 'flex' : 'none';
    questions = mode === 'standard' && count !== 'all' ? [...questionArray].slice(0, parseInt(count, 10)) : [...questionArray];
    currentQuestionIndex = 0; score = 0; incorrectlyAnswered = [];
    scoreEl.textContent = 0; reviewMistakesBtn.classList.add('hidden');
    progressBarEl.style.width = '0%';
    skeletonLoader.classList.remove('hidden');
    questionContent.classList.add('hidden');
    showScreen('quiz-screen');
    setTimeout(() => { displayQuestion(); }, 500);
}

async function startTopicQuiz() {
    playSound('click');
    const filePath = quizStructure[yearSelect.value]?.[moduleSelect.value]?.[topicSelect.value];
    if (!filePath) return;
    try {
        const response = await fetch(filePath); let questionsForTopic = await response.json();
        setupAndStartQuiz(questionsForTopic.sort(() => Math.random() - 0.5), 'standard');
    } catch (e) { alert('Could not load this topic.'); }
}

function startDailyChallenge() { playSound('click'); if (masterQuestionList.length === 0) { alert("Questions are loading, please wait."); return; } setupAndStartQuiz([...masterQuestionList].sort(() => Math.random() - 0.5).slice(0, 20), 'daily'); }
function startBookmarkedQuiz() { playSound('click'); const bookmarkedFullQuestions = masterQuestionList.filter(q => bookmarkedQuestions.includes(q.question)); setupAndStartQuiz(bookmarkedFullQuestions.sort(() => Math.random() - 0.5), 'bookmarks'); }
function startReviewQuiz() { playSound('click'); setupAndStartQuiz(incorrectlyAnswered.map(item => item.question).sort(() => Math.random() - 0.5), 'review'); }
function restartQuiz() { playSound('click'); showScreen('start-screen'); }

// --- Gameplay ---
function displayQuestion() {
    skeletonLoader.classList.add('hidden');
    questionContent.classList.remove('hidden');
    explanationBox.classList.add('hidden'); nextBtn.classList.add('hidden');
    if (currentQuestionIndex >= questions.length) { endQuiz(); return; }
    progressBarEl.style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
    if (isTimerMode) {
        resetTimer();
        startTimer();
    }
    const question = questions[currentQuestionIndex];
    questionTextEl.textContent = question.question;
    questionImageEl.classList.toggle('hidden', !question.image);
    if (question.image) questionImageEl.src = question.image;
    bookmarkBtn.classList.toggle('bookmarked', bookmarkedQuestions.includes(question.question));
    choicesContainer.innerHTML = '';
    question.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice; button.className = 'game-btn';
        button.onclick = () => { playSound('click'); checkAnswer(choice, button); };
        choicesContainer.appendChild(button);
    });
}

function checkAnswer(selectedChoice, buttonEl) {
    if (isTimerMode) {
        clearInterval(timer);
    }
    mascotEl.classList.remove('jiggle-correct', 'shake-incorrect');
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedChoice === question.answer;

    if (isCorrect) {
        playSound('correct');
        score += isTimerMode ? (100 + (timeLeft * 20)) : 100;
        scoreEl.textContent = score;
        triggerConfetti();
        mascotEl.classList.add('jiggle-correct');
    } else {
        playSound('incorrect'); incorrectlyAnswered.push({ question, yourAnswer: selectedChoice });
        if (buttonEl) buttonEl.classList.add('incorrect');
        mascotEl.classList.add('shake-incorrect');
    }
    setTimeout(() => mascotEl.classList.remove('jiggle-correct', 'shake-incorrect'), 600);
    
    document.querySelectorAll('#choices-container button').forEach(b => { b.disabled = true; if (b.textContent === question.answer) b.classList.add('correct'); });
    explanationText.textContent = question.explanation;
    explanationBox.classList.remove('hidden'); nextBtn.classList.remove('hidden');
    progressBarEl.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
}

async function endQuiz() {
    finalScoreEl.textContent = score;
    reviewMistakesBtn.classList.toggle('hidden', incorrectlyAnswered.length === 0);
    playerData.quizzes_completed = (playerData.quizzes_completed || 0) + 1;
    await unlockAchievement('firstQuiz');
    if (incorrectlyAnswered.length === 0 && questions.length > 0) {
        await unlockAchievement('perfectScore');
        confetti({ particleCount: 400, spread: 120, origin: { y: 0.6 } });
    }
    quoteTextEl.textContent = `"${motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]}"`;
    await savePlayerData(); // Save final progress
    updateUI();
    showScreen('end-screen');
}

async function toggleBookmark() {
    playSound('click');
    const questionText = questions[currentQuestionIndex].question;
    const index = bookmarkedQuestions.indexOf(questionText);
    if (index > -1) bookmarkedQuestions.splice(index, 1);
    else bookmarkedQuestions.push(questionText);
    bookmarkBtn.classList.toggle('bookmarked');
    saveBookmarks();
    if (bookmarkedQuestions.length >= 5) await unlockAchievement('bookmark5');
}

function handleNextQuestion() { playSound('click'); currentQuestionIndex++; displayQuestion(); }
function startTimer() {
    timeLeft = 20;
    timerEl.textContent = timeLeft;
    timerEl.parentElement.classList.add('timer-pop');
    setTimeout(() => timerEl.parentElement.classList.remove('timer-pop'), 200);
    timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        timerEl.parentElement.classList.add('timer-pop');
        setTimeout(() => timerEl.parentElement.classList.remove('timer-pop'), 200);
        if (timeLeft <= 0) checkAnswer(null, null);
    }, 1000);
}
function resetTimer() { clearInterval(timer); }

// --- Share Functionality ---
function getShareText() {
    const score = finalScoreEl.textContent;
    const appUrl = "https://oubod.github.io/Quizz-med/"; // You will change this to your Netlify URL
    return `I scored ${score} on Medical Faculty Trivia! 🧠✨ Can you beat my score?\n\nPlay now: ${appUrl}`;
}

function shareScore(platform) {
    const text = getShareText();
    if (platform === 'copy') {
        navigator.clipboard.writeText(text).then(() => showToast("Results copied to clipboard!"));
        return;
    }
    const url = encodeURIComponent(text);
    let shareUrl = '';
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${url}`;
    if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${url}`;
    window.open(shareUrl, '_blank');
}

// --- Auth Event Listeners ---
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

signupBtn.addEventListener('click', async () => {
    const name = signupNameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();

    if (!name || !email || !password) {
        showToast('Please fill all fields.', true);
        return;
    }

    const { error } = await db.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: name // This data will be used by our trigger
            }
        }
    });

    if (error) {
        showToast(error.message, true);
    } else {
        showToast('Success! Check your email for a confirmation link.');
    }
});

loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if (!email || !password) {
        showToast('Please fill all fields.', true);
        return;
    }

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        showToast(error.message, true);
    }
    // The onAuthStateChange listener will handle successful login
});

logoutBtn.addEventListener('click', async () => {
    await db.auth.signOut();
    settingsModal.classList.add('hidden');
});

// --- Other Event Listeners ---
openSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
shareTwitterBtn.addEventListener('click', () => shareScore('twitter'));
shareWhatsappBtn.addEventListener('click', () => shareScore('whatsapp'));
shareCopyBtn.addEventListener('click', () => shareScore('copy'));
yearSelect.addEventListener('change', () => populateModules(yearSelect.value));
moduleSelect.addEventListener('change', () => populateTopics(yearSelect.value, moduleSelect.value));
topicSelect.addEventListener('change', () => { startBtn.disabled = !topicSelect.value; });
startBtn.addEventListener('click', startTopicQuiz);
restartBtn.addEventListener('click', restartQuiz);
nextBtn.addEventListener('click', handleNextQuestion);
bookmarkBtn.addEventListener('click', toggleBookmark);
dailyChallengeBtn.addEventListener('click', startDailyChallenge);
startBookmarkedBtn.addEventListener('click', startBookmarkedQuiz);
reviewMistakesBtn.addEventListener('click', startReviewQuiz);

tabBar.addEventListener('click', (e) => {
    const tabButton = e.target.closest('.tab-btn');
    if (tabButton && tabButton.dataset.target) {
        playSound('click');
        showScreen(tabButton.dataset.target);
    }
});

// --- App Entry Point ---
db.auth.onAuthStateChange((event, session) => {
    if (session) {
        // User is logged in
        loadUserAndStartApp();
    } else {
        // User is logged out
        playerData = {}; // Clear data
        authScreen.classList.remove('hidden');
        appShell.classList.add('hidden');
    }
});

// Initialize non-user-specific parts of the app
initializeApp();