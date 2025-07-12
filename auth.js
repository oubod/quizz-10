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
// Update the checkUser function (around line 20)
async function checkUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Auth error:', error);
            throw error;
        }
        
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
            return true; // User is logged in
        } else {
            // Show auth modal automatically if no user is logged in
            authModal.classList.remove('hidden');
            // Disable the close button until logged in
            closeAuthBtn.disabled = true;
            closeAuthBtn.classList.add('opacity-50');
            return false; // User is not logged in
        }
    } catch (error) {
        console.error('Error checking user:', error);
        authModal.classList.remove('hidden');
        return false;
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

// Replace the closeAuthBtn event listener (around line 60)
closeAuthBtn.addEventListener('click', () => {
    // Only allow closing if user is logged in
    if (currentUser) {
        authModal.classList.add('hidden');
    } else {
        showToast('Please log in or sign up to continue');
    }
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
    
    // Update the login success handler (around line 90)
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        updateAuthUI();
        
        // Enable close button and hide modal
        closeAuthBtn.disabled = false;
        closeAuthBtn.classList.remove('opacity-50');
        authModal.classList.add('hidden');
        
        // Update player name
        if (playerNameEl) {
            const username = email.substring(0, email.indexOf('@'));
            playerData.name = username;
            savePlayerData();
            updateUI();
        }
        
        showToast('Logged in successfully!');
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed');
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