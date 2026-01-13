# 🔍 Resume Analysis Debugging Checklist
## Complete Flow Debugging Guide

---

## ✅ CONFIRMED WORKING:
- Edge Function is deployed (returns 401, not 404) ✓
- Supabase project is accessible ✓

---

## 🐛 STEP-BY-STEP DEBUGGING

### STEP 1: Open Browser DevTools
**Action:**
1. Go to http://localhost:3000/resume.html
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Click "Analyze Resume"
5. Watch for errors

**What to look for:**
```
❌ Error: Failed to fetch
❌ 404 Not Found
❌ 401 Unauthorized
❌ CORS error
❌ TypeError: Cannot read property
```

**Screenshot:** Take a screenshot of any red errors

---

### STEP 2: Check Network Tab
**Action:**
1. Open DevTools → **Network** tab
2. Clear network log (trash icon)
3. Click "Analyze Resume"
4. Look for the request to `analyze-resume`

**What to check:**
- ✅ Request shows up in network tab?
- ✅ Status code? (200=success, 401=auth, 404=not deployed, 500=server error)
- ✅ Response tab shows data or error?

**If Status 404:**
→ Edge Function not deployed
→ Go to STEP 3

**If Status 401:**
→ Authentication issue
→ Go to STEP 4

**If Status 500:**
→ Server error (Gemini API issue?)
→ Go to STEP 5

**If Status 0 or CORS error:**
→ CORS headers missing
→ Go to STEP 6

---

### STEP 3: Verify Edge Function Deployment

**Check in Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/xpkpjmnmxwaxopskwwzn/functions
2. Do you see `analyze-resume` function listed?

**If NO:**
```bash
# Deploy the function
cd C:\Users\krish\Documents\Projects\Github\Placement-connect
supabase functions deploy analyze-resume
```

**If YES but still getting 404:**
→ Check the endpoint URL in config.js matches exactly

---

### STEP 4: Fix Authentication Issue

**Current Status:** ✅ Function exists but returns 401

**Possible causes:**

**A. Missing Authorization Header**
Check `public/js/resume.js` line ~180:
```javascript
const response = await fetch(ENDPOINTS.ANALYZE_RESUME, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session?.access_token}`, // ← Must be present
        'apikey': SUPABASE_ANON_KEY // ← Must be present
    },
    body: JSON.stringify({...})
});
```

**Test if user is logged in:**
Add this to resume.js before the fetch:
```javascript
console.log('Session:', session);
console.log('Access Token:', session.session?.access_token);
```

**If token is null/undefined:**
→ User not logged in properly
→ Go to STEP 7

---

### STEP 5: Check Gemini API Key

**A. Verify Key in Supabase:**
1. Go to: https://supabase.com/dashboard/project/xpkpjmnmxwaxopskwwzn/settings/functions
2. Check if `GEMINI_API_KEY` secret exists
3. Value should be: `AIzaSyBNntr9Q7CtgEdekTgkLyPJLtM0g-ryZ9M`

**If missing:**
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyBNntr9Q7CtgEdekTgkLyPJLtM0g-ryZ9M
```

**B. Test Gemini API directly:**
```bash
# PowerShell
$headers = @{"Content-Type"="application/json"}
$body = '{"contents":[{"parts":[{"text":"Hello test"}]}]}'
Invoke-WebRequest -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBNntr9Q7CtgEdekTgkLyPJLtM0g-ryZ9M" -Method POST -Headers $headers -Body $body
```

**Expected:** Should return JSON with "Hello test" response

**If error:**
- Check API key is valid
- Check quota not exceeded: https://makersuite.google.com/app/apikey

---

### STEP 6: Fix CORS Issues

**Check Edge Function has CORS headers:**

Open `supabase/functions/analyze-resume/index.ts`

Line 10-13 should have:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Line 25-27 should handle OPTIONS:
```typescript
if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
}
```

**If missing:** Add them and redeploy

---

### STEP 7: Verify User Authentication

**Test login flow:**
1. Go to http://localhost:3000/login.html
2. Open Console (F12)
3. Type: `localStorage.getItem('sb-xpkpjmnmxwaxopskwwzn-auth-token')`
4. Should show a token object

**If null:**
→ User not logged in
→ Try logging in again

**If exists:**
→ Token might be expired
→ Refresh page or re-login

---

### STEP 8: Check Supabase Storage (if using file upload)

**Verify bucket exists:**
1. Go to: https://supabase.com/dashboard/project/xpkpjmnmxwaxopskwwzn/storage/buckets
2. Should see `resumes` bucket

**If missing:**
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);
```

**Check storage policies:**
```sql
-- Run in SQL Editor
SELECT * FROM storage.policies WHERE bucket_id = 'resumes';
```

Should see policies for INSERT, SELECT, DELETE

---

### STEP 9: Test Edge Function Directly

**Create test file:** `test-edge-function.html`

```html
<!DOCTYPE html>
<html>
<head><title>Test Edge Function</title></head>
<body>
<h1>Test Resume Analysis</h1>
<button onclick="testFunction()">Test</button>
<pre id="result"></pre>

