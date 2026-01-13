// Dashboard Page JavaScript
import supabase from './config.js';
import { checkAuth, getUserProfile, logout, calculateProfileCompletion, formatDate, showToast } from './utils.js';

let currentProfile = null;
let allJobRoles = [];
let userApplications = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const session = await checkAuth(supabase);
    if (!session) return;
    
    // Load user data
    await loadUserData();
    
    // Load applications
    await loadUserApplications();
    
    // Load job roles
    await loadJobRoles();
    
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
        
        // Get applications count
        const { count: applicationsCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', userId);
        
        document.getElementById('applicationsCount').textContent = applicationsCount || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadRecentActivity() {
    try {
        const userId = currentProfile.id;
        const activityList = document.getElementById('activityList');
        const activities = [];
        
        // Get recent applications
        const { data: recentApplications } = await supabase
            .from('applications')
            .select(`
                applied_at,
                status,
                job_roles (
                    title,
                    companies (name)
                )
            `)
            .eq('student_id', userId)
            .order('applied_at', { ascending: false })
            .limit(3);
        
        if (recentApplications) {
            recentApplications.forEach(item => {
                activities.push({
                    type: 'application',
                    date: item.applied_at,
                    text: `Applied to ${item.job_roles.companies.name} - ${item.job_roles.title} (${getStatusEmoji(item.status)} ${formatStatus(item.status)})`
                });
            });
        }
        
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
    
    // Filter listeners
    document.getElementById('filterCompany').addEventListener('change', filterJobRoles);
    document.getElementById('filterJobType').addEventListener('change', filterJobRoles);
    
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    
    editProfileBtn.addEventListener('click', () => {
        // Populate form with current values
        document.getElementById('editCollege').value = currentProfile.college || '';
        document.getElementById('editBranch').value = currentProfile.branch || '';
        document.getElementById('editYear').value = currentProfile.year || currentProfile.current_year || '';
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
        // Update profile in database (use user_profiles table)
        const { error } = await supabase
            .from('user_profiles')
            .update({
                college: college,
                branch: branch,
                current_year: year,
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
        await loadJobRoles(); // Reload to recalculate eligibility
        
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

// ========================================
// APPLICATION MANAGEMENT FUNCTIONS
// ========================================

/**
 * Load user's applications
 */
async function loadUserApplications() {
    try {
        const userId = currentProfile.id;
        const applicationsList = document.getElementById('applicationsList');
        
        // Fetch applications with job role and company details
        const { data: applications, error } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                is_eligible,
                eligibility_reason,
                applied_at,
                updated_at,
                job_roles (
                    id,
                    title,
                    location,
                    package_min,
                    package_max,
                    job_type,
                    companies (
                        id,
                        name,
                        logo_url
                    )
                )
            `)
            .eq('student_id', userId)
            .order('applied_at', { ascending: false });
        
        if (error) throw error;
        
        userApplications = applications || [];
        
        // Display applications
        if (userApplications.length === 0) {
            applicationsList.innerHTML = '<div class="empty-state"><p>No applications yet. Browse available job roles below!</p></div>';
        } else {
            applicationsList.innerHTML = userApplications.map(app => `
                <div class="application-card">
                    <div class="application-header">
                        <div class="company-info">
                            ${app.job_roles.companies.logo_url ? 
                                `<img src="${app.job_roles.companies.logo_url}" alt="${app.job_roles.companies.name}" class="company-logo">` : 
                                '<div class="company-logo-placeholder">🏢</div>'
                            }
                            <div>
                                <h4>${app.job_roles.companies.name}</h4>
                                <p>${app.job_roles.title}</p>
                            </div>
                        </div>
                        <span class="status-badge status-${app.status}">${getStatusEmoji(app.status)} ${formatStatus(app.status)}</span>
                    </div>
                    <div class="application-details">
                        <p><strong>Location:</strong> ${app.job_roles.location || 'Not specified'}</p>
                        <p><strong>Package:</strong> ${formatPackage(app.job_roles.package_min, app.job_roles.package_max)}</p>
                        <p><strong>Type:</strong> ${app.job_roles.job_type}</p>
                        <p><strong>Applied:</strong> ${formatDate(app.applied_at)}</p>
                        ${!app.is_eligible ? `<p class="warning-text"><strong>⚠️ Note:</strong> ${app.eligibility_reason}</p>` : ''}
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading applications:', error);
        showToast('Error loading applications', 'error');
    }
}

/**
 * Load available job roles
 */
async function loadJobRoles() {
    try {
        const jobRolesList = document.getElementById('jobRolesList');
        const filterCompany = document.getElementById('filterCompany');
        
        // Fetch active job roles using the view
        const { data: jobRoles, error } = await supabase
            .from('active_job_openings')
            .select('*')
            .order('registration_start_date', { ascending: false });
        
        if (error) throw error;
        
        allJobRoles = jobRoles || [];
        
        // Populate company filter
        const companies = [...new Set(allJobRoles.map(jr => jr.company_name))];
        filterCompany.innerHTML = '<option value="">All Companies</option>' + 
            companies.map(c => `<option value="${c}">${c}</option>`).join('');
        
        // Display job roles
        displayJobRoles(allJobRoles);
        
    } catch (error) {
        console.error('Error loading job roles:', error);
        const jobRolesList = document.getElementById('jobRolesList');
        jobRolesList.innerHTML = '<div class="empty-state"><p>Error loading job roles. Please try again.</p></div>';
    }
}

/**
 * Display job roles with current filters
 */
function displayJobRoles(jobRoles) {
    const jobRolesList = document.getElementById('jobRolesList');
    
    if (jobRoles.length === 0) {
        jobRolesList.innerHTML = '<div class="empty-state"><p>No job openings match your filters.</p></div>';
        return;
    }
    
    jobRolesList.innerHTML = jobRoles.map(job => {
        // Check if already applied
        const hasApplied = userApplications.some(app => app.job_roles.id === job.job_role_id);
        
        // Check eligibility
        const eligibility = checkEligibility(job);
        
        return `
            <div class="job-card ${!eligibility.isEligible ? 'not-eligible' : ''}">
                <div class="job-header">
                    <div class="company-info">
                        ${job.logo_url ? 
                            `<img src="${job.logo_url}" alt="${job.company_name}" class="company-logo">` : 
                            '<div class="company-logo-placeholder">🏢</div>'
                        }
                        <div>
                            <h4>${job.company_name}</h4>
                            <p>${job.role_title}</p>
                        </div>
                    </div>
                    ${eligibility.isEligible ? 
                        '<span class="eligibility-badge eligible">✓ Eligible</span>' : 
                        '<span class="eligibility-badge not-eligible">✗ Not Eligible</span>'
                    }
                </div>
                <div class="job-details">
                    <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
                    <p><strong>Package:</strong> ${formatPackage(job.package_min, job.package_max)}</p>
                    <p><strong>Type:</strong> ${job.job_type}</p>
                    <p><strong>Branches:</strong> ${job.eligible_branches.join(', ')}</p>
                    <p><strong>Min CGPA:</strong> ${job.min_cgpa}</p>
                    ${job.registration_end_date ? `<p><strong>Apply By:</strong> ${formatDate(job.registration_end_date)}</p>` : ''}
                </div>
                ${job.role_description ? `<p class="job-description">${job.role_description}</p>` : ''}
                ${!eligibility.isEligible ? `<p class="warning-text">${eligibility.reason}</p>` : ''}
                <div class="job-actions">
                    ${hasApplied ? 
                        '<button class="btn btn-outline" disabled>Already Applied</button>' :
                        `<button class="btn btn-primary" onclick="applyToJob('${job.job_role_id}', '${job.company_id}', ${eligibility.isEligible}, '${eligibility.reason.replace(/'/g, "\\'")}')">
                            ${eligibility.isEligible ? 'Apply Now' : 'Apply Anyway'}
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Check if student is eligible for a job
 */
function checkEligibility(job) {
    const profile = currentProfile;
    
    // Check CGPA
    if (profile.cgpa < job.min_cgpa) {
        return {
            isEligible: false,
            reason: `CGPA requirement not met (Required: ${job.min_cgpa}, Yours: ${profile.cgpa})`
        };
    }
    
    // Check branch
    const userBranch = getBranchCode(profile.branch);
    if (!job.eligible_branches.includes(userBranch)) {
        return {
            isEligible: false,
            reason: `Branch not eligible (Eligible branches: ${job.eligible_branches.join(', ')})`
        };
    }
    
    // Check batch
    if (!job.eligible_batches.includes(profile.batch)) {
        return {
            isEligible: false,
            reason: `Batch not eligible (Eligible batches: ${job.eligible_batches.join(', ')})`
        };
    }
    
    // Check active backlogs (if implemented in profile)
    if (profile.active_backlogs && profile.active_backlogs > 0) {
        return {
            isEligible: false,
            reason: `Active backlogs present (${profile.active_backlogs} active backlog(s))`
        };
    }
    
    return {
        isEligible: true,
        reason: 'You meet all eligibility criteria!'
    };
}

/**
 * Get branch code from branch name
 */
function getBranchCode(branchName) {
    const branchMap = {
        'Computer Science': 'CS',
        'Information Technology': 'IT',
        'Electronics & Communication': 'ECE',
        'Electrical': 'EEE',
        'Mechanical': 'MECH',
        'Civil': 'CIVIL',
        'Chemical': 'CHEM'
    };
    return branchMap[branchName] || branchName.substring(0, 4).toUpperCase();
}

/**
 * Apply to a job role
 */
window.applyToJob = async function(jobRoleId, companyId, isEligible, eligibilityReason) {
    try {
        // Confirm application
        const confirmMsg = isEligible ? 
            'Are you sure you want to apply to this position?' :
            'You do not meet the eligibility criteria. Do you still want to apply?';
        
        if (!confirm(confirmMsg)) return;
        
        // Check if already applied (additional validation)
        const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('student_id', currentProfile.id)
            .eq('job_role_id', jobRoleId)
            .single();
        
        if (existingApp) {
            showToast('You have already applied to this position', 'error');
            return;
        }
        
        // Create application
        const { data, error } = await supabase
            .from('applications')
            .insert({
                student_id: currentProfile.id,
                job_role_id: jobRoleId,
                company_id: companyId,
                status: 'applied',
                is_eligible: isEligible,
                eligibility_reason: eligibilityReason,
                resume_url: currentProfile.resume_url || null
            })
            .select()
            .single();
        
        if (error) {
            // Check for duplicate application error
            if (error.code === '23505') {
                showToast('You have already applied to this position', 'error');
            } else {
                throw error;
            }
            return;
        }
        
        showToast('Application submitted successfully!', 'success');
        
        // Reload applications and job roles
        await loadUserApplications();
        await loadStatistics();
        await loadJobRoles();
        
    } catch (error) {
        console.error('Error applying to job:', error);
        showToast('Error submitting application. Please try again.', 'error');
    }
};

/**
 * Filter job roles
 */
function filterJobRoles() {
    const companyFilter = document.getElementById('filterCompany').value;
    const jobTypeFilter = document.getElementById('filterJobType').value;
    
    let filtered = allJobRoles;
    
    if (companyFilter) {
        filtered = filtered.filter(job => job.company_name === companyFilter);
    }
    
    if (jobTypeFilter) {
        filtered = filtered.filter(job => job.job_type === jobTypeFilter);
    }
    
    displayJobRoles(filtered);
}

/**
 * Helper: Format status text
 */
function formatStatus(status) {
    return status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Helper: Get status emoji
 */
function getStatusEmoji(status) {
    const emojiMap = {
        'applied': '📝',
        'under_review': '👀',
        'shortlisted': '⭐',
        'test_scheduled': '📅',
        'test_cleared': '✅',
        'interview_scheduled': '📞',
        'interview_cleared': '🎯',
        'offered': '🎉',
        'accepted': '✨',
        'rejected': '❌',
        'withdrawn': '🚫'
    };
    return emojiMap[status] || '📝';
}

/**
 * Helper: Format package range
 */
function formatPackage(min, max) {
    if (!min && !max) return 'Not disclosed';
    if (min && max && min === max) return `₹${min} LPA`;
    if (min && max) return `₹${min} - ${max} LPA`;
    if (min) return `₹${min}+ LPA`;
    return 'Competitive';
}
