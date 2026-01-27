// Admin Authentication Protection
// This file must be imported FIRST on all admin pages
import supabase from '../js/config.js';

// Verify admin access immediately
(async function protectAdminRoute() {
    try {
        // Check if user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error('No active session. Redirecting to login...');
            window.location.href = '/login.html';
            return;
        }
        
        const userId = session.user.id;
        
        // Check if user is admin
        const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('id, email, full_name, role, is_active')
            .eq('id', userId)
            .eq('is_active', true)
            .single();
        
        if (adminError || !adminData) {
            console.error('Access Denied: Not an admin user');
            alert('⛔ Access Denied\n\nYou do not have administrative privileges.\nRedirecting to student dashboard...');
            
            // Sign out to prevent further access attempts
            await supabase.auth.signOut();
            window.location.href = '/login.html';
            return;
        }
        
        // Admin verified - store admin info in sessionStorage
        sessionStorage.setItem('adminUser', JSON.stringify(adminData));
        
        console.log('✅ Admin access granted:', adminData.email);
        
        // Hide loading, show content
        const loadingScreen = document.getElementById('loadingScreen');
        const adminContent = document.getElementById('adminContent');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';
        
    } catch (error) {
        console.error('Admin authentication error:', error);
        alert('Authentication failed. Redirecting to login...');
        window.location.href = '/login.html';
    }
})();

// Helper function to get current admin user
export function getCurrentAdmin() {
    const adminData = sessionStorage.getItem('adminUser');
    return adminData ? JSON.parse(adminData) : null;
}

// Helper function to check if super admin
export function isSuperAdmin() {
    const admin = getCurrentAdmin();
    return admin && admin.role === 'super_admin';
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('adminUser');
        window.location.href = '/login.html';
    }
});

export default supabase;
