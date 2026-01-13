# Authentication System Documentation

## Overview

This document describes the complete authentication system implemented for PlacementIQ using Supabase Auth. The system provides secure email/password authentication with session management, profile creation, and comprehensive security features.

---

## 🔑 Core Features

✅ **Email + Password Authentication**
- Secure signup with profile creation
- Login with session persistence
- Optional email confirmation

✅ **Session Management**
- Automatic session refresh
- Session expiry detection
- Persistent login (remember me)

✅ **Security**
- Row Level Security (RLS) on all tables
- Secure password handling by Supabase
- Protected routes with auth checks

✅ **User Profile**
- Automatic profile creation on signup
- Minimal data storage (name, email, college, branch, year, CGPA, skills)
- Profile update functionality

✅ **Additional Features**
- Password reset via email
- Auth state change listener
- Logout functionality
- Redirect unauthenticated users

---

## 📁 File Structure

```
public/js/
├── config.js           # Supabase client configuration
├── signup.js           # User registration logic
├── login.js            # User login logic
├── utils.js            # Auth utility functions
└── auth-examples.js    # Session check examples

supabase/
└── schema.sql          # Database schema with triggers
```

---

## 🗄️ Database Schema

### profiles Table

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    college TEXT NOT NULL,
    branch TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
    cgpa DECIMAL(3,2) CHECK (cgpa BETWEEN 0 AND 10),
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Row Level Security Policies

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
```

### Automatic Profile Creation

A database trigger automatically creates a profile when a user signs up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, college, branch, year, cgpa)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'college', ''),
        COALESCE(NEW.raw_user_meta_data->>'branch', ''),
        COALESCE((NEW.raw_user_meta_data->>'year')::INTEGER, 1),
        COALESCE((NEW.raw_user_meta_data->>'cgpa')::DECIMAL, 0.0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔧 Setup Instructions

### 1. Configure Supabase

Update [`config.js`](public/js/config.js) with your Supabase credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key';
```

Get these from: Supabase Dashboard → Project Settings → API

### 2. Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy entire contents of [`schema.sql`](supabase/schema.sql)
3. Execute the script
4. Verify tables and triggers are created

### 3. Configure Email Settings (Optional)

For email confirmation:
1. Go to Authentication → Settings → Email
2. Enable "Confirm email" option
3. Customize email templates if needed

For production, configure SMTP settings for custom email domain.

---

## 📝 Core Functions Reference

### Authentication Functions (`utils.js`)

#### `checkAuth(supabase)`
Checks if user is authenticated. Redirects to login if not.

```javascript
const session = await checkAuth(supabase);
if (!session) return; // User redirected
```

#### `getAuthSession(supabase)`
Gets current session without redirect.

```javascript
const session = await getAuthSession(supabase);
if (session) {
    console.log('User is logged in');
}
```

#### `getUserProfile(supabase)`
Fetches current user's profile from database.

```javascript
const profile = await getUserProfile(supabase);
console.log('User:', profile.name, profile.email);
```

#### `onAuthStateChange(supabase, callback)`
Listens for authentication state changes.

```javascript
onAuthStateChange(supabase, (event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User logged in');
    }
});
```

#### `sendPasswordReset(supabase, email)`
Sends password reset email.

```javascript
await sendPasswordReset(supabase, 'user@example.com');
```

#### `logout(supabase)`
Logs out user and redirects to home page.

```javascript
await logout(supabase);
```

---

## 🛡️ Implementation Examples

### Protected Page (Dashboard, Resume, etc.)

```javascript
import supabase from './config.js';
import { checkAuth, getUserProfile } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check authentication
    const session = await checkAuth(supabase);
    if (!session) return; // Redirected to login
    
    // 2. Get user profile
    const profile = await getUserProfile(supabase);
    if (!profile) {
        alert('Profile not found');
        window.location.href = '/signup.html';
        return;
    }
    
    // 3. Your page logic
    console.log('Welcome,', profile.name);
    displayDashboard(profile);
});
```

### Public Page with Optional Auth (Landing Page)

