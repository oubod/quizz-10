// --- DOM Elements ---

// NEW: Real-time Battle State
let battleChannel = null;
let currentSessionId = null;
let battleParticipants = {}; // To store { id: { username, score } }
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

// --- Find Friends Elements ---
const friendSearchBtn = document.getElementById('friend-search-btn');
const friendSearchInput = document.getElementById('friend-search-input');
const friendSearchResults = document.getElementById('friend-search-results');

if (friendSearchBtn && friendSearchInput && friendSearchResults) {
    friendSearchBtn.addEventListener('click', async () => {
        const searchTerm = friendSearchInput.value.trim();
        if (!searchTerm) return;

        // Use 'ilike' for case-insensitive search
        const { data, error } = await db.from('profiles').select('id, username').ilike('username', `%${searchTerm}%`);

        if (error) {
            showToast('Error searching for users.', true);
            return;
        }

        friendSearchResults.innerHTML = '';

        // Get the current user's ID
        const currentUserId = (await db.auth.getUser()).data.user.id;

        // Filter out the current user from the search results
        const otherUsers = data.filter(profile => profile.id !== currentUserId);

        if (otherUsers.length === 0) {
            friendSearchResults.innerHTML = `<p class="text-slate-400 text-center">No other users found.</p>`;
            return;
        }

        otherUsers.forEach(profile => {
            // This loop now only shows other people
            const resultEl = document.createElement('div');
            resultEl.className = 'flex justify-between items-center p-2';
            resultEl.innerHTML = `<span>${profile.username}</span> <button data-id="${profile.id}" class="add-friend-btn game-btn game-btn-start text-sm py-1 px-3">Add</button>`;
            friendSearchResults.appendChild(resultEl);
        });
    });

    // --- Replace the old friendSearchResults event listener with this one ---
    friendSearchResults.addEventListener('click', async (e) => {
        // Ensure we only act on clicks on the "Add" button itself
        if (!e.target.matches('.add-friend-btn')) {
            return;
        }

        const button = e.target;
        const addresseeId = button.dataset.id;
        const requesterId = playerData.id; // Use the globally stored player ID

        // Disable the button immediately to prevent double-clicks
        button.disabled = true;
        button.textContent = 'Adding...';

        if (addresseeId === requesterId) {
            showToast("You can't add yourself!", true);
            button.textContent = 'Add';
            button.disabled = false;
            return;
        }

        const { error } = await db.from('friendships').insert({
            requester_id: requesterId,
            addressee_id: addresseeId,
        });

        if (error) {
            // The most common error is '23505' for unique_violation, meaning a request already exists.
            if (error.code === '23505') {
                showToast('A friend request already exists with this user.');
            } else {
                showToast('Error sending request. Please try again.', true);
                console.error('Friend request error:', error);
            }
            button.textContent = 'Error'; // Give feedback
        } else {
            showToast('Friend request sent!');
            button.textContent = 'Sent'; // The button remains disabled
        }
    });
}


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

// Track if questions are ready (loading state)
let questionsReady = false;


// --- Battle Functions ---
// --- Add this NEW function anywhere in script.js ---
async function fetchAndDisplayLobbyPlayers(sessionId, hostId) {
    // Fetch all participants for this session
    const { data: participants, error } = await db.from('session_participants')
        .select(`
            profiles ( id, username )
        `)
        .eq('session_id', sessionId);
    
    if (error) {
        console.error("Could not fetch lobby players:", error);
        return;
    }

    // Clear and re-populate the list
    const playerListEl = document.getElementById('lobby-player-list');
    playerListEl.innerHTML = '';
    battleParticipants = {}; // Reset local state

    (participants || []).forEach(p => {
        if (p.profiles) {
            const profile = p.profiles;
            battleParticipants[profile.id] = { username: profile.username, score: 0 };
            
            const li = document.createElement('li');
            li.textContent = `✅ ${profile.username}`;
            playerListEl.appendChild(li);
        }
    });
    
    // Now, update the host controls based on the fetched data
    updateLobbyUI(hostId);
}
async function createBattle() {
    playSound('click');

    // ---- NEW CODE START ----
    if (!questionsReady) {
        showToast('Questions are still loading, please wait a moment.', true);
        return;
    }
    // ---- NEW CODE END ----

    showToast('Creating a new battle room...');

    // 1. Get 5 random questions for the battle
    const battleQuestions = [...masterQuestionList].sort(() => 0.5 - Math.random()).slice(0, 5);
    if (battleQuestions.length < 5) {
        showToast('Not enough questions for a battle!', true);
        return;
    }

    // 2. Create the game session in the database
    const { data: session, error } = await db.from('game_sessions')
        .insert({
            questions: battleQuestions.map(q => q.id), // Store the array of question IDs
            host_id: playerData.id
        })
        .select()
        .single();
    
    if (error) {
        showToast('Error creating battle. Please try again.', true);
        console.error(error);
        return;
    }

    // 3. The host automatically joins their own session
    await db.from('session_participants').insert({ session_id: session.id, player_id: playerData.id });

    // 4. Navigate to the lobby and start listening for events
    navigateToLobby(session.id);
}

