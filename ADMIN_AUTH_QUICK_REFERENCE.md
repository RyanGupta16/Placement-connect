# Admin Authentication - Quick Reference

## 🚀 Quick Setup (5 Minutes)

### 1. Run SQL Schema
```bash
Supabase Dashboard > SQL Editor > Paste: supabase/admin-auth-schema.sql
```

### 2. Create First Admin
```sql
-- In Supabase Dashboard:
-- 1. Authentication > Users > Add User
--    Email: admin@placementiq.com
--    Password: [strong password]
--    Copy the UUID!

-- 2. Table Editor > admin_users > Insert Row
--    id: [paste UUID]
--    email: admin@placementiq.com
--    full_name: Super Admin
--    role: super_admin
--    is_active: true
```

### 3. Test Login
```
1. Go to http://localhost:3001/login
2. Click "🔐 Admin Login"
3. Enter admin credentials
4. Should redirect to /admin
```

---

## 🔑 Key Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/login` | Public | Student login |
| `/admin/login` | Public | Admin login (separate) |
| `/admin` | Admin Only | Admin dashboard |
| `/admin/companies` | Admin Only | Manage companies |
| `/admin/applicants` | Admin Only | View applicants |

---

## 🛡️ Security Features

✅ **Separate Login Pages**: Students → `/login`, Admins → `/admin/login`  
✅ **Database-Level Protection**: RLS policies enforce admin access  
✅ **Route Guards**: `AdminRoute` verifies admin status on every page  
✅ **Session Validation**: Checks `admin_users` table on each request  
✅ **Auto-Logout**: Non-admins are signed out if they try admin login  

---

## 📝 Admin API Usage

```javascript
import { adminAuthAPI } from './services/api';

// Login
const result = await adminAuthAPI.login(email, password);
// Returns: { token, user, admin }

// Check if admin
const isAdmin = await adminAuthAPI.isAdmin();
// Returns: true/false

// Get admin info
const admin = await adminAuthAPI.getAdminUser();
// Returns: { id, email, full_name, role, last_login }

// Logout
await adminAuthAPI.logout();
```

---

## 🔍 Verify Setup

### Test 1: Admin Can Login
```
✓ Navigate to /admin/login
✓ Enter admin credentials
✓ Should see admin dashboard
```

### Test 2: Student Cannot Access Admin
```
✓ Login as student
✓ Try to access /admin
✓ Should redirect to /admin/login
✓ Dashboard should NOT load
```

### Test 3: Check Database
```sql
-- Should return your admin
SELECT * FROM admin_users;

-- Should return true
SELECT is_admin('[your_admin_uuid]');
```

---

## 🚨 Common Issues

### Error: "Access denied. Admin credentials required."
→ User authenticated but not in `admin_users` table  
→ Add user to admin_users table

### Admin route stuck on "Loading..."
→ Check browser console for errors  
→ Verify RLS policies applied  
→ Ensure `admin_users` table exists

### Student can see admin pages
→ Remove student from `admin_users` table  
→ Verify `AdminRoute` is imported correctly

---

## 📊 Admin Roles

| Role | Can Create Admins | Can Manage Data |
|------|-------------------|-----------------|
| `super_admin` | ✅ Yes | ✅ Yes |
| `admin` | ❌ No | ✅ Yes |

---

## 📁 Modified Files

✅ [src/services/api.js](src/services/api.js) - Added `adminAuthAPI`  
✅ [src/components/AdminLogin.jsx](src/components/AdminLogin.jsx) - New admin login page  
✅ [src/components/AdminRoute.jsx](src/components/AdminRoute.jsx) - Enhanced route protection  
✅ [src/components/Login.jsx](src/components/Login.jsx) - Added admin button  
✅ [src/App.jsx](src/App.jsx) - Added `/admin/login` route  
✅ [supabase/admin-auth-schema.sql](supabase/admin-auth-schema.sql) - Already existed  

---

## ✅ Checklist

- [ ] Run `admin-auth-schema.sql` in Supabase
- [ ] Create first admin user in Auth
- [ ] Add admin to `admin_users` table
- [ ] Test admin login works
- [ ] Verify students cannot access `/admin`
- [ ] Document admin credentials securely

---

**Full Documentation**: See [ADMIN_AUTH_SETUP.md](ADMIN_AUTH_SETUP.md)