```javascript
import supabase from './config.js';
import { getAuthSession } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const session = await getAuthSession(supabase);
    
    if (session) {
        // Show "Go to Dashboard" instead of "Login"
        document.getElementById('loginBtn').textContent = 'Dashboard';
        document.getElementById('loginBtn').href = '/dashboard.html';
    } else {
        // Show normal login/signup buttons
        document.getElementById('loginBtn').textContent = 'Login';
    }
});
```

### Signup Flow

```javascript
// In signup.js
const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
        data: {
            name: name,
            college: college,
            branch: branch,
            year: year,
            cgpa: cgpa,
        }
    }
});

// Profile is automatically created by database trigger
```

### Login Flow

```javascript
// In login.js
const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
});

if (!error) {
    window.location.href = '/dashboard.html';
}
```

---

## 🔒 Security Best Practices

### 1. Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:

```sql
-- Example: Users can only view their own resume feedback
CREATE POLICY "Users can view their own resume feedback"
    ON resume_feedback FOR SELECT
    USING (auth.uid() = user_id);
```

### 2. Password Requirements

Minimum 6 characters (Supabase default). Consider enforcing:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Special characters

Update validation in [`signup.js`](public/js/signup.js):

```javascript
if (password.length < 8) {
    showError('errorMessage', 'Password must be at least 8 characters');
    return;
}
```

### 3. Session Management

Sessions are stored securely in browser localStorage by Supabase. They include:
- Access token (JWT)
- Refresh token
- Expiry time

Supabase automatically refreshes tokens before expiry.

### 4. Email Confirmation

Enable email confirmation in production:
1. Supabase Dashboard → Authentication → Settings
2. Enable "Confirm email"
3. Users must verify email before login

---

## 📋 Common Use Cases

### 1. Check if User is Logged In

```javascript
import { getAuthSession } from './utils.js';

const session = await getAuthSession(supabase);
if (session) {
    console.log('Logged in as:', session.user.email);
}
```

### 2. Protect a Route

```javascript
import { checkAuth } from './utils.js';

// At top of protected page
const session = await checkAuth(supabase);
if (!session) return; // Redirected
```

### 3. Get Current User Profile

```javascript
import { getUserProfile } from './utils.js';

const profile = await getUserProfile(supabase);
console.log(profile.name, profile.cgpa);
```

### 4. Implement Logout

```javascript
import { logout } from './utils.js';

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout(supabase);
});
```

### 5. Password Reset

```javascript
import { sendPasswordReset } from './utils.js';

async function handleForgotPassword() {
    const email = prompt('Enter your email:');
    await sendPasswordReset(supabase, email);
    alert('Password reset email sent!');
}
```

### 6. Listen for Auth Changes

```javascript
import { onAuthStateChange } from './utils.js';

onAuthStateChange(supabase, (event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = '/index.html';
    }
});
```

---

## 🐛 Troubleshooting

### Issue: "User not found" after signup

**Cause**: Profile wasn't created  
**Solution**: Check database trigger is installed:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: "Invalid login credentials"

**Causes**:
1. Wrong email/password
2. Email not confirmed (if enabled)
3. User doesn't exist

**Solution**: Check error message and handle appropriately in [`login.js`](public/js/login.js)

### Issue: Session expires unexpectedly

**Cause**: Token expired  
**Solution**: Supabase auto-refreshes. Check network connectivity.

### Issue: Can't read user data from database

**Cause**: RLS policy blocking access  
**Solution**: Verify user is authenticated:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

---

## 🧪 Testing Checklist

### Authentication Flow
- [ ] Sign up with valid credentials
- [ ] Sign up with duplicate email (should fail)
- [ ] Sign up with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Logout successfully

### Session Management
- [ ] Session persists after page refresh
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access protected pages
- [ ] Session expires after timeout

### Profile Management
- [ ] Profile created automatically on signup
- [ ] Profile data displayed correctly
- [ ] Profile can be updated
- [ ] Cannot view other users' profiles

### Password Reset
- [ ] Reset email sent successfully
- [ ] Reset link works
- [ ] Password changed successfully

---

## 📚 Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript/auth-signup
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

---

## 🤝 Support

For issues:
1. Check console for error messages
2. Verify Supabase configuration
3. Check database RLS policies
4. Review this documentation

---

**Last Updated**: December 23, 2025
