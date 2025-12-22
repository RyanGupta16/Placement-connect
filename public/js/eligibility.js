// Eligibility Checker Page JavaScript
import supabase from './config.js';
import { checkAuth, getUserProfile, logout, formatDate, showToast } from './utils.js';

let currentProfile = null;

// Company eligibility rules (rule-based, no AI guessing)
const COMPANY_RULES = {
    'TCS': {
        minCGPA: 6.0,
        allowedBranches: ['All'], // All branches allowed
        criteria: {
            cgpa: 6.0,
            backlogs: 0,
            branches: 'All'
        }
    },
    'Infosys': {
        minCGPA: 6.5,
        allowedBranches: ['All'],
        criteria: {
            cgpa: 6.5,
            backlogs: 0,
            branches: 'All'
        }
    },
    'Accenture': {
        minCGPA: 6.5,
        allowedBranches: ['All'],
        criteria: {
            cgpa: 6.5,
            backlogs: 0,
            branches: 'All'
        }
    },
    'Amazon': {
        minCGPA: 7.0,
        allowedBranches: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        preferredBranches: true,
        criteria: {
            cgpa: 7.0,
            backlogs: 0,
            branches: 'CS/IT/ECE preferred'
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const session = await checkAuth(supabase);
    if (!session) return;
    
    // Load user data
    currentProfile = await getUserProfile(supabase);
    
    if (currentProfile) {
        document.getElementById('userName').textContent = currentProfile.name;
        displayUserProfile();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load history
    await loadHistory();
});

function displayUserProfile() {
    document.getElementById('userCGPA').textContent = currentProfile.cgpa || '--';
    document.getElementById('userBranch').textContent = currentProfile.branch || '--';
    document.getElementById('userYear').textContent = currentProfile.year ? `${currentProfile.year}${getOrdinalSuffix(currentProfile.year)} Year` : '--';
    document.getElementById('userCollege').textContent = currentProfile.college || '--';
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await logout(supabase);
    });
    
    // Check eligibility buttons
    const checkButtons = document.querySelectorAll('.check-btn');
    checkButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const companyName = btn.dataset.company;
            checkEligibility(companyName);
        });
    });
}

async function checkEligibility(companyName) {
    const company = COMPANY_RULES[companyName];
    
    if (!company) {
        showToast('Company not found', 'error');
        return;
    }
    
    // Check CGPA
    const userCGPA = parseFloat(currentProfile.cgpa);
    const meetsGPARequirement = userCGPA >= company.minCGPA;
    
    // Check branch eligibility
    let meetsBranchRequirement = false;
    if (company.allowedBranches.includes('All')) {
        meetsBranchRequirement = true;
    } else {
        meetsBranchRequirement = company.allowedBranches.includes(currentProfile.branch);
    }
    
    // Determine eligibility
    const isEligible = meetsGPARequirement && meetsBranchRequirement;
    
    // Build reason
    let reason = '';
    const criteriaMet = {
        cgpa: meetsGPARequirement,
        branch: meetsBranchRequirement
    };
    
    if (isEligible) {
        reason = `✅ You meet all the eligibility criteria for ${companyName}!\n\n`;
        reason += `• CGPA: ${userCGPA} (Required: ${company.minCGPA}) ✅\n`;
        reason += `• Branch: ${currentProfile.branch} ${meetsBranchRequirement ? '✅' : '⚠️'}\n`;
        
        if (company.preferredBranches && !company.allowedBranches.includes(currentProfile.branch)) {
            reason += `\n⚠️ Note: ${companyName} prefers ${company.allowedBranches.join(', ')} branches, but other branches may also be considered.`;
        }
    } else {
        reason = `❌ You do not meet the eligibility criteria for ${companyName}.\n\n`;
        
        if (!meetsGPARequirement) {
            reason += `• CGPA: ${userCGPA} (Required: ${company.minCGPA}) ❌\n`;
            reason += `  You need ${(company.minCGPA - userCGPA).toFixed(2)} more CGPA points.\n`;
        } else {
            reason += `• CGPA: ${userCGPA} (Required: ${company.minCGPA}) ✅\n`;
        }
        
        if (!meetsBranchRequirement) {
            reason += `• Branch: ${currentProfile.branch} ❌\n`;
            reason += `  Eligible branches: ${company.allowedBranches.join(', ')}\n`;
        } else {
            reason += `• Branch: ${currentProfile.branch} ✅\n`;
        }
    }
    
    // Display result in the card
    const companyCard = document.querySelector(`[data-company="${companyName}"]`).closest('.company-card');
    const resultDiv = companyCard.querySelector('.eligibility-result');
    
    resultDiv.className = 'eligibility-result';
    resultDiv.classList.add(isEligible ? 'eligible' : 'not-eligible');
    resultDiv.innerHTML = `
        <h4>${isEligible ? '✅ Eligible' : '❌ Not Eligible'}</h4>
        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.875rem;">${reason}</pre>
    `;
    resultDiv.style.display = 'block';
    
    // Save to database
    try {
        const { error } = await supabase
            .from('company_checks')
            .insert({
                user_id: currentProfile.id,
                company_name: companyName,
                is_eligible: isEligible,
                reason: reason,
                criteria_met: criteriaMet
            });
        
        if (error) throw error;
        
        // Reload history
        await loadHistory();
        
    } catch (error) {
        console.error('Error saving check:', error);
    }
}

async function loadHistory() {
    try {
        const { data, error } = await supabase
            .from('company_checks')
            .select('*')
            .eq('user_id', currentProfile.id)
            .order('checked_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        const historyList = document.getElementById('historyList');
        
        if (!data || data.length === 0) {
            historyList.innerHTML = '<div class="empty-state"><p>No checks performed yet</p></div>';
            return;
        }
        
        historyList.innerHTML = data.map(item => `
            <div class="history-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p><strong>${item.company_name}</strong></p>
                        <p style="color: ${item.is_eligible ? 'var(--success-color)' : 'var(--error-color)'};">
                            ${item.is_eligible ? '✅ Eligible' : '❌ Not Eligible'}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 0.875rem; color: var(--gray-600);">${formatDate(item.checked_at)}</p>
                    </div>
                </div>
                <details style="margin-top: 0.5rem;">
                    <summary style="cursor: pointer; color: var(--primary-color);">View Details</summary>
                    <pre style="white-space: pre-wrap; margin-top: 0.5rem; font-size: 0.875rem; color: var(--gray-700);">${item.reason}</pre>
                </details>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading history:', error);
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
