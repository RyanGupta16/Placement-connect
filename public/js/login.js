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
        
        // Successful login
        console.log('Login successful:', data);
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before logging in.';
        }
        
        showError('errorMessage', errorMessage);
        setButtonLoading('loginBtn', false);
    }
}
