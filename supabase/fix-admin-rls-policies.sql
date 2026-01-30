-- ============================================
-- FIX ADMIN RLS POLICIES FOR COMPANIES TABLE
-- Run this script in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure is_admin() function exists
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

-- Step 2: Drop and recreate admin policies for companies table
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

-- Step 3: Update the SELECT policy to allow admins to see ALL companies (not just active)
DROP POLICY IF EXISTS "Admins can view all companies" ON companies;
CREATE POLICY "Admins can view all companies"
    ON companies FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Step 4: Ensure students can still view active companies
DROP POLICY IF EXISTS "Students can view active companies" ON companies;
CREATE POLICY "Students can view active companies"
    ON companies FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Step 5: Repeat for job_roles table
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

DROP POLICY IF EXISTS "Admins can view all job roles" ON job_roles;
CREATE POLICY "Admins can view all job roles"
    ON job_roles FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Step 6: Allow students to view active job roles
DROP POLICY IF EXISTS "Students can view active job roles" ON job_roles;
CREATE POLICY "Students can view active job roles"
    ON job_roles FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Step 7: Admin access to applications (view all)
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

-- Step 8: Admin access to user_profiles (view all students)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the policies are working
-- ============================================

-- Check if current user is an admin
-- SELECT is_admin(auth.uid());

-- View all policies on companies table
-- SELECT * FROM pg_policies WHERE tablename = 'companies';

-- View all policies on job_roles table
-- SELECT * FROM pg_policies WHERE tablename = 'job_roles';
