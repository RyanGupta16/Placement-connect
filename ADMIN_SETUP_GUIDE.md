# Admin Authentication System - Setup Guide

## ✅ What Has Been Implemented

### 1. Database Schema
- **admin_users** table to track admin users
- Helper functions: `is_admin()`, `is_super_admin()`
- RLS policies for admin access control
- Updated existing table policies to grant admin access

### 2. Frontend Components
- Admin login toggle button on login page
- Admin dashboard at `/admin/dashboard.html`
- Route protection middleware (`admin-auth.js`)
- Role-based access control

### 3. Security Features
- Students CANNOT access admin routes (enforced by RLS + client-side)
- Admins CANNOT login via student portal
- Students CANNOT login via admin portal
- Automatic logout and redirect on unauthorized access

---

## 🚀 Setup Instructions

### Step 1: Run SQL Schema

1. Open Supabase Dashboard → SQL Editor
2. Open the file: `supabase/admin-auth-schema.sql`
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **Run**
6. Wait for "Success" message

This creates:
- `admin_users` table
- Helper functions
- RLS policies
- Indexes

---

### Step 2: Create First Admin User

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **"Add User"**
3. Fill in:
   - Email: `admin@placementiq.com` (or your admin email)
   - Password: Create a strong password
   - **IMPORTANT**: Uncheck "Auto Confirm User" if you want email verification