// --- Replace the old startBattleRound function with this one ---
async function startBattleRound() {
    showScreen('battle-quiz-screen');
    document.getElementById('battle-timer-overlay').classList.add('hidden');

    // Fetch the ENTIRE game session, including its current question index
    const { data: sessionData, error } = await db.from('game_sessions')
        .select('questions, current_question_index')
        .eq('id', currentSessionId)
        .single();

    if (error || !sessionData) {
        showToast('Error loading battle data!', true);
        return;
    }

    // Get the ID of the question for the current round
    const questionId = sessionData.questions[sessionData.current_question_index];

    // Find the full question object from our master list using its ID
    const question = masterQuestionList.find(q => q.id === questionId);

    if (!question) {
        showToast('Error finding question details!', true);
        console.error(`Could not find question with ID: ${questionId}`);
        // Go back to the home screen if the battle is broken
        showScreen('start-screen');
        return;
    }

    // Display the question
    document.getElementById('battle-question-text').textContent = question.question;
    const choicesContainer = document.getElementById('battle-choices-container');
    choicesContainer.innerHTML = '';
    question.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.className = 'game-btn';
        button.onclick = () => handleBattleAnswer(choice, question.answer);
        choicesContainer.appendChild(button);
    });

    updateBattleScoreboard();
}

async function handleBattleAnswer(selectedChoice, correctAnswer) {
    // Disable all choice buttons immediately
    document.querySelectorAll('#battle-choices-container button').forEach(b => b.disabled = true);
    
    let currentScore = battleParticipants[playerData.id].score || 0;
    if (selectedChoice === correctAnswer) {
        currentScore += 100; // Simple scoring
        playSound('correct');
    } else {
        playSound('incorrect');
    }

    // Update your own score in the database
    await db.from('session_participants')
      .update({ score: currentScore, answers: { /* you could log the answer here */ } })
      .match({ session_id: currentSessionId, player_id: playerData.id });

    // Announce to everyone that you have answered and what your new score is
    await battleChannel.send({
        type: 'broadcast',
        event: 'player_answered',
        payload: { playerId: playerData.id, newScore: currentScore }
    });
}

function updateBattleScoreboard() {
    const scoreboardEl = document.getElementById('battle-scoreboard');
    scoreboardEl.innerHTML = '';

    for (const id in battleParticipants) {
        const player = battleParticipants[id];
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'text-center';
        scoreDiv.innerHTML = `<div class="font-bold text-lg">${player.username}</div><div>${player.score}</div>`;
        scoreboardEl.appendChild(scoreDiv);
    }
}

