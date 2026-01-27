# Fix Email Verification Redirect

## The Issue
When you click the email confirmation link, you get "Page not found" because the redirect URL isn't configured in Supabase.

## Solution - Add Redirect URL to Supabase

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com
2. Select your PlacementIQ project

### Step 2: Add Redirect URLs
1. Click on **Authentication** in the left sidebar
2. Click on **URL Configuration**
3. Scroll to **Redirect URLs** section
4. Add these URLs (one per line):

```
http://localhost:3000/auth-callback.html
http://localhost:3000/public/auth-callback.html
https://your-domain.com/auth-callback.html
```

**For Development (Local):**
```
http://localhost:3000/auth-callback.html
http://localhost:3000/public/auth-callback.html
```

**For Production (When you deploy):**
```
https://your-actual-domain.com/auth-callback.html
```

5. Click **Save**

### Step 3: Test Again
1. Go to signup page
2. Register with a new email
3. Check your email inbox
4. Click the "Confirm your email" link
5. You should now see a success page and be redirected to dashboard

## What I Created

I've created a new page: **auth-callback.html**
- This page handles email verification
- Shows a loading spinner while verifying
- Shows success message when verified
- Auto-redirects to dashboard after 3 seconds
- Shows error message if verification fails

## How It Works Now

1. **User signs up** → Account created, email sent
2. **User clicks link in email** → Redirects to `auth-callback.html`
3. **Page verifies the token** → Creates user profile
4. **Shows success message** → Auto-redirects to dashboard
5. **User is logged in** → Can access all features

## Quick Fix (If Still Having Issues)

If you still get "page not found", try accessing:
- `http://localhost:3000/public/auth-callback.html`

If that works, add that URL to Supabase redirect URLs instead.

## Important Note

Make sure the Site URL in Supabase is set correctly:
1. Go to **Authentication** → **URL Configuration**
2. Check **Site URL** is set to: `http://localhost:3000`
3. For production, change it to your actual domain

The redirect URL must match exactly what's in your Supabase settings!
