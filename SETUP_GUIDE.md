# PlacementIQ - Complete Setup Guide

This guide will walk you through setting up PlacementIQ from scratch. Follow each step carefully.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] A code editor (VS Code recommended)
- [ ] A Supabase account (free tier is fine)
- [ ] A Google account (for Gemini API)
- [ ] Git installed (optional, for cloning)

---

## 🎯 Step 1: Project Setup

### 1.1 Get the Code

If you have Git:
```bash
git clone <repository-url>
cd PLACEMENT_CONNECT
```

Or download and extract the ZIP file.

### 1.2 Install Dependencies

```bash
npm install
```

This installs:
- Vite (development server)
- Supabase JS client

---

## 🗄️ Step 2: Setup Supabase (Backend)

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: PlacementIQ
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to India (Southeast Asia)
   - **Pricing Plan**: Free
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

### 2.2 Get API Credentials

1. In your Supabase project dashboard
2. Go to **Project Settings** (⚙️ icon in sidebar)
3. Click **API** section
4. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)

**Save these values - you'll need them!**

### 2.3 Setup Database

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open `supabase/schema.sql` from the project folder
4. Copy **entire contents** of the file
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" message

This creates all tables, policies, and functions.

### 2.4 Setup Storage Bucket

1. In Supabase Dashboard, click **Storage** (left sidebar)
2. Click "Create a new bucket"
3. Fill in:
   - **Name**: `resumes`
   - **Public bucket**: ❌ **UNCHECK** (must be private)
4. Click "Create bucket"

#### Add Storage Policies

1. Click on the `resumes` bucket
2. Click "Policies" tab
3. Click "New Policy"

**Policy 1: Users can upload**
```sql
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Users can view**
```sql
CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Users can delete**
```sql
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🤖 Step 3: Setup Google Gemini API

### 3.1 Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select "Create API key in new project" (or use existing)
5. Copy the API key (starts with `AIza...`)

**Save this key - you'll need it!**

### 3.2 Test API Key (Optional)

Open terminal and run:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Replace `YOUR_API_KEY` with your actual key. You should get a JSON response.

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Create .env File

In the project root, create a file named `.env`:

```bash
# Copy the example file
cp .env.example .env
```

Or create manually.

### 4.2 Edit .env File

Open `.env` and fill in your values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your_anon_key

# Google Gemini API (for Edge Functions)
GEMINI_API_KEY=AIza...your_gemini_key
```

**Important**: 
- Replace `xxxxx.supabase.co` with your actual Supabase URL
- Replace the keys with your actual keys
- Don't commit this file to Git!

### 4.3 Update Frontend Config

Open `public/js/config.js` and update:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...your_anon_key';
```

Or leave as-is if you're using Vite build process with environment variables.

---

## 🚀 Step 5: Deploy Edge Functions

Edge Functions enable AI features (resume analysis and mock interviews).

### 5.1 Install Supabase CLI

**Windows**:
```bash
npm install -g supabase
```

**macOS/Linux**:
```bash
brew install supabase/tap/supabase
```

Or use npm: `npm install -g supabase`

### 5.2 Login to Supabase

```bash
supabase login
```

This opens your browser. Sign in and authorize.

### 5.3 Link Your Project

```bash
supabase link --project-ref your-project-ref
```

To find your project ref:
1. Go to Supabase Dashboard
2. Project Settings → General
3. Copy "Reference ID"

### 5.4 Deploy Functions

```bash
# Deploy resume analysis function
supabase functions deploy analyze-resume

# Deploy mock interview function
supabase functions deploy mock-interview
```

### 5.5 Set Environment Variables in Supabase

1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Click "Add secret"
4. Add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (`AIza...`)
5. Click "Save"

---

## 🧪 Step 6: Test Locally

### 6.1 Start Development Server

```bash
npm run dev
```

This starts Vite dev server at `http://localhost:3000`

### 6.2 Test Core Features

1. **Landing Page**: Open `http://localhost:3000`
   - Should show hero section, features, etc.

