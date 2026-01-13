-- ============================================
-- PLACEMENTIQ - COLLEGE PLACEMENT PORTAL
-- PostgreSQL Database Schema for Supabase
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- ========================================
-- 1. USER_PROFILES TABLE (students)
-- Stores student profile and academic information
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    
    -- Academic Information
    college TEXT NOT NULL,
    branch TEXT NOT NULL, -- CS, IT, ECE, EEE, MECH, etc.
    batch INTEGER NOT NULL, -- Graduation year (e.g., 2024, 2025)
    current_year INTEGER NOT NULL CHECK (current_year BETWEEN 1 AND 4),
    cgpa DECIMAL(3,2) CHECK (cgpa BETWEEN 0 AND 10),
    
    -- Additional Information
    skills TEXT[] DEFAULT '{}',
    resume_url TEXT, -- Link to resume in storage
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    
    -- Placement Status
    is_placed BOOLEAN DEFAULT FALSE,
    placement_company TEXT,
    placement_package DECIMAL(10,2), -- in LPA (Lakhs Per Annum)
    
    -- Backlogs and Active Backlogs (important for eligibility)
    total_backlogs INTEGER DEFAULT 0,
    active_backlogs INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Students can view their own profile" ON user_profiles;
CREATE POLICY "Students can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Students can update their own profile" ON user_profiles;
CREATE POLICY "Students can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Students can insert their own profile" ON user_profiles;
CREATE POLICY "Students can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. COMPANIES TABLE
-- Stores company information and eligibility criteria
-- ========================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company Details
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    industry TEXT, -- IT Services, Product, FMCG, Finance, etc.
    website TEXT,
    
    -- Eligibility Criteria
    min_cgpa DECIMAL(3,2) NOT NULL CHECK (min_cgpa BETWEEN 0 AND 10),
    max_active_backlogs INTEGER DEFAULT 0,
    max_total_backlogs INTEGER DEFAULT 0,
    eligible_branches TEXT[] NOT NULL DEFAULT '{}', -- ['CS', 'IT', 'ECE', 'EEE']
    eligible_batches INTEGER[] NOT NULL DEFAULT '{}', -- [2024, 2025]
    
    -- Additional Requirements
    required_skills TEXT[] DEFAULT '{}',
    
    -- Company Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies (all authenticated users can view active companies)
DROP POLICY IF EXISTS "Authenticated users can view active companies" ON companies;
CREATE POLICY "Authenticated users can view active companies"
    ON companies FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- ========================================
-- 3. JOB_ROLES TABLE
-- Stores job roles/positions offered by companies
-- ========================================
CREATE TABLE IF NOT EXISTS job_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Role Details
    title TEXT NOT NULL, -- Software Engineer, Data Analyst, etc.
    description TEXT,
    location TEXT, -- Bangalore, Hyderabad, Remote, etc.
    
    -- Package Details
    package_min DECIMAL(10,2), -- Minimum package in LPA
    package_max DECIMAL(10,2), -- Maximum package in LPA
    
    -- Role-Specific Eligibility (overrides company eligibility if set)
    min_cgpa DECIMAL(3,2) CHECK (min_cgpa BETWEEN 0 AND 10),
    eligible_branches TEXT[], -- If NULL, uses company's criteria
    
    -- Role Requirements
    required_skills TEXT[] DEFAULT '{}',
    job_type TEXT CHECK (job_type IN ('Full-Time', 'Internship', 'Both')),
    
    -- Application Dates
    registration_start_date TIMESTAMP WITH TIME ZONE,
    registration_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Role Status
    is_active BOOLEAN DEFAULT TRUE,
    total_positions INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_roles
DROP POLICY IF EXISTS "Authenticated users can view active job roles" ON job_roles;
CREATE POLICY "Authenticated users can view active job roles"
    ON job_roles FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- ========================================
