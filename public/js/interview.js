// Mock Interview Page JavaScript
import supabase from './config.js';
import { ENDPOINTS } from './config.js';
import { checkAuth, getUserProfile, logout, formatDate, showToast } from './utils.js';

let currentProfile = null;
let currentSessionId = null;
let conversation = [];
let questionCount = 0;
const MAX_GENERAL_QUESTIONS = 5;
const MAX_SPECIALIZED_QUESTIONS = 4;
const MAX_QUESTIONS = MAX_GENERAL_QUESTIONS + MAX_SPECIALIZED_QUESTIONS; // 9 total
const MAX_SESSIONS_PER_DAY = 3;

// Mock interview questions (fallback)
const MOCK_QUESTIONS = [
    "Tell me about yourself and your background.",
    "Why do you want to work in this field?",
    "What are your greatest strengths?",
    "Describe a challenging situation you faced and how you handled it.",
    "Where do you see yourself in 5 years?",
    "What motivates you in your work or studies?",
    "Tell me about a time when you worked in a team.",
    "What is your biggest weakness and how are you working on it?"
];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const session = await checkAuth(supabase);
    if (!session) return;
    
    // Load user data
    currentProfile = await getUserProfile(supabase);
    
    if (currentProfile) {
        document.getElementById('userName').textContent = currentProfile.name;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Check session limit
    await checkSessionLimit();
    
    // Load history
    await loadHistory();
});

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await logout(supabase);
    });
    
    // Start interview button
    document.getElementById('startInterviewBtn').addEventListener('click', startInterview);
    
    // Send answer button
    document.getElementById('sendAnswerBtn').addEventListener('click', sendAnswer);
    
    // End interview button
    document.getElementById('endInterviewBtn').addEventListener('click', endInterview);
    
    // Enter key to send
    document.getElementById('answerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAnswer();
        }
    });
    
    // New interview button
    document.getElementById('newInterviewBtn')?.addEventListener('click', () => {
        resetInterview();
    });
}

