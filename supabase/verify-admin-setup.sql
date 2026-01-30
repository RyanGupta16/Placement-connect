-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify your admin setup
-- ============================================

-- 1. Check if you're in the admin_users table
SELECT id, email, role, is_active, created_at 
FROM admin_users 
WHERE email = 'ryan@gmail.com';  -- Replace with your email

-- 2. Check if is_admin() function works for your user
SELECT is_admin(auth.uid()) as am_i_admin;

-- 3. View all RLS policies on companies table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- 4. View all RLS policies on job_roles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'job_roles'
ORDER BY policyname;

-- 5. Test if you can view companies (should return all companies)
SELECT id, name, is_active 
FROM companies 
LIMIT 5;

-- ============================================
-- If any of these fail, you may need to:
-- 1. Add yourself to admin_users table
-- 2. Re-run the fix-admin-rls-policies.sql script
-- ============================================