-- 4. APPLICATIONS TABLE
-- Tracks student applications to job roles
-- ========================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Application Status
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN (
        'applied',           -- Initial application submitted
        'under_review',      -- Application being reviewed
        'shortlisted',       -- Shortlisted for next round
        'test_scheduled',    -- Online test scheduled
        'test_cleared',      -- Online test cleared
        'interview_scheduled', -- Interview scheduled
        'interview_cleared', -- Interview cleared
        'offered',           -- Offer received
        'accepted',          -- Offer accepted
        'rejected',          -- Application rejected
        'withdrawn'          -- Student withdrew application
    )),
    
    -- Eligibility Check (stored at time of application)
    is_eligible BOOLEAN NOT NULL,
    eligibility_reason TEXT,
    
    -- Application Details
    resume_url TEXT, -- Snapshot of resume used for this application
    cover_letter TEXT,
    
    -- Test and Interview Details
    test_date TIMESTAMP WITH TIME ZONE,
    test_score DECIMAL(5,2),
    interview_date TIMESTAMP WITH TIME ZONE,
    interview_feedback TEXT,
    
    -- Offer Details
    offer_package DECIMAL(10,2), -- Offered package in LPA
    offer_letter_url TEXT,
    offer_acceptance_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraint: Student can apply to a job role only once
    UNIQUE(student_id, job_role_id)
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
DROP POLICY IF EXISTS "Students can view their own applications" ON applications;
CREATE POLICY "Students can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create their own applications" ON applications;
CREATE POLICY "Students can create their own applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update their own applications" ON applications;
CREATE POLICY "Students can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid() = student_id);

-- ========================================
-- 5. RESUMES TABLE (from existing schema)
-- Stores uploaded resume files metadata
-- ========================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    extracted_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE, -- Mark primary resume
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add is_primary column if it doesn't exist (for existing tables)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resumes' 
        AND column_name = 'is_primary'
    ) THEN 
        ALTER TABLE resumes ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resumes" ON resumes;
CREATE POLICY "Users can view their own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resumes" ON resumes;
CREATE POLICY "Users can insert their own resumes"
    ON resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resumes" ON resumes;
CREATE POLICY "Users can update their own resumes"
    ON resumes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resumes" ON resumes;
CREATE POLICY "Users can delete their own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- 6. RESUME_FEEDBACK TABLE (from existing schema)
-- Stores AI-generated resume analysis
-- ========================================
CREATE TABLE IF NOT EXISTS resume_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    clarity_score INTEGER CHECK (clarity_score BETWEEN 0 AND 100),
    strengths TEXT[],
    missing_sections TEXT[],
    improvements TEXT[],
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE resume_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resume feedback" ON resume_feedback;
CREATE POLICY "Users can view their own resume feedback"
    ON resume_feedback FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume feedback" ON resume_feedback;
CREATE POLICY "Users can insert their own resume feedback"
    ON resume_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 7. INTERVIEW_SESSIONS TABLE (from existing schema)
-- Stores mock interview sessions
-- ========================================
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation JSONB DEFAULT '[]'::jsonb,
    communication_score INTEGER CHECK (communication_score BETWEEN 0 AND 100),
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    feedback TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can view their own interview sessions"
    ON interview_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can insert their own interview sessions"
    ON interview_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can update their own interview sessions"
    ON interview_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, email, college, branch, batch, current_year, cgpa)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'college', ''),
        COALESCE(NEW.raw_user_meta_data->>'branch', ''),
        COALESCE((NEW.raw_user_meta_data->>'batch')::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER),
        COALESCE((NEW.raw_user_meta_data->>'current_year')::INTEGER, 1),
        COALESCE((NEW.raw_user_meta_data->>'cgpa')::DECIMAL, 0.0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS set_updated_at ON user_profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON companies;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON job_roles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON job_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON applications;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ========================================

-- User Profiles Indexes
DROP INDEX IF EXISTS idx_user_profiles_branch;
CREATE INDEX idx_user_profiles_branch ON user_profiles(branch);
DROP INDEX IF EXISTS idx_user_profiles_batch;
CREATE INDEX idx_user_profiles_batch ON user_profiles(batch);
DROP INDEX IF EXISTS idx_user_profiles_cgpa;
CREATE INDEX idx_user_profiles_cgpa ON user_profiles(cgpa);
DROP INDEX IF EXISTS idx_user_profiles_is_placed;
CREATE INDEX idx_user_profiles_is_placed ON user_profiles(is_placed);
DROP INDEX IF EXISTS idx_user_profiles_email;
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Companies Indexes
DROP INDEX IF EXISTS idx_companies_name;
CREATE INDEX idx_companies_name ON companies(name);
DROP INDEX IF EXISTS idx_companies_is_active;
CREATE INDEX idx_companies_is_active ON companies(is_active);
DROP INDEX IF EXISTS idx_companies_eligible_branches;
CREATE INDEX idx_companies_eligible_branches ON companies USING GIN(eligible_branches);

-- Job Roles Indexes
DROP INDEX IF EXISTS idx_job_roles_company_id;
CREATE INDEX idx_job_roles_company_id ON job_roles(company_id);
DROP INDEX IF EXISTS idx_job_roles_is_active;
CREATE INDEX idx_job_roles_is_active ON job_roles(is_active);
DROP INDEX IF EXISTS idx_job_roles_job_type;
CREATE INDEX idx_job_roles_job_type ON job_roles(job_type);
DROP INDEX IF EXISTS idx_job_roles_registration_dates;
CREATE INDEX idx_job_roles_registration_dates ON job_roles(registration_start_date, registration_end_date);

-- Applications Indexes
DROP INDEX IF EXISTS idx_applications_student_id;
CREATE INDEX idx_applications_student_id ON applications(student_id);
DROP INDEX IF EXISTS idx_applications_job_role_id;
CREATE INDEX idx_applications_job_role_id ON applications(job_role_id);
DROP INDEX IF EXISTS idx_applications_company_id;
CREATE INDEX idx_applications_company_id ON applications(company_id);
DROP INDEX IF EXISTS idx_applications_status;
CREATE INDEX idx_applications_status ON applications(status);
DROP INDEX IF EXISTS idx_applications_applied_at;
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- Resume and Feedback Indexes
DROP INDEX IF EXISTS idx_resumes_user_id;
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
DROP INDEX IF EXISTS idx_resumes_is_primary;
CREATE INDEX idx_resumes_is_primary ON resumes(is_primary);
DROP INDEX IF EXISTS idx_resume_feedback_user_id;
CREATE INDEX idx_resume_feedback_user_id ON resume_feedback(user_id);
DROP INDEX IF EXISTS idx_resume_feedback_resume_id;
CREATE INDEX idx_resume_feedback_resume_id ON resume_feedback(resume_id);

-- Interview Sessions Indexes
DROP INDEX IF EXISTS idx_interview_sessions_user_id;
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
DROP INDEX IF EXISTS idx_interview_sessions_status;
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);