2. **Sign Up**: 
   - Click "Sign Up"
   - Fill in the form
   - Submit
   - Check your email for confirmation (if enabled)

3. **Login**:
   - Go to login page
   - Enter credentials
   - Should redirect to dashboard

4. **Dashboard**:
   - Should show your name
   - Profile information displayed
   - Stats cards (will be 0 initially)

5. **Resume Analysis**:
   - Upload a PDF resume
   - Click "Analyze"
   - Should show progress bar
   - Results displayed with score and feedback

6. **Eligibility Checker**:
   - Check eligibility for any company
   - Should show eligible/not eligible with reasoning

7. **Mock Interview**:
   - Start an interview
   - Answer a few questions
   - End interview
   - View feedback and scores

### 6.3 Check Console for Errors

Open browser DevTools (F12) → Console tab
- Look for any red errors
- Common issues:
  - Supabase not configured → Check config.js
  - 403 errors → Check RLS policies
  - Edge function errors → Check function deployment

---

## 🌐 Step 7: Deploy to Production

### Option A: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Redeploy** after adding env vars

### Option B: Deploy to Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Set Environment Variables**:
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add same variables as Vercel

### Option C: GitHub + Vercel/Netlify

1. Push code to GitHub
2. Connect repository in Vercel/Netlify dashboard
3. Set environment variables
4. Deploy automatically on push

---

## ✅ Step 8: Post-Deployment Checklist

After deployment, verify:

- [ ] Landing page loads correctly
- [ ] Sign up works (creates account)
- [ ] Login works (redirects to dashboard)
- [ ] Dashboard shows correct data
- [ ] Resume analysis uploads and analyzes PDF
- [ ] Eligibility checker shows results
- [ ] Mock interview starts and completes
- [ ] All links work (no 404 errors)
- [ ] Mobile responsive (test on phone)
- [ ] Console has no critical errors

---

## 🔧 Troubleshooting

### Issue: "Supabase client not loaded"

**Solution**: Make sure Supabase CDN script is loaded:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Issue: "Invalid API credentials"

**Solution**:
1. Check `.env` file has correct values
2. Verify config.js has correct Supabase URL and key
3. Make sure you're using the **anon public** key, not service role key

### Issue: "Row Level Security policy violation"

**Solution**:
1. Check you ran the complete schema.sql
2. Verify all RLS policies were created
3. In Supabase Dashboard → Database → Policies, verify policies exist

### Issue: "Edge Function not found"

**Solution**:
1. Verify functions were deployed: `supabase functions list`
2. Check function URLs in config.js match deployed functions
3. Redeploy: `supabase functions deploy <function-name>`

### Issue: "Resume upload fails"

**Solution**:
1. Check storage bucket `resumes` exists
2. Verify storage policies are in place
3. Check bucket is set to **private** (not public)
4. Verify file size < 5MB

### Issue: "Mock interview doesn't work"

**Solution**:
1. Check Gemini API key is set in Supabase Edge Functions
2. Test API key with curl command (see Step 3.2)
3. Check browser console for specific errors
4. Verify daily session limit (3 per day)

---

## 📞 Getting Help

If you're stuck:

1. **Check logs**:
   - Browser console (F12)
   - Supabase Dashboard → Logs
   - Edge Function logs: `supabase functions logs <function-name>`

2. **Re-verify setup**:
   - Go through this guide again
   - Double-check all credentials

3. **Common fixes**:
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Restart dev server
   - Redeploy edge functions

4. **Open an issue** on GitHub with:
   - What you're trying to do
   - What error you're seeing
   - Console logs (remove sensitive data)

---

## 🎉 Success!

If everything works, congratulations! You've successfully deployed PlacementIQ.

**Next steps**:
- Share with friends
- Collect feedback
- Consider adding more companies to eligibility checker
- Improve UI/UX based on user feedback

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Vite Documentation](https://vitejs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Remember**: This is a preparation tool. Keep improving and adding features!

Good luck with your placements! 🚀
