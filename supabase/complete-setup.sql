-- ============================================
-- COMPLETE SETUP FOR PLACEMENT CONNECT
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. Ensure is_admin() function exists
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = user_id 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix all RLS policies for COMPANIES table
DROP POLICY IF EXISTS "Students can view active companies" ON companies;
CREATE POLICY "Students can view active companies"
    ON companies FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can view all companies" ON companies;
CREATE POLICY "Admins can view all companies"
    ON companies FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
CREATE POLICY "Admins can insert companies"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update companies" ON companies;
CREATE POLICY "Admins can update companies"
    ON companies FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete companies" ON companies;
CREATE POLICY "Admins can delete companies"
    ON companies FOR DELETE
    TO authenticated
    USING (is_admin(auth.uid()));

-- 3. Fix all RLS policies for JOB_ROLES table
DROP POLICY IF EXISTS "Students can view active job roles" ON job_roles;
CREATE POLICY "Students can view active job roles"
    ON job_roles FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can view all job roles" ON job_roles;
CREATE POLICY "Admins can view all job roles"
    ON job_roles FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert job roles" ON job_roles;
CREATE POLICY "Admins can insert job roles"
    ON job_roles FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update job roles" ON job_roles;
CREATE POLICY "Admins can update job roles"
    ON job_roles FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete job roles" ON job_roles;
CREATE POLICY "Admins can delete job roles"
    ON job_roles FOR DELETE
    TO authenticated
    USING (is_admin(auth.uid()));

-- 4. Fix APPLICATIONS table policies
DROP POLICY IF EXISTS "Students can view their own applications" ON applications;
CREATE POLICY "Students can view their own applications"
    ON applications FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create applications" ON applications;
CREATE POLICY "Students can create applications"
    ON applications FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
CREATE POLICY "Admins can view all applications"
    ON applications FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update applications" ON applications;
CREATE POLICY "Admins can update applications"
    ON applications FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()));

-- 5. Fix USER_PROFILES policies  
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- ============================================
-- VERIFICATION: Check if your user is an admin
-- ============================================
-- Run this to see if you're in the admin_users table:
-- SELECT * FROM admin_users WHERE email = 'ryan@gmail.com';

-- If NOT in admin_users, add yourself:
-- INSERT INTO admin_users (id, email, role, is_active)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'ryan@gmail.com'),
--   'ryan@gmail.com',
--   'super_admin',
--   true
-- );

-- Test if admin check works:
-- SELECT is_admin(auth.uid()) as am_i_admin;
