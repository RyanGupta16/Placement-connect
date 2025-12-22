// Dashboard Page JavaScript
import supabase from './config.js';
import { checkAuth, getUserProfile, logout, calculateProfileCompletion, formatDate, showToast } from './utils.js';

let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const session = await checkAuth(supabase);
    if (!session) return;
    
    // Load user data
    await loadUserData();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadUserData() {
    try {
        // Get user profile
        currentProfile = await getUserProfile(supabase);
        
        if (!currentProfile) {
            showToast('Error loading profile', 'error');
            return;
        }
        
        // Update UI with profile data
        document.getElementById('userName').textContent = currentProfile.name;
        document.getElementById('userNameDisplay').textContent = currentProfile.name;
        
        // Update profile section
        document.getElementById('profileCollege').textContent = currentProfile.college || '--';
        document.getElementById('profileBranch').textContent = currentProfile.branch || '--';
        document.getElementById('profileYear').textContent = currentProfile.year ? `${currentProfile.year}${getOrdinalSuffix(currentProfile.year)} Year` : '--';
        document.getElementById('profileCGPA').textContent = currentProfile.cgpa || '--';
        document.getElementById('profileSkills').textContent = 
            currentProfile.skills && currentProfile.skills.length > 0 
                ? currentProfile.skills.join(', ') 
                : 'None added';
        
        // Calculate profile strength
        const profileStrength = calculateProfileCompletion(currentProfile);
        document.getElementById('profileStrength').textContent = `${profileStrength}%`;
        
        // Load statistics
        await loadStatistics();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading data', 'error');
    }
}

async function loadStatistics() {
    try {
        const userId = currentProfile.id;
        
        // Get resume score (latest)
        const { data: resumeFeedback } = await supabase
            .from('resume_feedback')
            .select('clarity_score')
            .eq('user_id', userId)
            .order('analyzed_at', { ascending: false })
            .limit(1);
        
        if (resumeFeedback && resumeFeedback.length > 0) {
            document.getElementById('resumeScore').textContent = resumeFeedback[0].clarity_score;
        } else {
            document.getElementById('resumeScore').textContent = '--';
        }
        
        // Get interview count
        const { count: interviewCount } = await supabase
            .from('interview_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');
        
        document.getElementById('interviewCount').textContent = interviewCount || 0;
        
        // Get eligibility checks count
        const { count: eligibilityCount } = await supabase
            .from('company_checks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        document.getElementById('eligibilityCount').textContent = eligibilityCount || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadRecentActivity() {
    try {
        const userId = currentProfile.id;
        const activityList = document.getElementById('activityList');
        const activities = [];
        
        // Get recent resume analyses
        const { data: recentResumes } = await supabase
            .from('resume_feedback')
            .select('analyzed_at, clarity_score')
            .eq('user_id', userId)
            .order('analyzed_at', { ascending: false })
            .limit(3);
        
        if (recentResumes) {
            recentResumes.forEach(item => {
                activities.push({
                    type: 'resume',
                    date: item.analyzed_at,
                    text: `Resume analyzed - Score: ${item.clarity_score}/100`
                });
            });
        }
        
        // Get recent interviews
        const { data: recentInterviews } = await supabase
            .from('interview_sessions')
            .select('completed_at, communication_score')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(3);
        
        if (recentInterviews) {
            recentInterviews.forEach(item => {
                activities.push({
                    type: 'interview',
                    date: item.completed_at,
                    text: `Mock interview completed - Score: ${item.communication_score}/100`
                });
            });
        }
        
        // Get recent company checks
        const { data: recentChecks } = await supabase
            .from('company_checks')
            .select('checked_at, company_name, is_eligible')
            .eq('user_id', userId)
            .order('checked_at', { ascending: false })
            .limit(3);
        
        if (recentChecks) {
            recentChecks.forEach(item => {
                activities.push({
                    type: 'eligibility',
                    date: item.checked_at,
                    text: `${item.company_name} - ${item.is_eligible ? '✅ Eligible' : '❌ Not Eligible'}`
                });
            });
        }
        
        // Sort by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display activities
        if (activities.length === 0) {
            activityList.innerHTML = '<div class="empty-state"><p>No recent activity yet. Start preparing!</p></div>';
        } else {
            activityList.innerHTML = activities.slice(0, 5).map(activity => `
                <div class="activity-item">
                    <p><strong>${activity.text}</strong></p>
                    <p style="font-size: 0.875rem; color: var(--gray-600);">${formatDate(activity.date)}</p>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        await logout(supabase);
    });
    
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    
    editProfileBtn.addEventListener('click', () => {
        // Populate form with current values
        document.getElementById('editCollege').value = currentProfile.college || '';
        document.getElementById('editBranch').value = currentProfile.branch || '';
        document.getElementById('editYear').value = currentProfile.year || '';
        document.getElementById('editCGPA').value = currentProfile.cgpa || '';
        document.getElementById('editSkills').value = 
            currentProfile.skills && currentProfile.skills.length > 0 
                ? currentProfile.skills.join(', ') 
                : '';
        
        editProfileModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });
    
    cancelEdit.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });
    
    // Edit profile form submission
    const editProfileForm = document.getElementById('editProfileForm');
    editProfileForm.addEventListener('submit', handleProfileUpdate);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const college = document.getElementById('editCollege').value.trim();
    const branch = document.getElementById('editBranch').value;
    const year = parseInt(document.getElementById('editYear').value);
    const cgpa = parseFloat(document.getElementById('editCGPA').value);
    const skillsInput = document.getElementById('editSkills').value.trim();
    
    // Parse skills
    const skills = skillsInput 
        ? skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];
    
    try {
        // Update profile in database
        const { error } = await supabase
            .from('profiles')
            .update({
                college: college,
                branch: branch,
                year: year,
                cgpa: cgpa,
                skills: skills
            })
            .eq('id', currentProfile.id);
        
        if (error) throw error;
        
        // Close modal
        document.getElementById('editProfileModal').style.display = 'none';
        
        // Show success message
        showToast('Profile updated successfully!', 'success');
        
        // Reload data
        await loadUserData();
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}