-- ========================================
-- HELPER VIEWS FOR COMMON QUERIES
-- ========================================

-- View: Active job openings with company details
CREATE OR REPLACE VIEW active_job_openings AS
SELECT 
    jr.id as job_role_id,
    jr.title as role_title,
    jr.description as role_description,
    jr.location,
    jr.package_min,
    jr.package_max,
    jr.job_type,
    jr.registration_start_date,
    jr.registration_end_date,
    jr.total_positions,
    c.id as company_id,
    c.name as company_name,
    c.logo_url,
    c.industry,
    c.min_cgpa,
    c.eligible_branches,
    c.eligible_batches,
    jr.required_skills
FROM job_roles jr
JOIN companies c ON jr.company_id = c.id
WHERE jr.is_active = TRUE 
  AND c.is_active = TRUE
  AND jr.registration_end_date > NOW();

-- View: Student application summary
CREATE OR REPLACE VIEW student_application_summary AS
SELECT 
    up.id as student_id,
    up.name as student_name,
    up.email,
    up.branch,
    up.batch,
    up.cgpa,
    up.is_placed,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'offered' THEN 1 END) as offers_received,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as offers_accepted,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as applications_rejected
FROM user_profiles up
LEFT JOIN applications a ON up.id = a.student_id
GROUP BY up.id, up.name, up.email, up.branch, up.batch, up.cgpa, up.is_placed;

-- ========================================
-- STORAGE BUCKET SETUP
-- ========================================
-- Note: Run these commands in Supabase Dashboard -> Storage
-- or via Supabase CLI after schema creation

-- 1. Create storage bucket for resumes
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('resumes', 'resumes', false);

-- 2. Create storage bucket for offer letters
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('offer-letters', 'offer-letters', false);

-- 3. Storage policies for resumes bucket
-- CREATE POLICY "Users can upload their own resumes"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own resumes"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own resumes"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Sample Companies
-- INSERT INTO companies (name, description, industry, min_cgpa, eligible_branches, eligible_batches)
-- VALUES 
--     ('TCS', 'Tata Consultancy Services', 'IT Services', 6.0, ARRAY['CS', 'IT', 'ECE', 'EEE'], ARRAY[2024, 2025]),
--     ('Infosys', 'Infosys Limited', 'IT Services', 6.5, ARRAY['CS', 'IT', 'ECE'], ARRAY[2024, 2025]),
--     ('Amazon', 'Amazon Development Centre', 'Product', 7.0, ARRAY['CS', 'IT'], ARRAY[2024, 2025]),
--     ('Microsoft', 'Microsoft India', 'Product', 7.5, ARRAY['CS', 'IT'], ARRAY[2024, 2025]);

-- ========================================
-- END OF SCHEMA
-- ========================================