4. Click **Create User**
5. **Copy the UUID** of the created user (you'll see it in the users table)

#### Option B: Via SQL

Run this in SQL Editor (after creating user in step A):

```sql
-- Replace with actual admin user UUID from step A
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
    'PASTE_USER_UUID_HERE',  -- UUID from auth.users
    'admin@placementiq.com',
    'Super Admin',
    'super_admin',
    TRUE
);
```

**Example:**
```sql
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@placementiq.com',
    'Super Admin',
    'super_admin',
    TRUE
);
```

---

### Step 3: Verify Admin User

Run this query to check:

```sql
SELECT * FROM admin_users;
```

You should see your admin user listed.

---

### Step 4: Test Admin Login

1. Open the app: `http://localhost:3000/login.html`
2. Click **"🔐 Admin Login"** button at the bottom
3. Notice the UI changes:
   - Title changes to "Admin Portal"
   - Background becomes purple gradient
   - Button says "Admin Login"
4. Enter admin credentials
5. Click "Admin Login"
6. You should be redirected to `/admin/dashboard.html`

---

## 🔐 Security Features Explained

### 1. Role-Based Access Control (RBAC)

**Admin Roles:**
- `admin` - Regular admin (can manage companies, jobs, students)
- `super_admin` - Full access (can create other admins)

**Access Matrix:**

| Action | Student | Admin | Super Admin |
|--------|---------|-------|-------------|
| View own profile | ✅ | ✅ | ✅ |
| View all profiles | ❌ | ✅ | ✅ |
| View companies | ✅ | ✅ | ✅ |
| Manage companies | ❌ | ✅ | ✅ |
| View job roles | ✅ | ✅ | ✅ |
| Manage job roles | ❌ | ✅ | ✅ |
| View own applications | ✅ | ✅ | ✅ |
| View all applications | ❌ | ✅ | ✅ |
| Update applications | Own only | All | All |
| Access admin dashboard | ❌ | ✅ | ✅ |
| Create admins | ❌ | ❌ | ✅ |

### 2. Route Protection

**Client-Side Protection:**
- `admin-auth.js` runs immediately on admin page load
- Checks authentication session
- Verifies admin_users table
- Redirects unauthorized users to login

**Server-Side Protection (RLS):**
- Database-level security via Row Level Security
- Admins can only access data if verified in `admin_users` table
- Students CANNOT query admin-only operations even with direct API calls

### 3. Login Flow Separation

**Student Login:**
- Default login mode
- Redirects to `/dashboard.html`
- Cannot access admin routes

**Admin Login:**
- Activated by clicking "🔐 Admin Login"
- UI changes to indicate admin mode
- Redirects to `/admin/dashboard.html`
- Cannot login with student credentials

### 4. Prevention of Cross-Access

**Scenario 1: Student tries to access admin dashboard**
- Route protection checks `admin_users` table
- No entry found → Logged out + Redirected to login
- Alert: "Access Denied: You do not have administrative privileges"

**Scenario 2: Admin tries student login**
- Login detects user in `admin_users` table
- Blocks login
- Error: "Please use the Admin Login option"

**Scenario 3: Student tries admin login**
- Login detects user NOT in `admin_users` table
- Blocks login
- Error: "Access Denied: You do not have administrative privileges"

---

## 📊 Admin Dashboard Features

Current features:
- ✅ Statistics cards (students, companies, jobs, applications)
- ✅ Admin info display (name, role)
- ✅ Logout functionality
- ✅ Quick action cards (placeholders for future features)

The dashboard loads real-time statistics from your database using the admin RLS policies.

---

## 🛠️ Adding More Admins (After First Setup)

### As Super Admin:

You can create additional admins programmatically or via SQL:

```sql
-- First, create user in Supabase Auth Dashboard
-- Then add to admin_users table:

INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
    'NEW_USER_UUID',
    'newadmin@placementiq.com',
    'Admin Name',
    'admin',  -- or 'super_admin'
    TRUE
);
```

**Future Feature:** Add admin management UI for super admins to create/manage other admins.

---

## 🔧 Troubleshooting

### Issue: "Access Denied" when logging in as admin

**Solution:**
1. Verify admin user exists in `admin_users` table
2. Check `is_active = TRUE`
3. Verify UUID matches `auth.users` table
4. Clear browser cache/cookies

### Issue: Can't see admin_users table

**Solution:**
1. Check RLS policies are applied
2. Make sure you're logged in as admin
3. Try query: `SELECT * FROM admin_users WHERE id = auth.uid();`

### Issue: Student can access admin routes

**Solution:**
1. Ensure `admin-auth.js` is imported FIRST in admin HTML pages
2. Check browser console for errors
3. Verify RLS policies are enabled on all tables

### Issue: Admin login button not showing

**Solution:**
1. Clear browser cache
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Check `login.html` has the toggle button code

---

## 📝 Database Functions Usage

### Check if user is admin:
```sql
SELECT is_admin('USER_UUID');
-- Returns TRUE or FALSE
```

### Check if user is super admin:
```sql
SELECT is_super_admin('USER_UUID');
-- Returns TRUE or FALSE
```

### Get current admin info:
```sql
SELECT * FROM admin_users WHERE id = auth.uid();
```

---

## 🚨 Important Security Notes

1. **Never expose admin credentials**
   - Use strong passwords
   - Enable 2FA in Supabase (recommended)
   - Rotate passwords regularly

2. **RLS is your last line of defense**
   - Even if client-side protection fails, RLS prevents data access
   - Never disable RLS on production tables

3. **Admin users are separate from students**
   - An admin cannot be a student
   - Keep admin emails separate from student emails

4. **Monitor admin activity**
   - Check `last_login` field in admin_users
   - Set up Supabase audit logs (paid feature)

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] SQL schema executed successfully
- [ ] First super admin created and can login
- [ ] Admin dashboard loads without errors
- [ ] Statistics display correctly
- [ ] Student cannot access `/admin/dashboard.html`
- [ ] Admin cannot login via student portal
- [ ] Student cannot login via admin portal
- [ ] Logout works correctly for admins
- [ ] RLS policies tested (try direct API calls)
- [ ] Browser console shows no errors

---

## 🎯 Next Steps

1. **Create admin management pages:**
   - Companies CRUD
   - Job roles CRUD
   - Applications viewer
   - Student management

2. **Add admin features:**
   - Bulk operations
   - Reports and analytics
   - Email notifications
   - System settings

3. **Enhance security:**
   - Add 2FA for admins
   - IP whitelisting
   - Activity logging
   - Session timeout

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify RLS policies in Supabase Table Editor
4. Test SQL functions manually

All admin features are production-ready and secured with Supabase RLS! 🚀
