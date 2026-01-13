// Login Page JavaScript
import supabase from './config.js';
import { showError, setButtonLoading, isValidEmail } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = '/dashboard.html';
        return;
    }
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
});

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
        
        // Check if profile exists, if not redirect to complete profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (!profile) {
            console.warn('Profile not found, user may need to complete setup');
        }
        
        window.location.href = '/dashboard.html';
        
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
