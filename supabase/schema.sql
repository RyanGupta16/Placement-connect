-- PlacementIQ Database Schema
-- This schema is designed for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PROFILES TABLE
-- Stores student profile information
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    college TEXT NOT NULL,
    branch TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
    cgpa DECIMAL(3,2) CHECK (cgpa BETWEEN 0 AND 10),
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ========================================
-- RESUMES TABLE
-- Stores uploaded resume files metadata
-- ========================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    extracted_text TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
    ON resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- RESUME_FEEDBACK TABLE
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

CREATE POLICY "Users can view their own resume feedback"
    ON resume_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume feedback"
    ON resume_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- INTERVIEW_SESSIONS TABLE
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

CREATE POLICY "Users can view their own interview sessions"
    ON interview_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview sessions"
    ON interview_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions"
    ON interview_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- ========================================
-- COMPANY_CHECKS TABLE
-- Stores company eligibility check history
-- ========================================
CREATE TABLE IF NOT EXISTS company_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    is_eligible BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    criteria_met JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE company_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company checks"
    ON company_checks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company checks"
    ON company_checks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, college, branch, year, cgpa)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
        COALESCE(NEW.raw_user_meta_data->>'college', ''),
        COALESCE(NEW.raw_user_meta_data->>'branch', ''),
        COALESCE((NEW.raw_user_meta_data->>'year')::integer, 1),
        COALESCE((NEW.raw_user_meta_data->>'cgpa')::decimal, 0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resume_feedback_user_id ON resume_feedback(user_id);
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_company_checks_user_id ON company_checks(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);

-- ========================================
-- STORAGE BUCKET SETUP
-- ========================================
-- Note: Run this in Supabase Dashboard -> Storage
-- or via Supabase CLI

-- Create storage bucket for resumes
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('resumes', 'resumes', false);

-- Storage policies (run in Supabase Dashboard)
-- CREATE POLICY "Users can upload their own resumes"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own resumes"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own resumes"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
