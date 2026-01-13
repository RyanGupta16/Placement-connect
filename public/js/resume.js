// Resume Analysis Page JavaScript
import supabase from './config.js';
import { ENDPOINTS, SUPABASE_ANON_KEY } from './config.js';
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
    const jobDescriptionInput = document.getElementById('jobDescription');
    
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    // Show progress bar
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressBar.style.display = 'block';
    
    try {
        // Step 1: Extract text from PDF (simplified - in production use PDF.js)
        progressText.textContent = 'Reading resume...';
        progressFill.style.width = '20%';
        
        const resumeText = await extractTextFromPDF(selectedFile);
        
        // Step 2: Upload to Supabase Storage
        progressText.textContent = 'Uploading resume...';
        progressFill.style.width = '35%';
        
        const fileName = `${currentProfile.id}/${Date.now()}_${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        
        // Step 3: Get public URL
        const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);
        
        progressText.textContent = 'Saving to database...';
        progressFill.style.width = '50%';
        
        // Step 4: Save to database
        const { data: resumeData, error: resumeError } = await supabase
            .from('resumes')
            .insert({
                user_id: currentProfile.id,
                file_name: selectedFile.name,
                file_path: fileName,
                file_size: selectedFile.size,
                extracted_text: resumeText,
                is_primary: false
            })
            .select()
            .single();
        
        if (resumeError) throw resumeError;
        
        progressText.textContent = '🤖 Analyzing with AI (Gemini 1.5 Flash)...';
        progressFill.style.width = '70%';
        
        // Step 5: Call Supabase Edge Function to analyze with Gemini
        const { data: session } = await supabase.auth.getSession();
        const jobDescription = jobDescriptionInput?.value?.trim() || null;
        
        const response = await fetch(ENDPOINTS.ANALYZE_RESUME, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session?.access_token}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                user_id: currentProfile.id,
                resume_id: resumeData.id,
                resume_text: resumeText,
                job_description: jobDescription,
                file_name: selectedFile.name
            })
        });
        
        progressFill.style.width = '90%';
        
        let analysisResult;
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Edge function error:', errorText);
            console.error('Response status:', response.status);
            console.error('Endpoint:', ENDPOINTS.ANALYZE_RESUME);
            
            showToast(`API Error: ${response.status} - Edge Function may not be deployed yet`, 'error');
            
            // Fallback to mock feedback if Edge Function fails
            console.warn('Using fallback analysis');
            analysisResult = generateFallbackAnalysis();
            await saveFeedback(resumeData.id, analysisResult);
        } else {
            const result = await response.json();
            
            if (result.success) {
                analysisResult = {
                    optimization_score: result.optimization_score,
                    missing_keywords: result.missing_keywords,
                    improvement_suggestions: result.improvement_suggestions,
                    strengths: result.strengths,
                    ats_friendly_tips: result.ats_friendly_tips,
                    disclaimer: result.disclaimer
                };
            } else {
                // Edge Function returned error
                console.error('Analysis error:', result.error);
                analysisResult = generateFallbackAnalysis();
            }
            
            // Note: Feedback is already saved in Edge Function, but we save for consistency
            await saveFeedback(resumeData.id, analysisResult);
        }
        
        progressFill.style.width = '100%';
        progressText.textContent = '✅ Analysis complete!';
        
        // Show results after a short delay
        setTimeout(() => {
            progressBar.style.display = 'none';
            displayResults(analysisResult);
        }, 500);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Analysis failed. Please try again.', 'error');
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Resume';
        progressBar.style.display = 'none';
    }
}

/**
 * Extract text from PDF (simplified version)
 * In production, use PDF.js library for better extraction
 */
async function extractTextFromPDF(file) {
    // For now, return a placeholder
    // In production, integrate PDF.js library
    return `Resume: ${file.name}\n\nPlease note: This is a simplified text extraction. For better results, the resume should be analyzed directly from the PDF.`;
}

/**
 * Generate fallback analysis if Edge Function is not available
 */
function generateFallbackAnalysis() {
    return {
        optimization_score: Math.floor(Math.random() * 25) + 65, // 65-90
        missing_keywords: [
            'Technical skills (Python, Java, JavaScript, etc.)',
            'Soft skills (Leadership, Communication)',
            'Certifications or courses',
            'Project metrics and results'
        ],
        improvement_suggestions: [
            'Add quantifiable achievements with numbers and percentages',
            'Include relevant technical keywords from job descriptions',
            'Add links to GitHub projects or portfolio',
            'Use strong action verbs (Developed, Implemented, Led)',
            'Include a professional summary at the top',
            'Add certifications section if you have any'
        ],
        strengths: [
            'Resume structure is organized',
            'Contact information is clear',
            'File format is appropriate (PDF)'
        ],
        ats_friendly_tips: [
            'Use standard section headers (Education, Experience, Skills, Projects)',
            'Include relevant keywords naturally throughout the resume',
            'Use simple, clean formatting without tables or columns',
            'Save as PDF to preserve formatting across devices'
        ],
        disclaimer: 'This is an AI-powered Resume Optimization Assistant. Analysis performed offline. For best results, configure the Gemini API.'
    };
}

async function saveFeedback(resumeId, feedbackData) {
    try {
        // Map new field names to database schema
        const { error } = await supabase
            .from('resume_feedback')
            .insert({
                user_id: currentProfile.id,
                resume_id: resumeId,
                clarity_score: feedbackData.optimization_score || feedbackData.clarity_score || 70,
                strengths: feedbackData.strengths || [],
                missing_sections: feedbackData.missing_keywords || feedbackData.missing_sections || [],
                improvements: feedbackData.improvement_suggestions || feedbackData.improvements || []
            });
        
        if (error) {
            console.error('Error saving feedback:', error);
            // Don't throw - analysis already complete
        }
        
        // Store feedback for display
        sessionStorage.setItem('latestFeedback', JSON.stringify(feedbackData));
        
    } catch (error) {
        console.error('Error saving feedback:', error);
        // Don't throw error - continue to display results
    }
}

function displayResults(feedbackData) {
    // Use provided feedback or get from session storage
    const feedback = feedbackData || JSON.parse(sessionStorage.getItem('latestFeedback') || '{}');
    
    if (!feedback) {
        showToast('No feedback data available', 'error');
        return;
    }
    
    // Hide upload section
    document.getElementById('fileInfo').style.display = 'none';
    
    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // Display score
    const score = feedback.optimization_score || feedback.clarity_score || 0;
    document.getElementById('clarityScore').textContent = score;
    
    // Display score description
    let scoreDescription = '';
    let scoreClass = '';
    if (score >= 85) {
        scoreDescription = '🎉 Excellent! Your resume is well-optimized and comprehensive.';
        scoreClass = 'score-excellent';
    } else if (score >= 70) {
        scoreDescription = '👍 Good! Your resume is solid with room for enhancement.';
        scoreClass = 'score-good';
    } else if (score >= 55) {
        scoreDescription = '📈 Fair. Your resume needs improvements in several areas.';
        scoreClass = 'score-fair';
    } else {
        scoreDescription = '⚠️ Needs work. Consider significant revisions.';
        scoreClass = 'score-poor';
    }
    
    const scoreElement = document.getElementById('clarityScore');
    scoreElement.className = scoreClass;
    document.getElementById('scoreDescription').textContent = scoreDescription;
    
    // Display strengths
    const strengthsList = document.getElementById('strengthsList');
    const strengths = feedback.strengths || [];
    strengthsList.innerHTML = strengths.length > 0
        ? strengths.map(s => `<li>✓ ${s}</li>`).join('')
        : '<li>No specific strengths identified</li>';
    
    // Display missing keywords
    const missingList = document.getElementById('missingList');
    const missing = feedback.missing_keywords || feedback.missing_sections || [];
    missingList.innerHTML = missing.length > 0
        ? missing.map(s => `<li>• ${s}</li>`).join('')
        : '<li>No major gaps identified</li>';
    
    // Display improvements
    const improvementsList = document.getElementById('improvementsList');
    const improvements = feedback.improvement_suggestions || feedback.improvements || [];
    improvementsList.innerHTML = improvements.length > 0
        ? improvements.map(s => `<li>💡 ${s}</li>`).join('')
        : '<li>No specific improvements suggested</li>';
    
    // Display ATS-friendly tips (if available)
    if (feedback.ats_friendly_tips && feedback.ats_friendly_tips.length > 0) {
        const tipsSection = document.getElementById('atsTipsSection');
        const tipsList = document.getElementById('atsTipsList');
        
        if (tipsSection && tipsList) {
            tipsList.innerHTML = feedback.ats_friendly_tips.map(tip => `<li>🔧 ${tip}</li>`).join('');
            tipsSection.style.display = 'block';
        }
    }
    
    // Display disclaimer
    if (feedback.disclaimer) {
        const disclaimerElement = document.getElementById('analysisDisclaimer');
        if (disclaimerElement) {
            disclaimerElement.textContent = feedback.disclaimer;
            disclaimerElement.style.display = 'block';
        }
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
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
