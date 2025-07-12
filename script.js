// --- DOM Elements ---
const mascotEl = document.getElementById('mascot');
const playerNameEl = document.getElementById('player-name');
const streakCounterEl = document.getElementById('streak-counter');
const achievementsUnlockedEl = document.getElementById('achievements-unlocked');
const welcomeModal = document.getElementById('welcome-modal');
const nameInput = document.getElementById('name-input');
const nextOnboardingBtn = document.getElementById('next-onboarding-btn');
const finishOnboardingBtn = document.getElementById('finish-onboarding-btn');
const onboardingStep1 = document.getElementById('onboarding-step-1');
const onboardingStep2 = document.getElementById('onboarding-step-2');
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
const allScreens = document.querySelectorAll('.screen');
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

// --- Player Data, Themes, Achievements, and Quotes ---
let playerData = {};
const themes = {
    'theme-dark-blue': { name: 'Deep Blue', color: '#3A41C9' },
    'theme-forest': { name: 'Forest', color: '#166534' },
    'theme-rose-gold': { name: 'Rose Gold', color: '#fdf2f8' }
};
const achievementsList = {
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

// --- Data Management & UI Updates ---
async function loadPlayerData() {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Load data from Supabase
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (error) {
            console.error('Error loading player data:', error);
            return;
        }
        
        if (data) {
            playerData = {
                name: data.name,
                theme: data.theme || 'theme-dark-blue',
                lastPlayedDate: data.last_played_date,
                streak: data.streak || 0,
                quizzesCompleted: data.quizzes_completed || 0,
                achievements: { ...achievementsList }
            };
            
            // Load achievements
            const { data: achievementsData, error: achievementsError } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', user.id);
                
            if (!achievementsError && achievementsData) {
                achievementsData.forEach(achievement => {
                    if (playerData.achievements[achievement.achievement_id]) {
                        playerData.achievements[achievement.achievement_id].unlocked = achievement.unlocked;
                    }
                });
            }
        }
    } else {
        // In the loadPlayerData() function, modify the else block:
        else {
        // User not logged in, use localStorage as fallback
        const savedData = localStorage.getItem('medQuizPlayerData');
        if (savedData) {
            playerData = JSON.parse(savedData);
            playerData.achievements = { ...achievementsList, ...playerData.achievements };
        } else {
            playerData = {
                name: '', theme: 'theme-dark-blue', lastPlayedDate: null, streak: 0,
                achievements: achievementsList, quizzesCompleted: 0
            };
            // Only show welcome modal if auth modal is not showing
            if (!authModal || authModal.classList.contains('hidden')) {
                welcomeModal.classList.remove('hidden');
            }
        }
        }
    }
    
    updateUI();
}

async function savePlayerData() {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Save data to Supabase
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                name: playerData.name,
                theme: playerData.theme,
                last_played_date: playerData.lastPlayedDate,
                streak: playerData.streak,
                quizzes_completed: playerData.quizzesCompleted
            });
            
        if (error) {
            console.error('Error saving player data:', error);
        }
        
        // Save achievements
        for (const [id, achievement] of Object.entries(playerData.achievements)) {
            if (achievement.unlocked) {
                const { error: achievementError } = await supabase
                    .from('achievements')
                    .upsert({
                        user_id: user.id,
                        achievement_id: id,
                        unlocked: true,
                        unlocked_at: new Date().toISOString()
                    });
                    
                if (achievementError) {
                    console.error('Error saving achievement:', achievementError);
                }
            }
        }
    } else {
        // User not logged in, use localStorage as fallback
        localStorage.setItem('medQuizPlayerData', JSON.stringify(playerData));
    }
}

async function loadBookmarks() {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Load bookmarks from Supabase
        const { data, error } = await supabase
            .from('bookmarks')
            .select('question_text')
            .eq('user_id', user.id);
            
        if (error) {
            console.error('Error loading bookmarks:', error);
            return;
        }
        
        if (data) {
            bookmarkedQuestions = data.map(bookmark => bookmark.question_text);
        }
    } else {
        // User not logged in, use localStorage as fallback
        const saved = localStorage.getItem('medQuizBookmarks');
        bookmarkedQuestions = saved ? JSON.parse(saved) : [];
    }
    
    startBookmarkedBtn.classList.toggle('hidden', bookmarkedQuestions.length === 0);
}

