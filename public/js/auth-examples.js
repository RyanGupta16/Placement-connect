// Authentication Examples and Session Check Logic
// This file demonstrates how to implement authentication checks in different scenarios

import supabase from './config.js';
import { checkAuth, getAuthSession, onAuthStateChange, getUserProfile, logout } from './utils.js';

// ============================================
// EXAMPLE 1: Protected Page (Full Check)
// Use this at the top of pages that require authentication
// ============================================
export async function protectedPageInit() {
    // Check if user is authenticated, redirects to login if not
    const session = await checkAuth(supabase);
    
    if (!session) {
        // User will be redirected to login.html
        return null;
    }
    
    // Get user profile
    const profile = await getUserProfile(supabase);
    
    if (!profile) {
        alert('Profile not found. Please complete your profile.');
        window.location.href = '/signup.html';
        return null;
    }
    
    return { session, profile };
}

// ============================================
// EXAMPLE 2: Soft Auth Check (No Redirect)
// Use this when you want to check auth but not redirect
// ============================================
export async function softAuthCheck() {
    const session = await getAuthSession(supabase);
    
    if (session) {
        // User is logged in
        return {
            isAuthenticated: true,
            user: session.user,
        };
    }
    
    // User is not logged in
    return {
        isAuthenticated: false,
        user: null,
    };
}

// ============================================
// EXAMPLE 3: Auth State Listener
// Use this to react to authentication changes
// ============================================
export function setupAuthListener() {
    const authSubscription = onAuthStateChange(supabase, (event, session) => {
        console.log('Auth event:', event, session);
        
        switch (event) {
            case 'SIGNED_IN':
                console.log('User signed in:', session.user.email);
                // Update UI, show user menu, etc.
                break;
                
            case 'SIGNED_OUT':
                console.log('User signed out');
                // Clear UI, redirect if on protected page
                if (isProtectedPage()) {
                    window.location.href = '/login.html';
                }
                break;
                
            case 'TOKEN_REFRESHED':
                console.log('Token refreshed');
                // Session is still valid
                break;
                
            case 'USER_UPDATED':
                console.log('User data updated');
                // Reload profile data
                break;
        }
    });
    
    // Return unsubscribe function
    return authSubscription;
}

// ============================================
// EXAMPLE 4: Check Specific Permissions
// Use this to check if user meets certain criteria
// ============================================
export async function checkUserPermissions(requiredCGPA = null, requiredYear = null) {
    const profile = await getUserProfile(supabase);
    
    if (!profile) {
        return { allowed: false, reason: 'Profile not found' };
    }
    
    // Check CGPA requirement
    if (requiredCGPA && profile.cgpa < requiredCGPA) {
        return {
            allowed: false,
            reason: `Minimum CGPA of ${requiredCGPA} required. Your CGPA: ${profile.cgpa}`,
        };
    }
    
    // Check year requirement
    if (requiredYear && profile.year < requiredYear) {
        return {
            allowed: false,
            reason: `Minimum ${requiredYear}${getOrdinalSuffix(requiredYear)} year required`,
        };
    }
    
    return { allowed: true, profile };
}

// ============================================
// EXAMPLE 5: Session Timeout Check
// Use this to check if session is about to expire
// ============================================
export async function checkSessionExpiry() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        return { expired: true, timeLeft: 0 };
    }
    
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeLeft = expiresAt - now;
    
    // Check if session expires in less than 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeLeft < fiveMinutes) {
        console.warn('Session expiring soon, refreshing...');
        
        // Refresh session
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
            console.error('Failed to refresh session:', error);
            return { expired: true, timeLeft: 0 };
        }
        
        console.log('Session refreshed successfully');
    }
    
    return {
        expired: false,
        timeLeft: timeLeft,
        expiresAt: new Date(expiresAt),
    };
}

// ============================================
// EXAMPLE 6: Complete Protected Page Template
// ============================================
export async function completeProtectedPageExample() {
    // 1. Check authentication
    const session = await checkAuth(supabase);
    if (!session) return;
    
    // 2. Get user profile
    const profile = await getUserProfile(supabase);
    if (!profile) {
        alert('Profile not found');
        return;
    }
    
    // 3. Setup auth state listener
    const unsubscribe = setupAuthListener();
    
    // 4. Check session periodically (every 5 minutes)
    setInterval(async () => {
        const sessionStatus = await checkSessionExpiry();
        if (sessionStatus.expired) {
            alert('Your session has expired. Please login again.');
            await logout(supabase);
        }
    }, 5 * 60 * 1000);
    
    // 5. Setup logout button
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            await logout(supabase);
        }
    });
    
    // 6. Display user info
    displayUserInfo(profile);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        unsubscribe.subscription.unsubscribe();
    });
}

// ============================================
// EXAMPLE 7: Middleware-style Auth Check
// Use this pattern for SPA-style routing
// ============================================
export async function authMiddleware(requiredAuth = true) {
    const session = await getAuthSession(supabase);
    
    if (requiredAuth && !session) {
        // Redirect to login
        window.location.href = '/login.html';
        return false;
    }
    
    if (!requiredAuth && session) {
        // User is logged in but trying to access login/signup
        window.location.href = '/dashboard.html';
        return false;
    }
    
    return true;
}

// ============================================
// EXAMPLE 8: API Request with Auth
// Use this when making authenticated API calls
// ============================================
export async function authenticatedRequest(url, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        throw new Error('Not authenticated');
    }
    
    // Add auth token to headers
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    if (response.status === 401) {
        // Token expired or invalid
        await logout(supabase);
        throw new Error('Authentication expired');
    }
    
    return response;
}

// ============================================
// Helper Functions
// ============================================

function isProtectedPage() {
    const protectedPages = [
        '/dashboard.html',
        '/resume.html',
        '/eligibility.html',
        '/interview.html',
    ];
    
    return protectedPages.some(page => window.location.pathname.includes(page));
}

function displayUserInfo(profile) {
    // Update UI with user information
    const userElements = document.querySelectorAll('[data-user-name]');
    userElements.forEach(el => {
        el.textContent = profile.name;
    });
    
    const emailElements = document.querySelectorAll('[data-user-email]');
    emailElements.forEach(el => {
        el.textContent = profile.email;
    });
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

// ============================================
// USAGE EXAMPLES IN YOUR PAGES
// ============================================

/*
// In dashboard.html or any protected page:

import { protectedPageInit } from './auth-examples.js';

document.addEventListener('DOMContentLoaded', async () => {
    // This will check auth and redirect if needed
    const authData = await protectedPageInit();
    
    if (!authData) return; // User was redirected
    
    const { session, profile } = authData;
    
    // Your page logic here
    console.log('Logged in as:', profile.name);
});

// ============================================

// In landing page (index.html) - optional auth check:

import { softAuthCheck } from './auth-examples.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { isAuthenticated } = await softAuthCheck();
    
    if (isAuthenticated) {
        // Show "Go to Dashboard" button instead of "Login"
        document.getElementById('loginBtn').textContent = 'Dashboard';
        document.getElementById('loginBtn').href = '/dashboard.html';
    }
});

// ============================================

// In any page that needs logout:

import { logout } from './utils.js';
import supabase from './config.js';

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout(supabase);
});

// ============================================

// For company eligibility with CGPA check:

import { checkUserPermissions } from './auth-examples.js';

async function checkCompanyEligibility(company) {
    const minCGPA = company.minCGPA || 6.0;
    
    const permission = await checkUserPermissions(minCGPA);
    
    if (!permission.allowed) {
        alert(permission.reason);
        return false;
    }
    
    // Proceed with eligibility check
    return true;
}
*/
