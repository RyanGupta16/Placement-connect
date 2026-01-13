# 🚀 Authentication Setup Checklist

Use this checklist to verify your authentication system is properly configured.

---

## ✅ 1. Supabase Configuration

### A. Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com) and sign in
- [ ] Create a new project
- [ ] Wait for database to initialize (2-3 minutes)
- [ ] Note down your project URL and anon key

### B. Get API Credentials
- [ ] Go to Project Settings → API
- [ ] Copy **Project URL** (e.g., `https://xxxxx.supabase.co`)
- [ ] Copy **anon public** key (long JWT token)

### C. Update Configuration File
- [ ] Open [`public/js/config.js`](public/js/config.js)
- [ ] Replace `SUPABASE_URL` with your Project URL
- [ ] Replace `SUPABASE_ANON_KEY` with your anon key
- [ ] Save the file

**Current config.js has:**
```javascript
const SUPABASE_URL = 'https://xpkpjmnmxwaxopskwwzn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

✅ **ALREADY CONFIGURED** - You can use existing credentials or update with your own.

---

## ✅ 2. Database Setup

### A. Run Database Schema
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy entire contents of [`supabase/schema.sql`](supabase/schema.sql)
- [ ] Paste into SQL Editor
- [ ] Click "Run" or press `Ctrl+Enter`
- [ ] Verify no errors in output

### B. Verify Tables Created
- [ ] Go to Table Editor
- [ ] Confirm these tables exist:
  - [ ] `profiles`
  - [ ] `resumes`
  - [ ] `resume_feedback`
  - [ ] `interview_sessions`
  - [ ] `company_checks`

### C. Verify Triggers Created
Run this in SQL Editor:
```sql
SELECT tgname FROM pg_trigger WHERE tgname IN ('on_auth_user_created', 'on_profile_updated');
```
- [ ] Should return 2 rows
- [ ] `on_auth_user_created` exists
- [ ] `on_profile_updated` exists

### D. Verify RLS is Enabled
Run this in SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```
- [ ] Should return 5 tables with RLS enabled

---

## ✅ 3. Storage Setup (For Resume Upload)

### A. Create Storage Bucket
- [ ] Go to Storage in Supabase Dashboard
- [ ] Click "Create Bucket"
- [ ] Name: `resumes`
- [ ] Make it **Private** (not public)
- [ ] Click "Create"

### B. Set Storage Policies
Run in SQL Editor:
```sql
-- Allow users to upload their own resumes
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own resumes
CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
```
- [ ] Policies created successfully

---

## ✅ 4. Authentication Settings

### A. Email Configuration (Optional)
- [ ] Go to Authentication → Settings → Email
- [ ] Choose your preference:
  - [ ] **Development**: Disable "Confirm email" for faster testing
  - [ ] **Production**: Enable "Confirm email" for security
- [ ] Customize email templates if desired

### B. Email Provider (Production Only)
For production, configure SMTP:
- [ ] Go to Project Settings → Auth → SMTP Settings
- [ ] Enter your SMTP credentials
- [ ] Test email sending

**For development**: Use Supabase's default emails (goes to spam, check spam folder)

### C. Password Requirements
Default is 6 characters minimum. To change:
- [ ] Go to Authentication → Settings → Password
- [ ] Update minimum length if desired

---

## ✅ 5. Test Authentication Flow

### A. Test Signup
1. [ ] Open your site in browser
2. [ ] Go to `/signup.html`
3. [ ] Fill in all fields:
   - Name: Test User
   - Email: test@example.com
   - Password: test123456
   - College: Test College
   - Branch: Computer Science
   - Year: 3
   - CGPA: 8.5
   - Skills: JavaScript, Python
4. [ ] Click "Sign Up"
5. [ ] Check for success message
6. [ ] If email confirmation enabled, check email
7. [ ] Verify redirect to dashboard or login

**Verify in Supabase:**
- [ ] Dashboard → Authentication → Users → See new user
- [ ] Dashboard → Table Editor → profiles → See new profile with same ID

### B. Test Login
1. [ ] Open `/login.html`
2. [ ] Enter email: test@example.com
3. [ ] Enter password: test123456
4. [ ] Check "Remember me" (optional)
5. [ ] Click "Login"
6. [ ] Should redirect to `/dashboard.html`
7. [ ] Check browser console for errors

### C. Test Protected Route
1. [ ] Clear browser localStorage (to logout)
2. [ ] Try to access `/dashboard.html` directly
3. [ ] Should redirect to `/login.html`
4. [ ] Login again
5. [ ] Should access dashboard successfully