async function saveBookmarks() {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // First, delete all existing bookmarks
        await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id);
            
        // Then insert all current bookmarks
        if (bookmarkedQuestions.length > 0) {
            const bookmarksToInsert = bookmarkedQuestions.map(question => ({
                user_id: user.id,
                question_text: question
            }));
            
            const { error } = await supabase
                .from('bookmarks')
                .insert(bookmarksToInsert);
                
            if (error) {
                console.error('Error saving bookmarks:', error);
            }
        }
    } else {
        // User not logged in, use localStorage as fallback
        localStorage.setItem('medQuizBookmarks', JSON.stringify(bookmarkedQuestions));
    }
    
    startBookmarkedBtn.classList.toggle('hidden', bookmarkedQuestions.length === 0);
}

function updateUI() {
    playerNameEl.textContent = playerData.name || 'Player';
    streakCounterEl.textContent = playerData.streak;
    document.body.className = playerData.theme;
    const unlockedCount = Object.values(playerData.achievements).filter(a => a.unlocked).length;
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
        option.onclick = () => {
            playerData.theme = themeClass;
            savePlayerData();
            updateUI();
            populateThemeOptions();
        };
        themeOptionsContainer.appendChild(option);
    }
}

function showToast(message) {
    toastTextEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

function unlockAchievement(id) {
    if (!playerData.achievements[id] || playerData.achievements[id].unlocked) return;
    playerData.achievements[id].unlocked = true;
    showToast(`Achievement Unlocked: ${playerData.achievements[id].name}`);
    savePlayerData();
    updateUI();
}

function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (playerData.lastPlayedDate === today) return;
    const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    playerData.streak = (playerData.lastPlayedDate === yesterday) ? playerData.streak + 1 : 1;
    if (playerData.streak > 1) showToast(`Streak extended to ${playerData.streak} days!`);
    playerData.lastPlayedDate = today;
    unlockAchievement('dailyPlayer');
    if (playerData.streak >= 5) unlockAchievement('streak5');
}

// --- Utility Functions ---
function triggerConfetti() { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, zIndex: 1000 }); }
const playSound = (sound) => { try { new Audio(`assets/sounds/${sound}.mp3`).play(); } catch (e) { console.warn("Sound could not be played.", e); } };
const showScreen = (screenId) => { allScreens.forEach(s => s.classList.add('hidden')); document.getElementById(screenId).classList.remove('hidden'); };

// --- Bookmark Management ---
const loadBookmarks = () => {
    const saved = localStorage.getItem('medQuizBookmarks');
    bookmarkedQuestions = saved ? JSON.parse(saved) : [];
    startBookmarkedBtn.classList.toggle('hidden', bookmarkedQuestions.length === 0);
};
const saveBookmarks = () => {
    localStorage.setItem('medQuizBookmarks', JSON.stringify(bookmarkedQuestions));
    startBookmarkedBtn.classList.toggle('hidden', bookmarkedQuestions.length === 0);
};

// --- Core App Logic ---
// Update the initializeApp function (around line 320)
async function initializeApp() {
    // Check authentication first
    await checkUser();
    
    // Then proceed with other initialization
    loadPlayerData();
    populateThemeOptions();
    loadBookmarks();
    try {
        // Use absolute URL to ensure proper loading
        const response = await fetch('./data/manifest.json');
        if (!response.ok) {
            console.error('Failed to load manifest:', response.status, response.statusText);
            throw new Error('Manifest not found');
        }
        quizStructure = await response.json();
        console.log('Quiz structure loaded:', quizStructure); // Debug log
        populateYears();
        preloadAllQuestions();
    } catch (error) {
        console.error("Could not initialize app:", error);
        alert("Failed to load critical app data: " + error.message);
    }
}