<script type="module">
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabase = createClient(
  'https://xpkpjmnmxwaxopskwwzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3BqbW5teHdheG9wc2t3d3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTcyNDUsImV4cCI6MjA4MTk3MzI0NX0.O-bzDC6O14fPGoVQuj35lCMy8CRyXOwa4pnK72bM7sk'
)

window.testFunction = async function() {
  try {
    const { data: session } = await supabase.auth.getSession()
    console.log('Session:', session)
    
    const response = await fetch(
      'https://xpkpjmnmxwaxopskwwzn.supabase.co/functions/v1/analyze-resume',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3BqbW5teHdheG9wc2t3d3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTcyNDUsImV4cCI6MjA4MTk3MzI0NX0.O-bzDC6O14fPGoVQuj35lCMy8CRyXOwa4pnK72bM7sk'
        },
        body: JSON.stringify({
          user_id: 'test-user',
          resume_id: 'test-resume',
          resume_text: 'Software Engineer with 3 years experience in React, Node.js, and MongoDB. Built scalable web applications.',
          job_description: 'Looking for Full Stack Developer with React and Node.js experience.'
        })
      }
    )
    
    const result = await response.json()
    document.getElementById('result').textContent = JSON.stringify(result, null, 2)
    console.log('Result:', result)
    
  } catch (error) {
    document.getElementById('result').textContent = 'Error: ' + error.message
    console.error('Error:', error)
  }
}
</script>
</body>
</html>
```

**Save as:** `public/test-edge-function.html`

**Open:** http://localhost:3000/test-edge-function.html

**Click Test button** and check console

---

### STEP 10: Check Edge Function Logs

**View real-time logs:**
```bash
supabase functions logs analyze-resume --follow
```

**OR in Supabase Dashboard:**
1. Go to Edge Functions → analyze-resume → Logs
2. Click "Analyze Resume" in your app
3. Watch logs appear

**Common errors in logs:**
- `GEMINI_API_KEY not configured` → Add secret (STEP 5)
- `Failed to get response from Gemini API` → Check API key or quota
- `Database insert error` → Check RLS policies

---

## 🎯 QUICK DIAGNOSIS FLOWCHART

```
Click "Analyze Resume"
    ↓
Does network request appear in DevTools?
    YES → Status code?
        200 → ✅ SUCCESS! Check if results display
        401 → Authentication issue (STEP 4)
        404 → Function not deployed (STEP 3)
        500 → Server error - check logs (STEP 10)
        CORS → CORS headers missing (STEP 6)
    NO → JavaScript error - check Console (STEP 1)
```

---

## 🔧 MOST COMMON FIXES

### Fix #1: User Not Logged In
**Solution:** Make sure you're logged in at `/login.html` first

### Fix #2: Edge Function Not Deployed
**Solution:** 
```bash
supabase functions deploy analyze-resume
```

### Fix #3: Gemini API Key Missing
**Solution:**
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyBNntr9Q7CtgEdekTgkLyPJLtM0g-ryZ9M
```

### Fix #4: Wrong Endpoint URL
**Check:** `public/js/config.js` line 13
```javascript
const ENDPOINTS = {
    ANALYZE_RESUME: `${SUPABASE_URL}/functions/v1/analyze-resume`, // ← Must match exactly
```

---

## 📋 CHECKLIST - Complete This In Order

- [ ] 1. Login to the app at /login.html
- [ ] 2. Open /resume.html
- [ ] 3. Open browser DevTools (F12) → Console tab
- [ ] 4. Upload a PDF file
- [ ] 5. Click "Analyze Resume"
- [ ] 6. Screenshot any errors in Console
- [ ] 7. Go to Network tab
- [ ] 8. Find "analyze-resume" request
- [ ] 9. Check Status code (200/401/404/500?)
- [ ] 10. Click on request → Response tab
- [ ] 11. Screenshot the response
- [ ] 12. Share screenshots

---

## 🚨 IF NOTHING WORKS

**Nuclear Option - Restart Everything:**

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear browser cache
#    DevTools → Application → Clear storage → Clear site data

# 3. Redeploy Edge Function
supabase functions deploy analyze-resume --no-verify-jwt

# 4. Restart dev server
npm run dev

# 5. Try again
```

---

## 📞 REPORT ISSUE

If still broken, provide:
1. Screenshot of Console errors
2. Screenshot of Network tab (analyze-resume request)
3. Output of: `supabase functions list`
4. Output of: `supabase secrets list`

---

**Next Action:** Go through STEP 1 → Take screenshot of Console tab when clicking "Analyze Resume"
