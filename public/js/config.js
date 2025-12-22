// Supabase Configuration
// This file contains Supabase client initialization

// Supabase credentials
const SUPABASE_URL = 'https://xpkpjmnmxwaxopskwwzn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3BqbW5teHdheG9wc2t3d3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTcyNDUsImV4cCI6MjA4MTk3MzI0NX0.O-bzDC6O14fPGoVQuj35lCMy8CRyXOwa4pnK72bM7sk';

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
