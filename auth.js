// DOM Elements
const authModal = document.getElementById('auth-modal');
const authBtn = document.getElementById('auth-btn');
const closeAuthBtn = document.getElementById('close-auth-btn');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const magicLinkBtn = document.getElementById('magic-link-btn');

// Auth state
let currentUser = null;

// Check if user is already logged in
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        updateAuthUI();
        // If we have a user, update the player name with their email
        if (playerNameEl) {
            const email = user.email;
            const username = email.substring(0, email.indexOf('@'));
            playerData.name = username;
            savePlayerData();
            updateUI();
        }
    }
}

// Update UI based on auth state
function updateAuthUI() {
    if (currentUser) {
        authBtn.textContent = '👤✓';
    } else {
        authBtn.textContent = '👤';
    }
}

// Event Listeners
authBtn.addEventListener('click', () => {
    if (currentUser) {
        // Show logout confirmation
        if (confirm('Do you want to log out?')) {
            logout();
        }
    } else {
        // Show login modal
        authModal.classList.remove('hidden');
    }
});

closeAuthBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
});

loginTab.addEventListener('click', () => {
    loginTab.classList.add('border-blue-500');
    signupTab.classList.remove('border-blue-500');
    loginTab.classList.remove('border-transparent');
    signupTab.classList.add('border-transparent');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('border-blue-500');
    loginTab.classList.remove('border-blue-500');
    signupTab.classList.remove('border-transparent');
    loginTab.classList.add('border-transparent');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// Login with email and password
loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
        showToast('Please enter both email and password');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showToast('Logged in successfully!');
        authModal.classList.add('hidden');
        updateAuthUI();
        
        // Update player name
        const username = email.substring(0, email.indexOf('@'));
        playerData.name = username;
        savePlayerData();
        updateUI();
        
    } catch (error) {
        showToast(error.message);
    }
});

// Sign up with email and password
signupBtn.addEventListener('click', async () => {
    const email = signupEmail.value;
    const password = signupPassword.value;
    
    if (!email || !password) {
        showToast('Please enter both email and password');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        showToast('Verification email sent! Please check your inbox.');
        
    } catch (error) {
        showToast(error.message);
    }
});

// Send magic link
magicLinkBtn.addEventListener('click', async () => {
    const email = loginEmail.value;
    
    if (!email) {
        showToast('Please enter your email');
        return;
    }
    
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email
        });
        
        if (error) throw error;
        
        showToast('Magic link sent! Please check your email.');
        
    } catch (error) {
        showToast(error.message);
    }
});

// Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        showToast('Logged out successfully!');
        updateAuthUI();
        
    } catch (error) {
        showToast(error.message);
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        updateAuthUI();
        
        // Update player name
        const email = currentUser.email;
        const username = email.substring(0, email.indexOf('@'));
        playerData.name = username;
        savePlayerData();
        updateUI();
    }
    
    if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateAuthUI();
    }
});

// Initialize auth
checkUser();