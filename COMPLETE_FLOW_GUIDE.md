# Complete Application Flow Guide

## Overview
This guide explains the complete flow from admin creating companies to students applying for jobs.

## Flow Steps

### 1. Admin Creates Company with Eligibility Criteria
1. Login to admin panel at `/admin/login`
2. Navigate to **Manage Companies**
3. Click **"Add New Company"**
4. Fill in company details:
   - **Basic Info**: Name, Description, Website, Industry, Location
   - **Eligibility Criteria**:
     - Minimum CGPA (e.g., 6.0)
     - Max Active Backlogs (e.g., 0)
     - Max Total Backlogs (e.g., 2)
     - Eligible Branches (hold Ctrl/Cmd to select multiple)
     - Eligible Batches (e.g., 2024, 2025)
     - Required Skills (comma-separated, e.g., "Java, Python, SQL")
5. Click **"Create Company"**
6. After creation, click **"+ Add Job Roles"** button on the company card

### 2. Admin Creates Job Roles for the Company
1. You'll be redirected to **Manage Job Roles** with the company pre-selected
2. Click **"Add New Job Role"**
3. Fill in job role details:
   - **Basic Info**: Job Title, Description, Location
   - **Package**: Min and Max package in LPA
   - **Criteria**: Min CGPA (optional, overrides company criteria)
   - **Branches**: Eligible branches (optional, overrides company criteria)
   - **Skills**: Required skills (comma-separated)
   - **Type**: Full-Time, Internship, or Both
   - **Dates**: Registration start and end dates
   - **Positions**: Total number of positions
   - **Status**: Active (checked by default)
4. Click **"Create Job Role"**
5. Repeat to add multiple job roles for the company

### 3. Students View Companies and Job Roles
1. Login to student account at `/login`
2. Navigate to **Companies** from the dashboard
3. Browse active companies
4. Click **"View Jobs"** on any company card
5. See all active job roles for that company

### 4. Students Apply to Job Roles
1. On the job roles page, review the job details:
   - Package range
   - Required CGPA
   - Eligible branches
   - Required skills
   - Application deadline
2. Click **"Apply Now"** button
3. System automatically checks eligibility:
   - ✅ CGPA meets minimum requirement
   - ✅ Active backlogs within limit
   - ✅ Total backlogs within limit
   - ✅ Branch is eligible
   - ✅ Batch year is eligible
4. If eligible → Application submitted successfully! ✅
5. If not eligible → Clear error message shows which criteria are not met ❌

### 5. Admin Views Applications
1. Navigate to **View Applicants** in admin panel
2. Filter by:
   - Company
   - Job Role
   - Application Status
3. View applicant details:
   - Name, Email, CGPA
   - Branch, Batch
   - Resume link
   - Application date
4. Actions:
   - ✅ Accept application
   - ❌ Reject application
   - 📄 View resume
5. Export all applicants to Excel using **"Export to Excel"** button

## Eligibility Check Logic

### Student is eligible if ALL conditions are met:
```javascript
✅ Student CGPA >= Company/Job Min CGPA
✅ Student Active Backlogs <= Company Max Active Backlogs
✅ Student Total Backlogs <= Company Max Total Backlogs
✅ Student Branch in Eligible Branches list (if specified)
✅ Student Batch in Eligible Batches list (if specified)
```

### Example:
**Company Criteria:**
- Min CGPA: 7.0
- Max Active Backlogs: 0
- Max Total Backlogs: 2
- Eligible Branches: Computer Science, IT
- Eligible Batches: 2025, 2026

**Student Profile:**
- CGPA: 7.5 ✅
- Active Backlogs: 0 ✅
- Total Backlogs: 1 ✅
- Branch: Computer Science ✅
- Batch: 2025 ✅

**Result:** Student can apply! ✅

## Important Notes

1. **Job Role Eligibility Overrides:**
   - If a job role specifies min_cgpa or eligible_branches, it overrides company criteria
   - Otherwise, company criteria is used

2. **Active Status:**
   - Only active companies are visible to students
   - Only active job roles are visible to students
   - Admin can see all (active and inactive)

3. **Application Status:**
   - After applying, students can view their applications in "My Applications"
   - Application status can be: Pending, Accepted, Rejected

4. **Resume Requirement:**
   - Students should upload their resume in Resume Checker before applying
   - Resume link is automatically included in the application

## Database Tables

### companies
- Stores company info and base eligibility criteria
- Fields: name, description, min_cgpa, max_active_backlogs, eligible_branches, etc.

### job_roles
- Stores specific job positions for companies
- Fields: title, description, package_min, package_max, min_cgpa (optional), etc.
- Links to companies via company_id

### applications
- Stores student applications to job roles
- Fields: student_id, job_id, status, resume_url, applied_at

### user_profiles
- Stores student profile and academic info
- Fields: cgpa, branch, batch, active_backlogs, total_backlogs, etc.

## RLS Policies Applied

✅ Students can only view active companies and job roles
✅ Students can only create applications for themselves
✅ Students can only view their own applications
✅ Admin can view and manage all data
✅ Admin can update application status

## Testing the Flow

1. **Create test admin account:**
   ```sql
   INSERT INTO admin_users (id, email, name)
   VALUES ('your-admin-uuid', 'admin@example.com', 'Admin User');
   ```

2. **Create test student account:**
   - Sign up at `/signup`
   - Fill in profile with CGPA, branch, batch

3. **Test eligibility scenarios:**
   - Create company with min CGPA 7.0
   - Create student with CGPA 6.5 → Should not be able to apply
   - Update student CGPA to 7.5 → Should be able to apply

4. **Verify application flow:**
   - Student applies → Application appears in "My Applications"
   - Admin sees application in "View Applicants"
   - Admin can accept/reject → Status updates for student

## Troubleshooting

### Students see 0 job roles:
- ✅ Verify job roles exist in database for that company
- ✅ Check job_roles.is_active = true
- ✅ Ensure RLS policies allow student SELECT on job_roles

### Students can't apply:
- ✅ Check eligibility criteria match
- ✅ Verify student profile is complete (CGPA, branch, batch)
- ✅ Check application deadline hasn't passed
- ✅ Ensure student hasn't already applied

### Admin can't create companies:
- ✅ Verify admin_users entry exists for the admin
- ✅ Check RLS policies are applied (run complete-setup.sql)
- ✅ Ensure Supabase service role key is configured

## Next Steps

1. **Run the SQL setup:**
   ```bash
   # In Supabase Dashboard → SQL Editor
   # Run: supabase/complete-setup.sql
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Test the complete flow:**
   - Admin login → Create company → Add job roles
   - Student login → View companies → Apply to job
   - Admin login → View applicants → Accept/Reject

4. **Deploy to production:**
   - See DEPLOYMENT_GUIDE.md for complete deployment instructions