// Update the preloadAllQuestions function to handle path issues (around line 335)
async function preloadAllQuestions() {
    const allFilePaths = [];
    for (const year in quizStructure) {
        for (const module in quizStructure[year]) {
            for (const topic in quizStructure[year][module]) {
                const path = quizStructure[year][module][topic];
                console.log('Adding path to load:', path); // Debug log
                allFilePaths.push(path);
            }
        }
    }
    
    console.log('Attempting to load files:', allFilePaths); // Debug log
    
    const allPromises = allFilePaths.map(path => 
        fetch(path)
            .then(res => {
                if (!res.ok) {
                    console.error(`Failed to load ${path}:`, res.status, res.statusText);
                    return Promise.reject(`Failed to load ${path}`);
                }
                return res.json();
            })
            .catch(err => {
                console.error('Error loading questions:', err);
                return [];
            })
    );
    
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
function setupAndStartQuiz(questionArray, mode = "standard") {
    if (!questionArray || questionArray.length === 0) { alert(mode === 'bookmarks' ? 'You have no bookmarked questions!' : 'No questions available.'); return; }
    updateStreak();
    const count = questionCountSelect.value;
    isTimerMode = timerModeSelect.value === 'timed';
    timerContainer.style.display = isTimerMode ? 'block' : 'none';
    questions = mode === 'standard' && count !== 'all' ? [...questionArray].slice(0, parseInt(count, 20)) : [...questionArray];
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

function endQuiz() {
    finalScoreEl.textContent = score;
    reviewMistakesBtn.classList.toggle('hidden', incorrectlyAnswered.length === 0);
    playerData.quizzesCompleted = (playerData.quizzesCompleted || 0) + 1;
    unlockAchievement('firstQuiz');
    if (incorrectlyAnswered.length === 0 && questions.length > 0) {
        unlockAchievement('perfectScore');
        confetti({ particleCount: 400, spread: 120, origin: { y: 0.6 } });
    }
    quoteTextEl.textContent = `"${motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]}"`;
    savePlayerData(); updateUI();
    showScreen('end-screen');
}

function toggleBookmark() {
    playSound('click');
    const questionText = questions[currentQuestionIndex].question;
    const index = bookmarkedQuestions.indexOf(questionText);
    if (index > -1) bookmarkedQuestions.splice(index, 1);
    else bookmarkedQuestions.push(questionText);
    bookmarkBtn.classList.toggle('bookmarked');
    saveBookmarks();
    if (bookmarkedQuestions.length >= 5) unlockAchievement('bookmark5');
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
    const appUrl = "https://oubod.github.io/Quizz-med/";
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

// --- Event Listeners ---
nextOnboardingBtn.addEventListener('click', () => {
    if (nameInput.value.trim()) {
        onboardingStep1.classList.add('hidden');
        onboardingStep2.classList.remove('hidden');
    } else { showToast("Please enter a name!"); }
});
finishOnboardingBtn.addEventListener('click', () => {
    playerData.name = nameInput.value.trim();
    savePlayerData();
    updateUI();
    welcomeModal.classList.add('hidden');
});
// Make sure this event listener is working (around line 520)
openSettingsBtn.addEventListener('click', () => {
    console.log('Settings button clicked'); // Add for debugging
    settingsModal.classList.remove('hidden');
});
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

// --- Initialize App ---
initializeApp();
// At the end of the file, add this to verify all event listeners
function verifyEventListeners() {
    debug('Verifying event listeners');
    // Test settings button
    if (openSettingsBtn) {
        debug('Settings button found');
        openSettingsBtn.addEventListener('click', () => {
            debug('Settings button clicked');
            settingsModal.classList.remove('hidden');
        });
    } else {
        console.error('Settings button not found!');
    }
    
    // Add other critical event listeners here
}

// Call this after initialization
async function initializeApp() {
    // Check authentication first
    await checkUser();
    
    // Then proceed with other initialization
    loadPlayerData();
    populateThemeOptions();
    loadBookmarks();
    try {
        // Use absolute URL to ensure proper loading
        const response = await fetch('./data/manifest.json');
        if (!response.ok) {
            console.error('Failed to load manifest:', response.status, response.statusText);
            throw new Error('Manifest not found');
        }
        quizStructure = await response.json();
        console.log('Quiz structure loaded:', quizStructure); // Debug log
        populateYears();
        preloadAllQuestions();
    } catch (error) {
        console.error("Could not initialize app:", error);
        alert("Failed to load critical app data: " + error.message);
    }
}

// Update the preloadAllQuestions function to handle path issues (around line 335)
async function preloadAllQuestions() {
    const allFilePaths = [];
    for (const year in quizStructure) {
        for (const module in quizStructure[year]) {
            for (const topic in quizStructure[year][module]) {
                const path = quizStructure[year][module][topic];
                console.log('Adding path to load:', path); // Debug log
                allFilePaths.push(path);
            }
        }
    }
    
    console.log('Attempting to load files:', allFilePaths); // Debug log
    
    const allPromises = allFilePaths.map(path => 
        fetch(path)
            .then(res => {
                if (!res.ok) {
                    console.error(`Failed to load ${path}:`, res.status, res.statusText);
                    return Promise.reject(`Failed to load ${path}`);
                }
                return res.json();
            })
            .catch(err => {
                console.error('Error loading questions:', err);
                return [];
            })
    );
    
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
function setupAndStartQuiz(questionArray, mode = "standard") {
    if (!questionArray || questionArray.length === 0) { alert(mode === 'bookmarks' ? 'You have no bookmarked questions!' : 'No questions available.'); return; }
    updateStreak();
    const count = questionCountSelect.value;
    isTimerMode = timerModeSelect.value === 'timed';
    timerContainer.style.display = isTimerMode ? 'block' : 'none';
    questions = mode === 'standard' && count !== 'all' ? [...questionArray].slice(0, parseInt(count, 20)) : [...questionArray];
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

function endQuiz() {
    finalScoreEl.textContent = score;
    reviewMistakesBtn.classList.toggle('hidden', incorrectlyAnswered.length === 0);
    playerData.quizzesCompleted = (playerData.quizzesCompleted || 0) + 1;
    unlockAchievement('firstQuiz');
    if (incorrectlyAnswered.length === 0 && questions.length > 0) {
        unlockAchievement('perfectScore');
        confetti({ particleCount: 400, spread: 120, origin: { y: 0.6 } });
    }
    quoteTextEl.textContent = `"${motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]}"`;
    savePlayerData(); updateUI();
    showScreen('end-screen');
}

function toggleBookmark() {
    playSound('click');
    const questionText = questions[currentQuestionIndex].question;
    const index = bookmarkedQuestions.indexOf(questionText);
    if (index > -1) bookmarkedQuestions.splice(index, 1);
    else bookmarkedQuestions.push(questionText);
    bookmarkBtn.classList.toggle('bookmarked');
    saveBookmarks();
    if (bookmarkedQuestions.length >= 5) unlockAchievement('bookmark5');
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
    const appUrl = "https://oubod.github.io/Quizz-med/";
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

// --- Event Listeners ---
nextOnboardingBtn.addEventListener('click', () => {
    if (nameInput.value.trim()) {
        onboardingStep1.classList.add('hidden');
        onboardingStep2.classList.remove('hidden');
    } else { showToast("Please enter a name!"); }
});
finishOnboardingBtn.addEventListener('click', () => {
    playerData.name = nameInput.value.trim();
    savePlayerData();
    updateUI();
    welcomeModal.classList.add('hidden');
});
// Make sure this event listener is working (around line 520)
openSettingsBtn.addEventListener('click', () => {
    console.log('Settings button clicked'); // Add for debugging
    settingsModal.classList.remove('hidden');
});
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

// --- Initialize App ---
initializeApp();
// Add at the beginning of the file (around line 1)
const DEBUG = true;
function debug(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

// Then use throughout the code like:
// debug('Loading player data');
// debug('Quiz structure:', quizStructure);
// Verify event listeners at the end
verifyEventListeners();