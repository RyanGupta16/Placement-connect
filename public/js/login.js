// Login Page JavaScript
import supabase from './config.js';
import { showError, setButtonLoading, isValidEmail } from './utils.js';

let isAdminMode = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Check if user is admin and redirect accordingly
        const isAdmin = await checkIfAdmin(session.user.id);
        if (isAdmin) {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/dashboard.html';
        }
        return;
    }
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Handle admin mode toggle
    const toggleAdminBtn = document.getElementById('toggleAdminBtn');
    toggleAdminBtn.addEventListener('click', toggleAdminMode);
});

// Toggle between student and admin login mode
function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    
    const title = document.getElementById('loginTitle');
    const subtitle = document.getElementById('loginSubtitle');
    const toggleBtn = document.getElementById('toggleAdminBtn');
    const loginBtn = document.getElementById('loginBtn');
    
    if (isAdminMode) {
        title.textContent = 'Admin Portal';
        subtitle.textContent = 'Administrative access only';
        toggleBtn.textContent = '👤 Student Login';
        loginBtn.textContent = 'Admin Login';
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else {
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Login to continue your placement preparation';
        toggleBtn.textContent = '🔐 Admin Login';
        loginBtn.textContent = 'Login';
        document.body.style.background = '';
    }
}

// Check if user is admin
async function checkIfAdmin(userId) {
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, role, is_active')
            .eq('id', userId)
            .eq('is_active', true)
            .single();
        
        return !!data;
    } catch (error) {
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validation
    if (!isValidEmail(email)) {
        showError('errorMessage', 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showError('errorMessage', 'Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    setButtonLoading('loginBtn', true, 'Logging in...');
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            throw error;
        }
        
        // Store remember me preference
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberMe');
        }
        
        // Successful login
        console.log('Login successful:', data);
        
        // Check if user is admin
        const isAdmin = await checkIfAdmin(data.user.id);
        
        // Verify login mode matches user type
        if (isAdminMode && !isAdmin) {
            // Trying to login as admin but not an admin user
            await supabase.auth.signOut();
            throw new Error('Access Denied: You do not have administrative privileges.');
        }
        
        if (!isAdminMode && isAdmin) {
            // Admin trying to login via student portal
            await supabase.auth.signOut();
            throw new Error('Please use the Admin Login option.');
        }
        
        // Update last login for admins
        if (isAdmin) {
            await supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.user.id);
        }
        
        // Redirect based on user type
        if (isAdmin) {
            window.location.href = '/admin/dashboard.html';
        } else {
            // Check if student profile exists
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            if (!profile) {
                console.warn('Profile not found, user may need to complete setup');
            }
            
            window.location.href = '/dashboard.html';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before logging in. Check your inbox.';
        } else if (error.message.includes('Email link is invalid or has expired')) {
            errorMessage = 'Session expired. Please try logging in again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError('errorMessage', errorMessage);
        setButtonLoading('loginBtn', false);
    }
}

// Handle forgot password
function handleForgotPassword() {
    const email = document.getElementById('email').value.trim();
    
    if (!isValidEmail(email)) {
        alert('Please enter your email address first.');
        document.getElementById('email').focus();
        return;
    }
    
    if (confirm(`Send password reset link to ${email}?`)) {
        sendPasswordResetEmail(email);
    }
}

async function sendPasswordResetEmail(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });
        
        if (error) throw error;
        
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        alert('Failed to send reset email. Please try again.');
    }
}

// Setup forgot password link if it exists
document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }
});