async function navigateToLobby(sessionId) {
    currentSessionId = sessionId;
    battleParticipants = {};

    // ---- NEW CODE START ----
    // Fetch the session details to know who the host is
    const { data: sessionData, error } = await db.from('game_sessions')
        .select('host_id')
        .eq('id', sessionId)
        .single();

    if (error || !sessionData) {
        showToast('Could not load battle lobby.', true);
        showScreen('start-screen'); // Go back home if lobby fails
        return;
    }
    // ---- NEW CODE END ----

    showScreen('battle-lobby-screen');

    // Populate the invite link
    const inviteLink = `${window.location.origin}${window.location.pathname}?battle=${sessionId}`;
    const inviteLinkInput = document.getElementById('invite-link-input');
    inviteLinkInput.value = inviteLink;
    document.getElementById('copy-invite-link-btn').onclick = () => {
        navigator.clipboard.writeText(inviteLink).then(() => showToast('Invite link copied!'));
    };

    // Unsubscribe from any old channel to prevent memory leaks
    if (battleChannel) {
        db.removeChannel(battleChannel);
    }

    // Listen for INSERTS to session_participants (when a player joins)
    battleChannel = db.channel(`battle-lobby-${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'session_participants',
                filter: `session_id=eq.${sessionId}`
            },
            // When a new participant is inserted, refetch the list.
            () => fetchAndDisplayLobbyPlayers(sessionId, sessionData.host_id)
        )
        // ALSO listen for UPDATES to game_sessions (when the game starts)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_sessions',
                filter: `id=eq.${sessionId}`
            },
            (payload) => {
                // Check if the 'status' column was the one that changed to 'active'
                if (payload.new.status === 'active' && payload.old.status === 'waiting') {
                    console.log('Game status changed to active!');
                    startBattleRound(); // <-- REMOVE the parameter.
                }
            }
        )
        .subscribe();

    // Initial fetch to show who is already in the lobby
    fetchAndDisplayLobbyPlayers(sessionId, sessionData.host_id);
}

function updateLobbyUI(hostId) {
    const playerListEl = document.getElementById('lobby-player-list');
    playerListEl.innerHTML = '';
    
    Object.values(battleParticipants).forEach(player => {
        const li = document.createElement('li');
        li.textContent = `✅ ${player.username}`;
        playerListEl.appendChild(li);
    });

    // ---- THIS IS THE KEY CHANGE ----
    // Check if the current player's ID matches the fetched hostId
    if (playerData.id === hostId) { 
        document.getElementById('host-controls').classList.remove('hidden');
        document.getElementById('guest-message').classList.add('hidden');
    } else {
        document.getElementById('host-controls').classList.add('hidden');
        document.getElementById('guest-message').classList.remove('hidden');
    }
}

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


// --- Replace the old preloadAllQuestions function with this one ---
async function preloadAllQuestions() {
    const allFilePaths = [];
    for (const year in quizStructure) for (const module in quizStructure[year]) for (const topic in quizStructure[year][module]) {
        allFilePaths.push(quizStructure[year][module][topic]);
    }
    const allPromises = allFilePaths.map(path => fetch(path).then(res => res.ok ? res.json() : Promise.reject()).catch(() => []));
    const questionArrays = await Promise.all(allPromises);
    
    // Flatten the array of arrays and add a unique ID to each question
    masterQuestionList = questionArrays.flat().map((q, index) => {
        return {
            ...q,
            // Create a simple, unique ID. Using the index is easy and effective.
            id: `q_${index}` 
        };
    });
    
    console.log(`Preloaded ${masterQuestionList.length} questions in total.`);
    questionsReady = true; // Set the flag
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

// --- Battle Invite Handler ---
// --- Replace the old checkForBattleInvite function with this one ---

async function checkForBattleInvite() {
    const params = new URLSearchParams(window.location.search);
    const battleId = params.get('battle');

    if (battleId) {
        showToast('Joining battle from invite link...');
        const { data: { user } } = await db.auth.getUser();
        if (!user) {
            showToast('You must be logged in to join a battle!', true);
            return;
        }

        // ---- NEW CODE START ----
        // Check if this user is ALREADY a participant in this session
        const { data: existingParticipant, error: checkError } = await db.from('session_participants')
            .select('id')
            .match({ session_id: battleId, player_id: user.id })
            .maybeSingle(); // Use maybeSingle to not error if nothing is found

        if (checkError) {
            showToast('Error checking battle status.', true);
            console.error(checkError);
            return;
        }

        // If the user is NOT already in the game, add them.
        if (!existingParticipant) {
            const { error: insertError } = await db.from('session_participants')
                .insert({ session_id: battleId, player_id: user.id });

            if (insertError) {
                // Handle the case where there might be a race condition
                if (insertError.code === '23505') { // 23505 is the code for unique_violation
                    console.warn('Race condition on join, but already a participant. Ignoring.');
                } else {
                    showToast('Could not join battle.', true);
                    console.error('Join battle error:', insertError);
                    return;
                }
            }
        }
        // ---- NEW CODE END ----

        // Whether we just joined or were already here, navigate to the lobby.
        navigateToLobby(battleId);

        // Clean the URL so refreshing the page doesn't try to rejoin
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// --- App Entry Point ---
db.auth.onAuthStateChange((event, session) => {
    if (session) {
        loadUserAndStartApp().then(() => {
            checkForBattleInvite(); // Check for invite AFTER user is loaded
        });
    } else {
        playerData = {};
        authScreen.classList.remove('hidden');
        appShell.classList.add('hidden');
    }
});

// --- Battle Event Listener ---
const createBattleBtn = document.getElementById('create-battle-btn');
if (createBattleBtn) {
    createBattleBtn.addEventListener('click', createBattle);
}

// Initialize non-user-specific parts of the app
initializeApp();

// Add this function to handle the start battle button click
async function startBattle() {
    playSound('click');
    
    if (!currentSessionId) {
        showToast('Error: No active battle session.', true);
        return;
    }
    
    // Update the session status to 'active' in the database
    const { error } = await db.from('game_sessions')
        .update({ status: 'active' })
        .eq('id', currentSessionId);

    if (error) {
        showToast('Error starting battle. Please try again.', true);
        console.error(error);
        return;
    }
    
    showToast('Battle started! Good luck!');
}

// Add this event listener with proper error checking
const startBattleBtn = document.getElementById('start-battle-btn');
if (startBattleBtn) {
    startBattleBtn.addEventListener('click', startBattle);
}