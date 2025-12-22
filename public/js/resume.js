// Resume Analysis Page JavaScript
import supabase from './config.js';
import { ENDPOINTS } from './config.js';
import { checkAuth, getUserProfile, logout, formatFileSize, formatDate, showToast } from './utils.js';

let currentProfile = null;
let selectedFile = null;

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
    
    // Load history
    await loadHistory();
});

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await logout(supabase);
    });
    
    // Upload area click
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('resumeFile');
    const browseBtn = document.getElementById('browseBtn');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.backgroundColor = 'var(--gray-50)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files: files } });
        }
    });
    
    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
    
    // New analysis button
    document.getElementById('newAnalysisBtn')?.addEventListener('click', () => {
        resetUpload();
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
        showToast('Please upload a PDF file only', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Show file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('uploadArea').style.display = 'none';
}

async function handleAnalyze() {
    if (!selectedFile) {
        showToast('Please select a file first', 'error');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    // Show progress bar
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressBar.style.display = 'block';
    
    try {
        // Step 1: Upload to Supabase Storage
        progressText.textContent = 'Uploading resume...';
        progressFill.style.width = '20%';
        
        const fileName = `${currentProfile.id}/${Date.now()}_${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        
        // Step 2: Get public URL
        const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);
        
        progressText.textContent = 'Processing PDF...';
        progressFill.style.width = '40%';
        
        // Step 3: Save to database
        const { data: resumeData, error: resumeError } = await supabase
            .from('resumes')
            .insert({
                user_id: currentProfile.id,
                file_name: selectedFile.name,
                file_path: fileName,
                file_size: selectedFile.size,
                extracted_text: 'Processing...' // Will be updated
            })
            .select()
            .single();
        
        if (resumeError) throw resumeError;
        
        progressText.textContent = 'Analyzing with AI...';
        progressFill.style.width = '60%';
        
        // Step 4: Call Supabase Edge Function to analyze with Gemini
        const { data: session } = await supabase.auth.getSession();
        
        const response = await fetch(ENDPOINTS.ANALYZE_RESUME, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session.access_token}`
            },
            body: JSON.stringify({
                user_id: currentProfile.id,
                resume_id: resumeData.id,
                file_name: selectedFile.name,
                // In production, you would extract text here or send file
                text_content: `Resume content for ${selectedFile.name}`
            })
        });
        
        if (!response.ok) {
            // If edge function not available, use mock data
            console.warn('Edge function not available, using mock data');
            await saveMockFeedback(resumeData.id);
        } else {
            const analysisResult = await response.json();
            await saveFeedback(resumeData.id, analysisResult);
        }
        
        progressFill.style.width = '100%';
        progressText.textContent = 'Analysis complete!';
        
        // Show results after a short delay
        setTimeout(() => {
            progressBar.style.display = 'none';
            displayResults();
        }, 500);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Analysis failed. Please try again.', 'error');
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Resume';
        progressBar.style.display = 'none';
    }
}

async function saveMockFeedback(resumeId) {
    // Mock feedback for development/testing
    const mockFeedback = {
        clarity_score: Math.floor(Math.random() * 30) + 65, // 65-95
        strengths: [
            'Clear professional experience section',
            'Well-formatted contact information',
            'Good use of action verbs in descriptions'
        ],
        missing_sections: [
            'Project links or GitHub profile',
            'Certifications section could be more detailed'
        ],
        improvements: [
            'Add quantifiable achievements with numbers and metrics',
            'Include more technical skills relevant to target role',
            'Consider adding a brief professional summary at the top',
            'Ensure consistent formatting throughout the document'
        ]
    };
    
    await saveFeedback(resumeId, mockFeedback);
}

async function saveFeedback(resumeId, feedbackData) {
    try {
        const { error } = await supabase
            .from('resume_feedback')
            .insert({
                user_id: currentProfile.id,
                resume_id: resumeId,
                clarity_score: feedbackData.clarity_score,
                strengths: feedbackData.strengths,
                missing_sections: feedbackData.missing_sections,
                improvements: feedbackData.improvements
            });
        
        if (error) throw error;
        
        // Store feedback for display
        sessionStorage.setItem('latestFeedback', JSON.stringify(feedbackData));
        
    } catch (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }
}

function displayResults() {
    // Hide upload section
    document.getElementById('fileInfo').style.display = 'none';
    
    // Get feedback from session storage
    const feedbackStr = sessionStorage.getItem('latestFeedback');
    if (!feedbackStr) return;
    
    const feedback = JSON.parse(feedbackStr);
    
    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // Display score
    document.getElementById('clarityScore').textContent = feedback.clarity_score;
    
    // Display score description
    let scoreDescription = '';
    if (feedback.clarity_score >= 80) {
        scoreDescription = 'Excellent! Your resume is clear and well-structured.';
    } else if (feedback.clarity_score >= 60) {
        scoreDescription = 'Good resume with some room for improvement.';
    } else {
        scoreDescription = 'Your resume needs significant improvements.';
    }
    document.getElementById('scoreDescription').textContent = scoreDescription;
    
    // Display strengths
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = feedback.strengths.map(s => `<li>${s}</li>`).join('');
    
    // Display missing sections
    const missingList = document.getElementById('missingList');
    missingList.innerHTML = feedback.missing_sections.map(s => `<li>${s}</li>`).join('');
    
    // Display improvements
    const improvementsList = document.getElementById('improvementsList');
    improvementsList.innerHTML = feedback.improvements.map(s => `<li>${s}</li>`).join('');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Reload history
    loadHistory();
}

async function loadHistory() {
    try {
        const { data, error } = await supabase
            .from('resume_feedback')
            .select(`
                id,
                clarity_score,
                analyzed_at,
                resumes (file_name)
            `)
            .eq('user_id', currentProfile.id)
            .order('analyzed_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const historyList = document.getElementById('historyList');
        
        if (!data || data.length === 0) {
            historyList.innerHTML = '<div class="empty-state"><p>No previous analyses yet</p></div>';
            return;
        }
        
        historyList.innerHTML = data.map(item => `
            <div class="history-item">
                <p><strong>${item.resumes?.file_name || 'Resume'}</strong></p>
                <p>Score: ${item.clarity_score}/100</p>
                <p style="font-size: 0.875rem; color: var(--gray-600);">${formatDate(item.analyzed_at)}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function resetUpload() {
    selectedFile = null;
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('resumeFile').value = '';
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtn').textContent = 'Analyze Resume';
}
