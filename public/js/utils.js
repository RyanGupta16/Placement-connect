// Utility Functions
// Common utility functions used across the application

/**
 * Check if user is authenticated
 * Redirects to login if not authenticated
 */
export async function checkAuth(supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '/login.html';
        return null;
    }
    
    return session;
}

/**
 * Get current user profile from database
 */
export async function getUserProfile(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    
    return data;
}

/**
 * Display error message
 */
export function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show loading state on button
 */
export function setButtonLoading(buttonId, isLoading, loadingText = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }
}

/**
 * Format date to readable string
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-IN', options);
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Extract text from PDF file
 * Returns a promise with the extracted text
 */
export async function extractTextFromPDF(file) {
    // For production, you would use a library like PDF.js
    // This is a simplified version that returns a promise
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // In a real implementation, use PDF.js here
                // For now, we'll return the filename as placeholder
                // The actual extraction will happen on the backend
                resolve(`PDF content from: ${file.name}\n[Text extraction will be done on server]`);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate CGPA
 */
export function isValidCGPA(cgpa) {
    const cgpaNum = parseFloat(cgpa);
    return !isNaN(cgpaNum) && cgpaNum >= 0 && cgpaNum <= 10;
}

/**
 * Parse skills string to array
 */
export function parseSkills(skillsString) {
    if (!skillsString || skillsString.trim() === '') return [];
    
    return skillsString
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
}

/**
 * Generate a unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile) {
    if (!profile) return 0;
    
    const fields = ['name', 'email', 'college', 'branch', 'year', 'cgpa'];
    const filledFields = fields.filter(field => {
        const value = profile[field];
        return value !== null && value !== undefined && value !== '';
    });
    
    // Bonus for skills
    const hasSkills = profile.skills && profile.skills.length > 0;
    const total = fields.length + (hasSkills ? 1 : 0);
    const filled = filledFields.length + (hasSkills ? 1 : 0);
    
    return Math.round((filled / total) * 100);
}

/**
 * Logout user
 */
export async function logout(supabase) {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Error logging out:', error);
        showToast('Error logging out', 'error');
        return;
    }
    
    window.location.href = '/index.html';
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
