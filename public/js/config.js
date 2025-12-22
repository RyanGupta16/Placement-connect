// Supabase Configuration
// This file contains Supabase client initialization
// Replace these values with your actual Supabase project credentials

// Get environment variables or use defaults (for development only)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase is loaded
if (typeof window.supabase === 'undefined') {
    console.error('Supabase client library not loaded. Please include it in your HTML.');
}

// Initialize Supabase client
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export configuration for edge functions
export const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// API endpoints
export const ENDPOINTS = {
    ANALYZE_RESUME: `${EDGE_FUNCTIONS_URL}/analyze-resume`,
    MOCK_INTERVIEW: `${EDGE_FUNCTIONS_URL}/mock-interview`,
};

export default supabase;