### D. Test Logout
1. [ ] On dashboard, click logout button
2. [ ] Should redirect to home page
3. [ ] Try accessing dashboard again
4. [ ] Should redirect to login

### E. Test Forgot Password
1. [ ] On login page, click "Forgot password?"
2. [ ] Should prompt for email
3. [ ] Check email for reset link
4. [ ] Click link (should open reset page - needs implementation)

---

## ✅ 6. Verify Files are Correct

### JavaScript Files
- [ ] [`public/js/config.js`](public/js/config.js) - Supabase credentials
- [ ] [`public/js/utils.js`](public/js/utils.js) - Has all auth functions
- [ ] [`public/js/signup.js`](public/js/signup.js) - Enhanced version
- [ ] [`public/js/login.js`](public/js/login.js) - Enhanced with forgot password
- [ ] [`public/js/auth-examples.js`](public/js/auth-examples.js) - Examples file

### HTML Files
- [ ] [`public/login.html`](public/login.html) - Has remember me checkbox & forgot password link
- [ ] [`public/signup.html`](public/signup.html) - Has all form fields
- [ ] [`public/dashboard.html`](public/dashboard.html) - Has logout button

### SQL Files
- [ ] [`supabase/schema.sql`](supabase/schema.sql) - Has triggers

### Documentation
- [ ] [`AUTH_SYSTEM.md`](AUTH_SYSTEM.md) - Complete documentation
- [ ] [`AUTH_QUICK_REFERENCE.md`](AUTH_QUICK_REFERENCE.md) - Quick reference
- [ ] [`AUTH_IMPLEMENTATION_SUMMARY.md`](AUTH_IMPLEMENTATION_SUMMARY.md) - Summary

---

## ✅ 7. Production Checklist

Before deploying to production:

### Security
- [ ] Enable email confirmation
- [ ] Configure custom SMTP provider
- [ ] Review and test all RLS policies
- [ ] Test with multiple users
- [ ] Add rate limiting (Supabase does this automatically)
- [ ] Enable CAPTCHA for signup/login (optional)

### Performance
- [ ] Test with 100+ users
- [ ] Monitor Supabase dashboard for query performance
- [ ] Add database indexes if needed
- [ ] Check storage usage

### Monitoring
- [ ] Set up error logging
- [ ] Monitor authentication events
- [ ] Set up alerts for failed logins
- [ ] Track signup conversion

### Legal
- [ ] Add Privacy Policy
- [ ] Add Terms of Service
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy

---

## ✅ 8. Run the Website

### Development Mode
```bash
npm install
npm run dev
```
- [ ] Open http://localhost:3000
- [ ] Test all authentication flows

### Production Build
```bash
npm run build
```
- [ ] Deploy to Vercel/Netlify
- [ ] Test on production URL
- [ ] Verify all features work

---

## 🐛 Troubleshooting

### Issue: "Supabase is not defined"
**Solution:**
- Check if `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` is in HTML
- Load supabase script BEFORE your module scripts

### Issue: "Invalid API key"
**Solution:**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in config.js
- Make sure you're using the **anon public** key, not the service role key

### Issue: "Permission denied for table profiles"
**Solution:**
- Ensure RLS policies are created
- Check that schema.sql was fully executed
- Run: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`

### Issue: Profile not created after signup
**Solution:**
- Check if trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Manually create profile in signup.js (already implemented as fallback)

### Issue: Can't access dashboard after login
**Solution:**
- Check browser console for errors
- Verify session exists: `localStorage` should have Supabase keys
- Check `checkAuth()` is called in dashboard.js

---

## ✅ Final Verification

Run this complete test:

1. [ ] **Signup**: Create new account → Profile created automatically
2. [ ] **Login**: Login with credentials → Access dashboard
3. [ ] **Session**: Refresh page → Still logged in
4. [ ] **Protected**: Try dashboard without login → Redirected to login
5. [ ] **Logout**: Click logout → Redirected to home
6. [ ] **Database**: Check Supabase → User exists in auth.users and profiles table

---

## 🎉 Setup Complete!

If all items are checked, your authentication system is fully functional!

**Next Steps:**
- Read [`AUTH_SYSTEM.md`](AUTH_SYSTEM.md) for detailed documentation
- Check [`AUTH_QUICK_REFERENCE.md`](AUTH_QUICK_REFERENCE.md) for code snippets
- Review [`auth-examples.js`](public/js/auth-examples.js) for implementation patterns
- Start building your features!

---

**Need Help?**
- Check console for errors
- Review Supabase logs in Dashboard
- Refer to troubleshooting section above
- Check Supabase documentation: https://supabase.com/docs
