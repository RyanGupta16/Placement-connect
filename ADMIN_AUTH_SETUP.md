# Admin Authentication Setup Guide

## Overview
PlacementIQ implements a secure, role-based admin authentication system using Supabase Auth and Row Level Security (RLS) policies.

## Architecture

### Key Components
1. **admin_users table**: Stores admin user records and links to Supabase auth.users
2. **Helper functions**: `is_admin()` and `is_super_admin()` for RLS policies
3. **RLS Policies**: Enforce admin-only access at database level
4. **Frontend Routes**: Separate admin login and protected admin routes

### Security Features
- ✅ Admins are NOT students - completely separate user type
- ✅ Database-level access control via RLS policies
- ✅ Separate login entry point (/admin/login)
- ✅ Students cannot access admin routes (enforced client + server side)
- ✅ Admin verification on every protected route
- ✅ Session tracking with last_login timestamps

---

## Database Setup

### Step 1: Run Admin Auth Schema

Execute the SQL file to create the admin system:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste: supabase/admin-auth-schema.sql
```

This creates:
- `admin_users` table with RLS policies
- Helper functions for admin checks
- Updated RLS policies for existing tables (companies, job_roles, applications, user_profiles)

### Step 2: Create Your First Admin User

#### Option A: Via Supabase Dashboard (Recommended)

1. **Create Auth User**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User"
   - Enter admin email (e.g., `admin@placementiq.com`)
   - Enter a strong password
   - Click "Create User"
   - **Copy the UUID** that's generated

2. **Add to admin_users Table**
   - Go to Supabase Dashboard → Table Editor → admin_users
   - Click "Insert Row"
   - Fill in:
     - `id`: Paste the UUID from step 1
     - `email`: Same email as auth user
     - `full_name`: "Super Admin" (or your name)
     - `role`: Select "super_admin"
     - `is_active`: true
     - Leave other fields as default
   - Click "Save"

#### Option B: Via SQL Query

```sql
-- First create the auth user in Dashboard, then run this:
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
    'YOUR_USER_UUID_HERE',  -- Replace with actual UUID from auth.users
    'admin@placementiq.com',
    'Super Admin',
    'super_admin',
    TRUE
);
```

### Step 3: Verify Admin Setup

```sql
-- Check if admin exists
SELECT * FROM admin_users;

-- Test admin function
SELECT is_admin('YOUR_USER_UUID_HERE');
-- Should return: true

-- Test super admin function
SELECT is_super_admin('YOUR_USER_UUID_HERE');
-- Should return: true
```

---

## Frontend Implementation

### Admin Routes Structure

```
/admin/login        → Admin login page (public)
/admin              → Admin dashboard (protected)
/admin/companies    → Manage companies (protected)
/admin/applicants   → View applicants (protected)
```

### How Admin Login Works

1. User navigates to student login page
2. Clicks "🔐 Admin Login" button
3. Redirected to `/admin/login`
4. Enters admin credentials
5. **Backend validates**:
   - Authenticates against Supabase Auth
   - Checks if user exists in `admin_users` table
   - Verifies `is_active = true`
6. If valid → Redirect to `/admin` dashboard
7. If invalid → Show error and sign out

### Admin Route Protection

The `AdminRoute` component protects all admin pages:

```jsx
// Checks on every admin route access
1. Get current session from Supabase Auth
2. Query admin_users table for current user
3. If not admin → Redirect to /admin/login
4. If admin → Allow access
```

### Student Protection

Students **CANNOT** access admin routes because:
- Student accounts don't exist in `admin_users` table
- RLS policies block database queries from non-admin users
- Frontend route guards redirect to `/admin/login`
- No API endpoints return admin data to non-admins

---

## Testing Admin Authentication

### Test 1: Admin Login Flow
```bash
1. Navigate to http://localhost:3001/login
2. Click "🔐 Admin Login"
3. Should redirect to /admin/login
4. Enter admin credentials
5. Should redirect to /admin dashboard
```

### Test 2: Student Cannot Access Admin Routes
```bash
1. Login as student
2. Manually navigate to http://localhost:3001/admin
3. Should be redirected to /admin/login
4. Admin dashboard should NOT load
```

### Test 3: Verify Database Policies
```sql
-- As student user, try to query admin_users
SELECT * FROM admin_users;
-- Should return: permission denied or empty result

