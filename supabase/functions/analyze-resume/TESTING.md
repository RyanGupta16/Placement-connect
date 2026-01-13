# Edge Function Testing Guide
## Supabase Edge Function: analyze-resume

### Prerequisites
1. **Supabase CLI** installed: `npm install -g supabase`
2. **Supabase project** with Edge Functions enabled
3. **Gemini API Key** from Google AI Studio

---

## 1. Setup Environment Variables

### In Supabase Dashboard:
Go to **Project Settings → Edge Functions → Secrets**

Add these secrets:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Get Gemini API Key:
1. Go to: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy and paste into Supabase secrets

---

## 2. Deploy Edge Function

### From project root:
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy analyze-resume
```

---

## 3. Test with curl

### Basic Test (No Job Description):
```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/analyze-resume' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "test-user-123",
    "resume_id": "test-resume-456",
    "resume_text": "John Doe\nSoftware Engineer\n\nEXPERIENCE:\n- Developed web apps with React\n- Built APIs with Node.js\n\nSKILLS:\nJavaScript, React, Node.js",
    "file_name": "test_resume.pdf"
  }'
```

### With Job Description:
```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/analyze-resume' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d @supabase/functions/analyze-resume/test-request.json
```

---

## 4. Expected Response

### Success Response:
```json
{
  "success": true,
  "optimization_score": 75,
  "missing_keywords": [
    "AWS",
    "Docker",
    "Agile",
    "Unit Testing",
    "CI/CD"
  ],
  "improvement_suggestions": [
    "Add quantifiable achievements (e.g., 'Improved performance by 30%')",
    "Include relevant certifications or courses",
    "Add links to GitHub projects or portfolio",
    "Expand on specific technologies used in projects"
  ],
  "strengths": [
    "Clear technical skills section",
    "Relevant experience with modern frameworks",
    "Good project descriptions"
  ],
  "ats_friendly_tips": [
    "Use standard section headings (Experience, Education, Skills)",
    "Include keywords from job descriptions naturally",
    "Use clear, readable fonts",
    "Save as PDF to preserve formatting"
  ],
  "disclaimer": "This is an AI-powered Resume Optimization Assistant. Suggestions are for educational purposes only and do not guarantee job placement or ATS approval."
}
```

### Error Response:
```json
{
  "success": false,
  "error": "GEMINI_API_KEY not configured in Supabase secrets",
  "optimization_score": 0,
  "missing_keywords": [],
  "improvement_suggestions": [
    "An error occurred during analysis",
    "Please try again in a moment",
    "If the issue persists, contact support"
  ],
  "strengths": [],
  "ats_friendly_tips": []
}
```

---

## 5. Test Locally (Development)

### Start Supabase locally:
```bash
supabase start
```

### Serve function locally:
```bash
supabase functions serve analyze-resume --env-file supabase/.env.local
```

### Create `.env.local`:
```bash
GEMINI_API_KEY=your_key_here
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

### Test locally:
```bash
curl -X POST \
  'http://localhost:54321/functions/v1/analyze-resume' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "test",
    "resume_id": "test",
    "resume_text": "Sample resume text here"
  }'
```

---

## 6. Frontend Integration

### In your `resume.js`:
```javascript
import supabase from './config.js';

async function analyzeResume(resumeText, jobDescription) {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${supabaseUrl}/functions/v1/analyze-resume`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        user_id: currentProfile.id,
        resume_id: resumeData.id,
        resume_text: resumeText,
        job_description: jobDescription || null
      })
    }
  );
  
  const result = await response.json();
  return result;
}
```

---

## 7. Troubleshooting

### Error: "GEMINI_API_KEY not configured"
**Solution**: Add API key to Supabase Edge Function secrets

### Error: "Failed to get response from Gemini API"
**Solutions**:
1. Check API key is valid
2. Verify Gemini API quota not exceeded
3. Check Gemini API is enabled for your project

### Error: "Empty response from Gemini API"
**Solutions**:
1. Resume text may be too short
2. Check Gemini API response format
3. Review function logs: `supabase functions logs analyze-resume`

### Error: "Database insert error"
**Solutions**:
1. Verify `resume_feedback` table exists
2. Check RLS policies allow insert
3. Verify user_id and resume_id are valid UUIDs

---

## 8. Monitoring

### View Logs:
```bash
# Real-time logs
supabase functions logs analyze-resume --follow

# Recent logs
supabase functions logs analyze-resume --limit 50
```

### In Supabase Dashboard:
Go to **Edge Functions → analyze-resume → Logs**

---

## 9. Rate Limits & Costs

### Gemini API (Free Tier):
- **15 requests per minute**
- **1500 requests per day**
- Monitor usage at: https://makersuite.google.com/

### Supabase Edge Functions:
- **500,000 invocations/month** (Free tier)
- **2GB invocation data** (Free tier)

---

## 10. Production Checklist

✅ Gemini API key configured in secrets  
✅ Edge Function deployed successfully  
✅ Storage bucket `resumes` created  
✅ RLS policies configured  
✅ Error handling tested  
✅ Rate limiting implemented (if needed)  
✅ Monitoring/logging enabled  
✅ Frontend integration tested  
✅ User feedback mechanism added  

---

## Quick Commands Reference

```bash
# Deploy function
supabase functions deploy analyze-resume

# View logs
supabase functions logs analyze-resume

# Test locally
supabase functions serve analyze-resume

# Delete function (if needed)
supabase functions delete analyze-resume
```

---

## Support

For issues:
1. Check Supabase logs
2. Verify Gemini API status
3. Review Edge Function documentation: https://supabase.com/docs/guides/functions
4. Check Gemini API docs: https://ai.google.dev/docs