async function checkSessionLimit() {
    try {
        // Get today's start and end
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { count, error } = await supabase
            .from('interview_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentProfile.id)
            .gte('started_at', today.toISOString())
            .lt('started_at', tomorrow.toISOString());
        
        if (error) throw error;
        
        document.getElementById('sessionCount').textContent = count || 0;
        
        // Disable start button if limit reached
        if (count >= MAX_SESSIONS_PER_DAY) {
            document.getElementById('startInterviewBtn').disabled = true;
            document.getElementById('startInterviewBtn').textContent = 'Daily Limit Reached';
            showToast('You have reached the daily limit of 3 interviews', 'warning');
        }
        
    } catch (error) {
        console.error('Error checking session limit:', error);
    }
}

async function startInterview() {
    try {
        // Create new interview session
        const { data, error } = await supabase
            .from('interview_sessions')
            .insert({
                user_id: currentProfile.id,
                conversation: [],
                status: 'active'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        currentSessionId = data.id;
        conversation = [];
        questionCount = 0;
        
        // Hide start screen, show chat
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('chatScreen').style.display = 'block';
        
        // Ask first question
        await askQuestion();
        
    } catch (error) {
        console.error('Error starting interview:', error);
        showToast('Error starting interview', 'error');
    }
}

async function askQuestion() {
    if (questionCount >= MAX_QUESTIONS) {
        await endInterview();
        return;
    }
    
    // Show AI typing indicator
    showTypingIndicator();
    
    try {
        let question = '';
        
        // Determine if we're in specialized question phase
        const isSpecializedPhase = questionCount >= MAX_GENERAL_QUESTIONS;
        
        // Try to get question from Edge Function (Gemini)
        const { data: session } = await supabase.auth.getSession();
        
        try {
            const response = await fetch(ENDPOINTS.MOCK_INTERVIEW, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.session.access_token}`
                },
                body: JSON.stringify({
                    action: 'get_question',
                    conversation: conversation,
                    question_number: questionCount + 1,
                    is_specialized: isSpecializedPhase,
                    user_profile: {
                        branch: currentProfile.branch,
                        skills: currentProfile.skills || [],
                        college: currentProfile.college
                    }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                question = data.question;
            } else {
                // Fallback to mock questions
                question = MOCK_QUESTIONS[questionCount % MOCK_QUESTIONS.length];
            }
        } catch (fetchError) {
            console.warn('Edge function not available, using mock questions');
            question = MOCK_QUESTIONS[questionCount % MOCK_QUESTIONS.length];
        }
        
        // Add to conversation
        conversation.push({
            role: 'ai',
            content: question,
            timestamp: new Date().toISOString()
        });
        
        questionCount++;
        
        // Display message
        setTimeout(() => {
            hideTypingIndicator();
            addMessage('ai', question);
            
            // Update session in database
            updateSession();
        }, 1000);
        
    } catch (error) {
        console.error('Error asking question:', error);
        hideTypingIndicator();
        showToast('Error generating question', 'error');
    }
}

async function sendAnswer() {
    const answerInput = document.getElementById('answerInput');
    const answer = answerInput.value.trim();
    
    if (!answer) {
        showToast('Please type your answer', 'warning');
        return;
    }
    
    if (answer.length < 20) {
        showToast('Please provide a more detailed answer (at least 20 characters)', 'warning');
        return;
    }
    
    // Add user answer to conversation
    conversation.push({
        role: 'user',
        content: answer,
        timestamp: new Date().toISOString()
    });
    
    // Display user message
    addMessage('user', answer);
    
    // Clear input
    answerInput.value = '';
    
    // Update session
    await updateSession();
    
    // Ask next question
    await askQuestion();
}

async function endInterview() {
    try {
        // Calculate scores
        const analysisResult = await analyzeInterview();
        const { communicationScore, confidenceScore, feedback, questionAnalysis } = analysisResult;
        
        // Update session in database
        const { error } = await supabase
            .from('interview_sessions')
            .update({
                conversation: conversation,
                communication_score: communicationScore,
                confidence_score: confidenceScore,
                feedback: feedback,
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', currentSessionId);
        
        if (error) throw error;
        
        // Hide chat, show results
        document.getElementById('chatScreen').style.display = 'none';
        document.getElementById('resultsScreen').style.display = 'block';
        
        // Display results with question analysis
        displayResults(communicationScore, confidenceScore, feedback, questionAnalysis);
        
        // Reload history
        await loadHistory();
        
    } catch (error) {
        console.error('Error ending interview:', error);
        showToast('Error ending interview', 'error');
    }
}

async function analyzeInterview() {
    // Try to get AI analysis
    const { data: session } = await supabase.auth.getSession();
    
    try {
        const response = await fetch(ENDPOINTS.MOCK_INTERVIEW, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session.access_token}`
            },
            body: JSON.stringify({
                action: 'analyze',
                conversation: conversation
            })
        });
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('Edge function not available, using mock analysis');
    }
    
    // Fallback: Mock analysis
    return generateMockAnalysis();
}

function generateMockAnalysis() {
    // Simple rule-based scoring
    const userMessages = conversation.filter(m => m.role === 'user');
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    
    // Communication score based on answer length
    let communicationScore = 50;
    if (avgLength > 100) communicationScore += 20;
    if (avgLength > 200) communicationScore += 15;
    if (avgLength > 300) communicationScore += 10;
    
    // Random variance
    communicationScore += Math.floor(Math.random() * 10);
    communicationScore = Math.min(95, communicationScore);
    
    // Confidence score (slightly different)
    let confidenceScore = communicationScore + Math.floor(Math.random() * 10) - 5;
    confidenceScore = Math.max(50, Math.min(95, confidenceScore));
    
    const feedback = [
        `You answered ${questionCount} questions with an average response length of ${Math.round(avgLength)} characters.`,
        avgLength > 200 ? 'Your answers were detailed and thorough.' : 'Try to provide more detailed answers with specific examples.',
        'Use the STAR method (Situation, Task, Action, Result) for behavioral questions.',
        'Practice speaking confidently and maintain eye contact in real interviews.',
        'Consider adding more quantifiable achievements in your responses.'
    ];
    
    return { communicationScore, confidenceScore, feedback };
}

function displayResults(communicationScore, confidenceScore, feedback, questionAnalysis = []) {
    document.getElementById('communicationScore').textContent = communicationScore;
    document.getElementById('confidenceScore').textContent = confidenceScore;
    
    const feedbackList = document.getElementById('feedbackList');
    feedbackList.innerHTML = feedback.map(f => `<li>${f}</li>`).join('');
    
    // Questions summary with detailed analysis
    const questionsSummary = document.getElementById('questionsSummary');
    
    if (questionAnalysis && questionAnalysis.length > 0) {
        // Show detailed analysis for each question
        questionsSummary.innerHTML = questionAnalysis.map((qa, i) => `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--gray-50); border-radius: 12px; border-left: 4px solid var(--primary);">
                <h4 style="margin-bottom: 1rem; color: var(--primary);">Question ${i+1}</h4>
                <p style="margin-bottom: 1rem;"><strong>Q:</strong> ${qa.question}</p>
                
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--success);">✓ Your Answer Summary:</strong>
                    <p style="margin-top: 0.5rem; color: var(--gray-700);">${qa.yourAnswer}</p>
                </div>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 8px;">
                    <strong style="color: var(--primary);">💡 Ideal Answer Should Include:</strong>
                    <p style="margin-top: 0.5rem;">${qa.idealAnswer}</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--primary);">📌 Key Tips:</strong>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                        ${qa.keyTips.map(tip => `<li style="margin-bottom: 0.5rem;">${tip}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="padding: 1rem; background: #FFF3CD; border-radius: 8px;">
                    <strong style="color: #856404;">⚠️ Areas to Improve:</strong>
                    <p style="margin-top: 0.5rem; color: #856404;">${qa.improvementAreas}</p>
                </div>
            </div>
        `).join('');
    } else {
        // Fallback: Show basic questions list
        const questions = conversation.filter(m => m.role === 'ai');
        questionsSummary.innerHTML = questions.map((q, i) => `
            <p><strong>Q${i+1}:</strong> ${q.content}</p>
        `).join('');
    }
}

async function updateSession() {
    if (!currentSessionId) return;
    
    try {
        const { error } = await supabase
            .from('interview_sessions')
            .update({
                conversation: conversation
            })
            .eq('id', currentSessionId);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error updating session:', error);
    }
}

function addMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-sender">${role === 'ai' ? 'AI Interviewer' : 'You'}</div>
            <div class="message-text">${content}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    document.getElementById('chatStatus').style.display = 'flex';
    document.getElementById('sendAnswerBtn').disabled = true;
}

function hideTypingIndicator() {
    document.getElementById('chatStatus').style.display = 'none';
    document.getElementById('sendAnswerBtn').disabled = false;
}

async function loadHistory() {
    try {
        const { data, error } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('user_id', currentProfile.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const historyList = document.getElementById('historyList');
        
        if (!data || data.length === 0) {
            historyList.innerHTML = '<div class="empty-state"><p>No previous interviews yet</p></div>';
            return;
        }
        
        historyList.innerHTML = data.map(item => `
            <div class="history-item">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p><strong>Interview Session</strong></p>
                        <p>Communication: ${item.communication_score}/100 | Confidence: ${item.confidence_score}/100</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 0.875rem; color: var(--gray-600);">${formatDate(item.completed_at)}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function resetInterview() {
    currentSessionId = null;
    conversation = [];
    questionCount = 0;
    
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('answerInput').value = '';
    
    checkSessionLimit();
}