-- As admin user, try to query admin_users
SELECT * FROM admin_users;
-- Should return: all admin records
```

---

## Creating Additional Admins

### Only Super Admins Can Create New Admins

1. **Create Auth User** (via Dashboard or signup)
2. **Super Admin Adds to admin_users**:

```sql
-- Run this as a super_admin user
INSERT INTO admin_users (id, email, full_name, role, created_by)
VALUES (
    'NEW_USER_UUID',
    'newadmin@placementiq.com',
    'John Doe',
    'admin',  -- or 'super_admin'
    auth.uid()  -- Current super_admin's ID
);
```

Or create an admin management UI (recommended for production).

---

## Admin Roles

### Role Types

| Role | Permissions |
|------|-------------|
| **super_admin** | Full access: create/update/delete admins, manage all data |
| **admin** | Manage companies, job roles, view/update applications, view students |

### Role Hierarchy
- Super admins can create other admins
- Regular admins cannot create new admins
- Both can manage student-facing data

---

## RLS Policy Summary

### Admin Access Granted To:
- ✅ View all student profiles
- ✅ Create/update/delete companies
- ✅ Create/update/delete job roles
- ✅ View/update all applications
- ✅ View admin_users table (admin check)

### Student Access Limited To:
- ✅ View their own profile
- ✅ View active companies/job roles
- ✅ Create/view/update their own applications
- ❌ Cannot access admin_users table
- ❌ Cannot access admin routes

---

## Security Best Practices

1. **Strong Passwords**: Require minimum 12 characters for admin accounts
2. **Limited Admin Accounts**: Only create necessary admin users
3. **Audit Logging**: Monitor `last_login` in admin_users table
4. **Regular Review**: Periodically check and remove inactive admins
5. **Environment Variables**: Store admin emails in .env for initial setup
6. **MFA (Future)**: Consider adding multi-factor authentication

---

## Troubleshooting

### Issue: "Access denied. Admin credentials required."

**Cause**: User authenticated but not in `admin_users` table

**Solution**:
```sql
-- Check if user exists in admin_users
SELECT * FROM admin_users WHERE email = 'your@email.com';

-- If missing, add them
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES ('USER_UUID', 'your@email.com', 'Your Name', 'admin', TRUE);
```

### Issue: Admin route shows "Loading..." indefinitely

**Cause**: Network error or RLS policy blocking query

**Solution**:
1. Check browser console for errors
2. Verify Supabase connection
3. Test RLS policies in SQL Editor
4. Ensure admin_users table exists

### Issue: Student can access admin dashboard

**Cause**: AdminRoute not checking properly OR student in admin_users

**Solution**:
```sql
-- Remove student from admin_users if accidentally added
DELETE FROM admin_users WHERE id = 'STUDENT_UUID';
```

---

## API Reference

### adminAuthAPI

```javascript
// Login as admin
await adminAuthAPI.login(email, password);
// Returns: { token, user, admin }

// Check if current user is admin
const isAdmin = await adminAuthAPI.isAdmin();
// Returns: boolean

// Get admin user info
const adminUser = await adminAuthAPI.getAdminUser();
// Returns: { id, email, full_name, role, ... }

// Logout
await adminAuthAPI.logout();
```

---

## Next Steps

1. ✅ Run `supabase/admin-auth-schema.sql` in Supabase Dashboard
2. ✅ Create your first super admin user
3. ✅ Test admin login flow
4. ✅ Verify students cannot access admin routes
5. 📝 Document your admin credentials securely
6. 🔐 Set up password recovery for admin accounts

---

## File References

- **Schema**: [supabase/admin-auth-schema.sql](../supabase/admin-auth-schema.sql)
- **API Service**: [src/services/api.js](../src/services/api.js) - `adminAuthAPI`
- **Admin Login**: [src/components/AdminLogin.jsx](../src/components/AdminLogin.jsx)
- **Route Protection**: [src/components/AdminRoute.jsx](../src/components/AdminRoute.jsx)
- **Student Login**: [src/components/Login.jsx](../src/components/Login.jsx)
- **App Routes**: [src/App.jsx](../src/App.jsx)

---

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Review browser console for JavaScript errors
3. Test SQL queries directly in Supabase SQL Editor
4. Verify RLS policies are enabled on all tables
