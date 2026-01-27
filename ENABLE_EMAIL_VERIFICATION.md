# Enable Email Verification in Supabase

## Quick Setup Guide

To enable OTP email verification for signup, follow these steps in your Supabase Dashboard:

### Step 1: Enable Email Confirmations

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Toggle **ON**: "Confirm email"
5. Click **Save**

### Step 2: Configure Email Settings (Important!)

Supabase uses different email providers:

#### Option A: Use Supabase's Built-in Email (Development)
- By default, Supabase uses their SMTP for development
- Emails might go to spam
- Limited to 4 emails per hour per user on free tier

#### Option B: Use Custom SMTP (Recommended for Production)
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable "Enable Custom SMTP"
3. Configure your SMTP settings:
   - **Host**: Your SMTP server (e.g., smtp.gmail.com)
   - **Port**: Usually 587 or 465
   - **Username**: Your email
   - **Password**: Your email password or app password
   - **Sender email**: The "from" email address
   - **Sender name**: PlacementIQ

**Gmail Example:**
- Host: smtp.gmail.com
- Port: 587
- Username: your-email@gmail.com
- Password: Your Gmail App Password (not regular password)
- [How to create Gmail App Password](https://support.google.com/accounts/answer/185833)

### Step 3: Customize Email Template

1. Go to **Authentication** → **Email Templates**
2. Select "Confirm signup" template
3. Customize the message (optional)
4. Available variables:
   - `{{ .Token }}` - The 6-digit OTP code
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .TokenHash }}` - Token hash for confirmation links

### Step 4: Test the Flow

1. Clear your browser cache/cookies
2. Go to signup page
3. Fill in the registration form
4. Click "Create Account"
5. Check your email for the 6-digit code
6. Enter the code in the modal
7. Account should be created and verified

## Current Implementation

The signup flow now works as follows:

1. User fills signup form → Clicks "Create Account"
2. System creates user account in Supabase
3. **IF email confirmation is enabled:**
   - Supabase sends 6-digit OTP to user's email
   - Modal appears asking for verification code
   - User enters code from email
   - System verifies code and creates profile
   - User is logged in and redirected to dashboard
4. **IF email confirmation is disabled:**
   - Account is created immediately
   - Profile is created
   - User is logged in and redirected to dashboard

## Troubleshooting

### No email received?
1. Check spam/junk folder
2. Verify SMTP settings are correct
3. Check Supabase logs: **Authentication** → **Logs**
4. Try using Supabase's built-in email first
5. Make sure "Confirm email" is toggled ON

### Email going to spam?
1. Use custom SMTP with proper domain configuration
2. Set up SPF and DKIM records for your domain
3. Use a professional email service (SendGrid, AWS SES, etc.)

### Code not working?
1. Codes expire after 1 hour
2. Click "Resend Code" to get a new one
3. Check browser console for errors
4. Verify Supabase URL and keys are correct in config.js

## Production Recommendations

For production deployment:

1. ✅ Use custom SMTP (not Supabase default)
2. ✅ Set up proper email domain with SPF/DKIM
3. ✅ Use a reliable email service (SendGrid, AWS SES, Mailgun)
4. ✅ Monitor email delivery rates
5. ✅ Implement rate limiting (already handled by Supabase)
6. ✅ Add email to trusted senders list
7. ✅ Test on multiple email providers (Gmail, Outlook, Yahoo)

## Alternative: Disable Email Confirmation

If you want to skip email verification (NOT RECOMMENDED for production):

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **OFF**: "Confirm email"
3. Users will be able to register without email verification

**Note:** Without email verification, users can register with any email, including fake ones.
