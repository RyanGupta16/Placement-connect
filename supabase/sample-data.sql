-- ============================================
-- SAMPLE DATA FOR TESTING APPLICATION FLOW
-- Run this after creating the schema
-- ============================================

-- Insert sample companies
INSERT INTO companies (
    name, 
    description, 
    industry, 
    min_cgpa, 
    max_active_backlogs,
    max_total_backlogs,
    eligible_branches, 
    eligible_batches,
    is_active
) VALUES 
    (
        'TCS', 
        'Tata Consultancy Services - Leading global IT services company', 
        'IT Services', 
        6.0,
        0,
        2,
        ARRAY['CS', 'IT', 'ECE', 'EEE'], 
        ARRAY[2024, 2025, 2026],
        TRUE
    ),
    (
        'Infosys', 
        'Infosys Limited - Global leader in next-generation digital services', 
        'IT Services', 
        6.5,
        0,
        1,
        ARRAY['CS', 'IT', 'ECE'], 
        ARRAY[2024, 2025, 2026],
        TRUE
    ),
    (
        'Amazon', 
        'Amazon Development Centre India', 
        'Product', 
        7.0,
        0,
        0,
        ARRAY['CS', 'IT'], 
        ARRAY[2024, 2025, 2026],
        TRUE
    ),
    (
        'Microsoft', 
        'Microsoft India - Technology solutions and cloud platform', 
        'Product', 
        7.5,
        0,
        0,
        ARRAY['CS', 'IT'], 
        ARRAY[2024, 2025, 2026],
        TRUE
    ),
    (
        'Wipro',
        'Wipro Limited - Leading technology services and consulting company',
        'IT Services',
        6.0,
        0,
        2,
        ARRAY['CS', 'IT', 'ECE', 'EEE', 'MECH'],
        ARRAY[2024, 2025, 2026],
        TRUE
    ),
    (
        'Cognizant',
        'Cognizant Technology Solutions - IT services and consulting',
        'IT Services',
        6.5,
        0,
        1,
        ARRAY['CS', 'IT', 'ECE'],
        ARRAY[2024, 2025, 2026],
        TRUE
    );

-- Insert job roles for TCS
INSERT INTO job_roles (
    company_id,
    title,
    description,
    location,
    package_min,
    package_max,
    job_type,
    registration_start_date,
    registration_end_date,
    total_positions,
    is_active
) VALUES 
    (
        (SELECT id FROM companies WHERE name = 'TCS' LIMIT 1),
        'Assistant Systems Engineer',
        'Work on software development and maintenance projects',
        'Multiple Locations',
        3.5,
        4.0,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '30 days',
        100,
        TRUE
    ),
    (
        (SELECT id FROM companies WHERE name = 'TCS' LIMIT 1),
        'Digital Trainee',
        'Digital technology training program',
        'Bangalore',
        7.0,
        7.0,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '45 days',
        50,
        TRUE
    );

-- Insert job roles for Infosys
INSERT INTO job_roles (
    company_id,
    title,
    description,
    location,
    package_min,
    package_max,
    job_type,
    registration_start_date,
    registration_end_date,
    total_positions,
    is_active
) VALUES 
    (
        (SELECT id FROM companies WHERE name = 'Infosys' LIMIT 1),
        'Systems Engineer',
        'Software development and testing role',
        'Pune / Bangalore',
        3.6,
        4.5,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '25 days',
        150,
        TRUE
    ),
    (
        (SELECT id FROM companies WHERE name = 'Infosys' LIMIT 1),
        'Power Programmer',
        'Advanced programming role for top performers',
        'Hyderabad',
        9.0,
        9.5,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '20 days',
        25,
        TRUE
    );

-- Insert job roles for Amazon
INSERT INTO job_roles (
    company_id,
    title,
    description,
    location,
    package_min,
    package_max,
    min_cgpa,
    job_type,
    registration_start_date,
    registration_end_date,
    total_positions,
    is_active
) VALUES 
    (
        (SELECT id FROM companies WHERE name = 'Amazon' LIMIT 1),
        'Software Development Engineer',
        'Build scalable systems and innovative solutions',
        'Bangalore / Hyderabad',
        28.0,
        42.0,
        7.5,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '15 days',
        30,
        TRUE
    ),
    (
        (SELECT id FROM companies WHERE name = 'Amazon' LIMIT 1),
        'SDE Intern',
        'Summer internship program',
        'Bangalore',
        80000,
        100000,
        7.0,
        'Internship',
        NOW(),
        NOW() + INTERVAL '40 days',
        50,
        TRUE
    );

-- Insert job roles for Microsoft
INSERT INTO job_roles (
    company_id,
    title,
    description,
    location,
    package_min,
    package_max,
    min_cgpa,
    job_type,
    registration_start_date,
    registration_end_date,
    total_positions,
    is_active
) VALUES 
    (
        (SELECT id FROM companies WHERE name = 'Microsoft' LIMIT 1),
        'Software Engineer',
        'Join the cloud and AI revolution',
        'Bangalore',
        42.0,
        50.0,
        8.0,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '10 days',
        20,
        TRUE
    );

-- Insert job roles for Wipro
INSERT INTO job_roles (
    company_id,
    title,
    description,
    location,
    package_min,
    package_max,
    job_type,
    registration_start_date,
    registration_end_date,
    total_positions,
    is_active
) VALUES 
    (
        (SELECT id FROM companies WHERE name = 'Wipro' LIMIT 1),
        'Project Engineer',
        'Software development and client engagement',
        'Multiple Locations',
        3.5,
        4.0,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '35 days',
        200,
        TRUE
    );

-- Insert job roles for Cognizant
INSERT INTO job_roles (
    company_id,
    title,
    description,
    location,
    package_min,
    package_max,
    job_type,
    registration_start_date,
    registration_end_date,
    total_positions,
    is_active
) VALUES 
    (
        (SELECT id FROM companies WHERE name = 'Cognizant' LIMIT 1),
        'Programmer Analyst Trainee',
        'Graduate training program in software development',
        'Chennai / Bangalore',
        4.0,
        4.5,
        'Full-Time',
        NOW(),
        NOW() + INTERVAL '28 days',
        120,
        TRUE
    );

-- Display inserted data
SELECT 'Companies created:' as info, COUNT(*) as count FROM companies;
SELECT 'Job roles created:' as info, COUNT(*) as count FROM job_roles;
