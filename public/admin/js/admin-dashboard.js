// Admin Dashboard Logic
import supabase from './admin-auth.js';
import { getCurrentAdmin } from './admin-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Load admin info
    loadAdminInfo();
    
    // Load dashboard statistics
    await loadDashboardStats();
    
    // Setup event listeners
    setupEventListeners();
});

function loadAdminInfo() {
    const admin = getCurrentAdmin();
    
    if (admin) {
        document.getElementById('adminName').textContent = admin.full_name;
        document.getElementById('roleBadge').textContent = admin.role.toUpperCase().replace('_', ' ');
        
        // Change badge color for super admin
        if (admin.role === 'super_admin') {
            document.getElementById('roleBadge').style.background = '#ef4444';
        }
    }
}

async function loadDashboardStats() {
    try {
        // Get total students
        const { count: studentsCount } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalStudents').textContent = studentsCount || 0;
        
        // Get total companies
        const { count: companiesCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        document.getElementById('totalCompanies').textContent = companiesCount || 0;
        
        // Get total job roles
        const { count: jobsCount } = await supabase
            .from('job_roles')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        document.getElementById('totalJobs').textContent = jobsCount || 0;
        
        // Get total applications
        const { count: applicationsCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalApplications').textContent = applicationsCount || 0;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            await supabase.auth.signOut();
            sessionStorage.removeItem('adminUser');
            window.location.href = '/login.html';
        }
    });
}
