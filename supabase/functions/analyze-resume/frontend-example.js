// ============================================
// FRONTEND EXAMPLE: Calling Analyze Resume Edge Function
// Vanilla JavaScript with Supabase Client
// ============================================

/**
 * Example: Call the analyze-resume Edge Function from frontend
 */
async function analyzeResume(resumeText, jobDescription = null) {
  try {
    // Get authenticated session
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session) {
      throw new Error('User not authenticated');
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', session.session.user.id)
      .single();
    
    // Prepare request payload
    const payload = {
      user_id: profile.id,
      resume_id: 'temp-' + Date.now(), // Or use actual resume ID from DB
      resume_text: resumeText,
      job_description: jobDescription, // Optional
      file_name: 'resume.pdf'
    };
    
    // Call Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/analyze-resume`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(payload)
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Edge Function error: ${error}`);
    }
    
    // Parse response
    const result = await response.json();
    
    console.log('Analysis Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

/**
 * Example: Display results in UI
 */
function displayAnalysisResults(result) {
  const {
    optimization_score,
    missing_keywords,
    improvement_suggestions,
    strengths,
    ats_friendly_tips,
    disclaimer
  } = result;
  
  // Score Display
  document.getElementById('score').textContent = optimization_score;
  document.getElementById('scoreBar').style.width = `${optimization_score}%`;
  
  // Score Color (Red -> Yellow -> Green)
  let scoreColor;
  if (optimization_score >= 75) {
    scoreColor = '#10b981'; // Green
  } else if (optimization_score >= 50) {
    scoreColor = '#f59e0b'; // Yellow
  } else {
    scoreColor = '#ef4444'; // Red
  }
  document.getElementById('scoreBar').style.backgroundColor = scoreColor;
  
  // Missing Keywords
  const keywordsList = document.getElementById('missingKeywords');
  keywordsList.innerHTML = missing_keywords
    .map(keyword => `<li class="keyword-item">${keyword}</li>`)
    .join('');
  
  // Improvement Suggestions
  const suggestionsList = document.getElementById('improvements');
  suggestionsList.innerHTML = improvement_suggestions
    .map(suggestion => `<li class="suggestion-item">💡 ${suggestion}</li>`)
    .join('');
  
  // Strengths
  const strengthsList = document.getElementById('strengths');
  strengthsList.innerHTML = strengths
    .map(strength => `<li class="strength-item">✅ ${strength}</li>`)
    .join('');
  
  // ATS Tips
  const atsTipsList = document.getElementById('atsTips');
  atsTipsList.innerHTML = ats_friendly_tips
    .map(tip => `<li class="tip-item">📝 ${tip}</li>`)
    .join('');
  
  // Disclaimer
  document.getElementById('disclaimer').textContent = disclaimer;
  
  // Show results section
  document.getElementById('resultsSection').style.display = 'block';
}

/**
 * Example: Complete flow with file upload
 */
async function analyzeResumeFromFile(file, jobDescription = null) {
  try {
    // Show loading
    showLoading('Extracting text from PDF...');
    
    // Extract text from PDF (use PDF.js or similar library)
    const resumeText = await extractTextFromPDF(file);
    
    // Update loading
    showLoading('Analyzing with AI...');
    
    // Call analysis function
    const result = await analyzeResume(resumeText, jobDescription);
    
    // Hide loading
    hideLoading();
    
    // Display results
    displayAnalysisResults(result);
    
    // Show success message
    showToast('Resume analyzed successfully!', 'success');
    
  } catch (error) {
    hideLoading();
    showToast('Failed to analyze resume. Please try again.', 'error');
    console.error(error);
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Analyze with just resume text
const resumeText = `
John Doe
Software Engineer

EXPERIENCE:
- Developed web applications using React and Node.js
- Built REST APIs for e-commerce platform

SKILLS:
JavaScript, React, Node.js, MongoDB
`;

analyzeResume(resumeText)
  .then(result => console.log('Analysis:', result))
  .catch(error => console.error('Error:', error));

// Example 2: Analyze with job description
const jobDescription = `
We are looking for a Full Stack Developer with experience in React, 
Node.js, and AWS. Must have 2+ years of experience.
`;

analyzeResume(resumeText, jobDescription)
  .then(result => displayAnalysisResults(result))
  .catch(error => console.error('Error:', error));

// Example 3: With file upload
const fileInput = document.getElementById('resumeFile');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    const jobDesc = document.getElementById('jobDescription').value;
    analyzeResumeFromFile(file, jobDesc || null);
  }
});
