# Authentication Quick Reference

## 🚀 Quick Start

### 1. Protected Page Setup

```javascript
import supabase from './config.js';
import { checkAuth, getUserProfile } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkAuth(supabase);
    if (!session) return;
    
    const profile = await getUserProfile(supabase);
    // Your code here
});
```

### 2. Public Page (Optional Auth)

```javascript
import { getAuthSession } from './utils.js';

const session = await getAuthSession(supabase);
if (session) {
    // Show logged-in UI
} else {
    // Show login/signup UI
}
```

### 3. Logout Button

```javascript
import { logout } from './utils.js';

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout(supabase);
});
```

---

## 📦 Available Functions

### From `utils.js`

| Function | Purpose | Returns |
|----------|---------|---------|
| `checkAuth(supabase)` | Check auth, redirect if not logged in | `session` or `null` |
| `getAuthSession(supabase)` | Check auth without redirect | `session` or `null` |
| `getUserProfile(supabase)` | Get current user profile | `profile` object |
| `onAuthStateChange(supabase, callback)` | Listen for auth changes | subscription |
| `isEmailVerified(supabase)` | Check if email is confirmed | `boolean` |
| `sendPasswordReset(supabase, email)` | Send reset email | `true` or throws |
| `updatePassword(supabase, password)` | Update user password | `true` or throws |
| `logout(supabase)` | Logout and redirect | void |

### From `auth-examples.js`

| Function | Purpose |
|----------|---------|
| `protectedPageInit()` | Complete auth check for protected pages |
| `softAuthCheck()` | Check auth without redirect |
| `setupAuthListener()` | Setup auth state listener with event handling |
| `checkUserPermissions(cgpa, year)` | Check if user meets requirements |
| `checkSessionExpiry()` | Check and refresh session if needed |
| `authenticatedRequest(url, options)` | Make API call with auth token |

---

## 🔑 Common Patterns

### Pattern 1: Basic Protected Page

```javascript
// dashboard.js, resume.js, etc.
import supabase from './config.js';
import { checkAuth, getUserProfile } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkAuth(supabase);
    if (!session) return;
    
    const profile = await getUserProfile(supabase);
    document.getElementById('userName').textContent = profile.name;
});
```

### Pattern 2: Login Page

```javascript
// login.js
import supabase from './config.js';

async function handleLogin(e) {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    if (!error) {
        window.location.href = '/dashboard.html';
    }
}
```

### Pattern 3: Signup Page

```javascript
// signup.js
import supabase from './config.js';

async function handleSignup(e) {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { name, college, branch, year, cgpa }
        }
    });
    
    if (!error) {
        window.location.href = '/dashboard.html';
    }
}
```

### Pattern 4: Conditional UI

```javascript
// Show different content based on auth state
const session = await getAuthSession(supabase);

if (session) {
    document.getElementById('userMenu').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'none';
} else {
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'block';
}
```

### Pattern 5: Auth State Listener

```javascript
// React to auth changes in real-time
import { onAuthStateChange } from './utils.js';

onAuthStateChange(supabase, (event, session) => {
    switch (event) {
        case 'SIGNED_IN':
            updateUIForLoggedIn(session.user);
            break;
        case 'SIGNED_OUT':
            updateUIForLoggedOut();
            break;
    }
});
```

---

## 🛡️ Security Checklist

### For Every Protected Page:
- [ ] Import `checkAuth` from utils.js
- [ ] Call `checkAuth()` at page load
- [ ] Return early if no session
- [ ] Add logout button

### For Every Form:
- [ ] Validate inputs client-side
- [ ] Show loading state during submission
- [ ] Display clear error messages
- [ ] Disable button during submission

### For Database Queries:
- [ ] Ensure RLS policies are enabled
- [ ] Use `auth.uid()` in WHERE clauses
- [ ] Never trust client-side data
- [ ] Log errors for debugging

---

## ⚡ Code Snippets

### Complete Protected Page Template

```javascript
// template-protected-page.js
import supabase from './config.js';
import { checkAuth, getUserProfile, logout } from './utils.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Auth check
    const session = await checkAuth(supabase);
    if (!session) return;
    
    // Get profile
    currentUser = await getUserProfile(supabase);
    if (!currentUser) {
        alert('Profile not found');
        return;
    }
    
    // Setup UI
    initializeUI();
    
    // Setup logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await logout(supabase);
    });
});

function initializeUI() {
    document.getElementById('userName').textContent = currentUser.name;
    // More UI setup...
}
```

### Complete Login Form Handler

```javascript
// Enhanced login with all features
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    
    // Validation
    if (!email || !password) {
        showError('errorMessage', 'Please fill in all fields');
        return;
    }
    
    setButtonLoading('loginBtn', true, 'Logging in...');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) throw error;
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        showError('errorMessage', error.message);
        setButtonLoading('loginBtn', false);
    }
}
```

### Database Query with Auth

```javascript
// Fetch user's own data
async function fetchUserResumes() {
    const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user.id)
        .order('uploaded_at', { ascending: false });
    
    if (error) {
        console.error('Error:', error);
        return [];
    }
    
    return data;
}
```

---

## 📱 HTML Integration

### Login Page HTML

```html
<form id="loginForm">
    <input type="email" id="email" required>
    <input type="password" id="password" required>
    <label>
        <input type="checkbox" id="rememberMe">
        Remember me
    </label>
    <button type="submit" id="loginBtn">Login</button>
    <a href="#" id="forgotPasswordLink">Forgot password?</a>
</form>
<div id="errorMessage" style="display:none"></div>

<script type="module" src="/js/login.js"></script>
```

### Protected Page HTML

```html
<nav>
    <span id="userName">Loading...</span>
    <button id="logoutBtn">Logout</button>
</nav>

<script type="module" src="/js/dashboard.js"></script>
```

---

## 🔍 Debugging

### Check if user is logged in:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user);
```

### Check user's profile:

```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
console.log('Profile:', profile);
```

### Test RLS policies:

```sql
-- In Supabase SQL Editor
SELECT * FROM profiles WHERE id = auth.uid();
```

### Check triggers:

```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test trigger manually
SELECT public.handle_new_user();
```

---

## 📞 Need Help?

1. **Check console** for errors
2. **Verify Supabase config** in config.js
3. **Review AUTH_SYSTEM.md** for detailed docs
4. **Check auth-examples.js** for more examples

---

**Quick Links:**
- [Full Documentation](AUTH_SYSTEM.md)
- [Code Examples](public/js/auth-examples.js)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
