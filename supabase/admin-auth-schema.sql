-- ============================================
-- ADMIN AUTHENTICATION SYSTEM
-- Integrates with existing Supabase Auth
-- ============================================

-- ========================================
-- 1. ADMIN_USERS TABLE
-- Links auth.users to admin role
-- ========================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
-- Only admins can view admin_users table
DROP POLICY IF EXISTS "Only admins can view admin_users" ON admin_users;
CREATE POLICY "Only admins can view admin_users"
    ON admin_users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = TRUE
        )
    );

-- Only super_admins can insert new admins
DROP POLICY IF EXISTS "Only super_admins can create admins" ON admin_users;
CREATE POLICY "Only super_admins can create admins"
    ON admin_users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = TRUE
        )
    );

-- Only super_admins can update admins
DROP POLICY IF EXISTS "Only super_admins can update admins" ON admin_users;
CREATE POLICY "Only super_admins can update admins"
    ON admin_users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = TRUE
        )
    );

-- ========================================
-- 2. HELPER FUNCTION - Check if user is admin
-- ========================================
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

-- ========================================
-- 3. HELPER FUNCTION - Check if user is super admin
-- ========================================
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = user_id 
        AND role = 'super_admin'
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. UPDATE EXISTING TABLES RLS POLICIES
-- Add admin access to existing tables
-- ========================================

-- COMPANIES TABLE - Admins can manage companies
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

-- JOB_ROLES TABLE - Admins can manage job roles
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

-- APPLICATIONS TABLE - Admins can view and update all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
CREATE POLICY "Admins can view all applications"
    ON applications FOR SELECT
    TO authenticated
    USING (
        is_admin(auth.uid()) OR auth.uid() = student_id
    );

DROP POLICY IF EXISTS "Admins can update applications" ON applications;
CREATE POLICY "Admins can update applications"
    ON applications FOR UPDATE
    TO authenticated
    USING (
        is_admin(auth.uid()) OR auth.uid() = student_id
    );

-- USER_PROFILES TABLE - Admins can view all student profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        is_admin(auth.uid()) OR auth.uid() = id
    );

DROP POLICY IF EXISTS "Admins can update student profiles" ON user_profiles;
CREATE POLICY "Admins can update student profiles"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (
        is_admin(auth.uid()) OR auth.uid() = id
    );

-- ========================================
-- 5. INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ========================================
-- 6. TRIGGER - Update last_login timestamp
-- ========================================
CREATE OR REPLACE FUNCTION update_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE admin_users 
    SET last_login = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger should be called from application code after successful admin login

-- ========================================
-- 7. CREATE FIRST SUPER ADMIN (MANUAL STEP)
-- Run this AFTER creating an admin account via Supabase Auth
-- Replace 'ADMIN_USER_ID' with actual UUID from auth.users
-- ========================================

-- INSTRUCTIONS TO CREATE FIRST ADMIN:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create admin account with email/password
-- 3. Copy the UUID of the created user
-- 4. Run this INSERT query with the copied UUID:

/*
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
    'PASTE_USER_UUID_HERE',  -- Replace with actual admin user UUID
    'admin@placementiq.com',  -- Admin email
    'Super Admin',            -- Admin name
    'super_admin',            -- Role
    TRUE
);
*/

-- Example (DO NOT USE THIS UUID - it's just an example):
-- INSERT INTO admin_users (id, email, full_name, role, is_active)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     'admin@placementiq.com',
--     'Super Admin',
--     'super_admin',
--     TRUE
-- );

-- ========================================
-- 8. VERIFICATION QUERY
-- Check if admin exists
-- ========================================
-- SELECT * FROM admin_users;
-- SELECT is_admin('YOUR_USER_ID');

-- ========================================
-- END OF ADMIN AUTH SCHEMA
-- ========================================
