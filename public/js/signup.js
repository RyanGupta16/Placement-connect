// Signup Page JavaScript
import supabase from './config.js';
import { showError, setButtonLoading, isValidEmail, isValidCGPA, parseSkills } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = '/dashboard.html';
        return;
    }
    
    // Handle form submission
    const signupForm = document.getElementById('signupForm');
    signupForm.addEventListener('submit', handleSignup);
});

async function handleSignup(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const college = document.getElementById('college').value.trim();
    const branch = document.getElementById('branch').value;
    const year = parseInt(document.getElementById('year').value);
    const cgpa = parseFloat(document.getElementById('cgpa').value);
    const skillsInput = document.getElementById('skills').value.trim();
    
    // Validation
    if (!name || name.length < 2) {
        showError('errorMessage', 'Please enter a valid name');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('errorMessage', 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showError('errorMessage', 'Password must be at least 6 characters');
        return;
    }
    
    if (!college) {
        showError('errorMessage', 'Please enter your college name');
        return;
    }
    
    if (!branch) {
        showError('errorMessage', 'Please select your branch');
        return;
    }
    
    if (!year || year < 1 || year > 4) {
        showError('errorMessage', 'Please select your current year');
        return;
    }
    
    if (!isValidCGPA(cgpa)) {
        showError('errorMessage', 'Please enter a valid CGPA (0-10)');
        return;
    }
    
    // Parse skills
    const skills = parseSkills(skillsInput);
    
    // Show loading state
    setButtonLoading('signupBtn', true, 'Creating Account...');
    
    try {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    college: college,
                    branch: branch,
                    year: year,
                    cgpa: cgpa,
                },
                emailRedirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
        if (!data.user) {
            throw new Error('Signup failed. Please try again.');
        }
        
        // Get the user ID
        const userId = data.user.id;
        
        // Create profile entry (if auto-create trigger doesn't work)
        // Use a small delay to ensure auth user is committed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                name: name,
                email: email,
                college: college,
                branch: branch,
                year: year,
                cgpa: cgpa,
                skills: skills
            }, {
                onConflict: 'id'
            });
        
        if (profileError) {
            console.warn('Profile creation warning:', profileError);
            // Don't throw error, as trigger might have created it
        }
        
        // Success
        console.log('Signup successful:', data);
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
            alert('Account created successfully! 🎉\n\nPlease check your email to confirm your account before logging in.');
            window.location.href = '/login.html';
        } else {
            // Auto-login successful (email confirmation disabled)
            alert('Account created successfully! 🎉');
            window.location.href = '/dashboard.html';
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            errorMessage = 'This email is already registered. Please login instead.';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Unable to validate email')) {
            errorMessage = 'Invalid email address. Please check and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError('errorMessage', errorMessage);
        setButtonLoading('signupBtn', false);
    }
}
