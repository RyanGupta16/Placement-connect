# Student Application Flow - Implementation Guide

## Overview
Complete student job application system using Supabase with eligibility checking, duplicate prevention, and status tracking.

---

## 1. Database Schema (schema.sql)

### Key Features:
- **UNIQUE Constraint**: Prevents duplicate applications
- **Status Enum**: Tracks application lifecycle
- **RLS Policies**: Row-level security for data access
- **Foreign Keys**: Links applications to students, job roles, and companies

### Application Status Flow:
```
applied → under_review → shortlisted → test_scheduled → 
test_cleared → interview_scheduled → interview_cleared → 
offered → accepted
```

Or at any point:
```
→ rejected / withdrawn
```

### Critical Constraint:
```sql
UNIQUE(student_id, job_role_id)
```
This ensures students can apply to each job role only once.

---

## 2. Frontend Implementation (dashboard.js)

### Key Functions:

#### **loadUserApplications()**
- Fetches all applications for logged-in student
- Joins with `job_roles` and `companies` tables
- Displays application cards with status badges
- Shows eligibility warnings if applicable

```javascript
const { data: applications } = await supabase
    .from('applications')
    .select(`
        id, status, is_eligible, eligibility_reason, applied_at,
        job_roles (
            id, title, location, package_min, package_max,
            companies (id, name, logo_url)
        )
    `)
    .eq('student_id', userId)
    .order('applied_at', { ascending: false });
```

#### **loadJobRoles()**
- Fetches active job openings using the `active_job_openings` view
- Populates filter dropdowns
- Displays job cards with eligibility badges

```javascript
const { data: jobRoles } = await supabase
    .from('active_job_openings')
    .select('*')
    .order('registration_start_date', { ascending: false });
```

#### **checkEligibility(job)**
- Client-side eligibility validation
- Checks:
  - CGPA requirement
  - Branch eligibility
  - Batch eligibility
  - Active backlogs
- Returns `{ isEligible: boolean, reason: string }`

#### **applyToJob(jobRoleId, companyId, isEligible, reason)**
- Validates application eligibility
- Checks for duplicate applications
- Creates application record
- Handles errors (especially 23505 for duplicates)

```javascript
const { data, error } = await supabase
    .from('applications')
    .insert({
        student_id: currentProfile.id,
        job_role_id: jobRoleId,
        company_id: companyId,
        status: 'applied',
        is_eligible: isEligible,
        eligibility_reason: reason,
        resume_url: currentProfile.resume_url || null
    });
```

#### **filterJobRoles()**
- Filters jobs by company and job type
- Updates display without database query

---

## 3. Duplicate Prevention Strategy

### Database Level:
```sql
-- Unique constraint
UNIQUE(student_id, job_role_id)
```

### Application Level:
```javascript
// Check before insert
const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('student_id', userId)
    .eq('job_role_id', jobRoleId)
    .single();

if (existingApp) {
    showToast('Already applied!', 'error');
    return;
}
```

### Error Handling:
```javascript
if (error.code === '23505') {
    // PostgreSQL unique violation code
    showToast('You have already applied to this position', 'error');
}
```

### UI Level:
```javascript
const hasApplied = userApplications.some(
    app => app.job_roles.id === job.job_role_id
);

// Show "Already Applied" button (disabled)
```

---

## 4. User Interface Components

### Dashboard Sections:

#### **Stats Grid**
- Resume Score
- Interview Sessions
- Eligibility Checks
- **Applications Count** (NEW)

#### **My Applications**
Shows all submitted applications with:
- Company logo and name
- Job role title
- Application status badge
- Location, package, job type
- Applied date
- Eligibility warning (if not eligible)

#### **Available Job Openings**
Shows active job roles with:
- Company information
- Role details
- Eligibility badge (✓ Eligible / ✗ Not Eligible)
- Package range
- Registration deadline
- Apply button (or "Already Applied")

#### **Filters**
- Filter by Company
- Filter by Job Type (Full-Time/Internship/Both)

---

## 5. Status Badge Styling

Visual indicators for application status:

| Status | Color | Emoji |
|--------|-------|-------|
| applied | Blue | 📝 |
| under_review | Yellow | 👀 |
| shortlisted | Purple | ⭐ |
| test_scheduled | Pink | 📅 |
| test_cleared | Green | ✅ |
| interview_scheduled | Yellow | 📞 |
| interview_cleared | Green | 🎯 |
| offered | Green | 🎉 |
| accepted | Cyan | ✨ |
| rejected | Red | ❌ |
| withdrawn | Gray | 🚫 |

---

## 6. Testing the Flow

### Step 1: Populate Sample Data
```sql
-- Run sample-data.sql in Supabase SQL Editor
psql -f supabase/sample-data.sql
```

### Step 2: Create Test Student Profile
```javascript
// Complete profile with:
- CGPA: 7.5
- Branch: CS
- Batch: 2025
- Active Backlogs: 0
```

### Step 3: Browse Job Openings
- View all available positions
- Check eligibility badges
- Note eligible vs. ineligible roles

### Step 4: Apply to Jobs
- Click "Apply Now" on eligible positions
- Confirm application
- Verify application appears in "My Applications"
- Try applying again (should be prevented)

### Step 5: Test Filters
- Filter by specific company
- Filter by job type
- Verify job list updates

---

## 7. SQL Queries for Testing

### Check All Applications
```sql
SELECT 
    a.status,
    a.is_eligible,
    up.name as student_name,
    jr.title as role_title,
    c.name as company_name,
    a.applied_at
FROM applications a
JOIN user_profiles up ON a.student_id = up.id
JOIN job_roles jr ON a.job_role_id = jr.id
JOIN companies c ON a.company_id = c.id
ORDER BY a.applied_at DESC;
```

### Get Student's Application Summary
```sql
SELECT * FROM student_application_summary
WHERE student_id = 'YOUR_USER_ID';
```

### View Active Job Openings
```sql
SELECT * FROM active_job_openings
ORDER BY registration_end_date;
```

---

## 8. Error Handling

### Common Errors:

**Duplicate Application (23505)**
```javascript
if (error.code === '23505') {
    showToast('You have already applied to this position', 'error');
}
```

**Foreign Key Violation (23503)**
```javascript
// Invalid job_role_id or company_id
showToast('Invalid job role. Please refresh and try again.', 'error');
```

**Unauthorized (42501)**
```javascript
// RLS policy violation
showToast('You are not authorized to perform this action', 'error');
```

---

## 9. Security Features

### Row Level Security (RLS)
- Students can only view/create their own applications
- Students can view all active companies and job roles
- Students can only update their own applications

### Validation
- Client-side eligibility checks
- Server-side unique constraint
- RLS policies prevent unauthorized access

### Data Integrity
- Foreign key constraints ensure valid references
- Cascading deletes maintain referential integrity
- Status enum prevents invalid status values

---

## 10. Future Enhancements

### Potential Features:
1. **Application Withdrawal**
   - Allow students to withdraw applications
   - Update status to 'withdrawn'

2. **Status Updates**
   - Email notifications on status changes
   - Real-time updates using Supabase Realtime

3. **Application Analytics**
   - Track application conversion rates
   - Show success statistics

4. **Bulk Apply**
   - Apply to multiple positions at once
   - Smart recommendations based on profile

5. **Application Notes**
   - Students can add private notes
   - Track follow-ups and interview dates

6. **Document Upload**
   - Attach custom resume per application
   - Upload cover letter

---

## 11. Troubleshooting

### Problem: Applications not showing
**Solution**: Check RLS policies and user authentication

### Problem: Can't apply to jobs
**Solution**: Verify profile is complete (CGPA, branch, batch)

### Problem: Duplicate application despite UI check
**Solution**: Database unique constraint will catch it; handle error properly

### Problem: Job roles not loading
**Solution**: Check if `active_job_openings` view exists and has data

---

## Complete File Summary

### Modified Files:
1. **supabase/schema.sql** - Database schema with all tables
2. **public/dashboard.html** - Added applications and job roles sections
3. **public/js/dashboard.js** - Complete application logic
4. **public/css/style.css** - Added application flow styles

### New Files:
1. **supabase/sample-data.sql** - Test companies and job roles

### Key Tables:
- `user_profiles` - Student information
- `companies` - Company details with eligibility criteria
- `job_roles` - Job positions with requirements
- `applications` - Student applications with status tracking

---

## API Reference

### Fetch Applications
```javascript
const { data, error } = await supabase
    .from('applications')
    .select('*, job_roles(*,companies(*))')
    .eq('student_id', userId);
```

### Create Application
```javascript
const { data, error } = await supabase
    .from('applications')
    .insert({
        student_id, job_role_id, company_id,
        status: 'applied', is_eligible, eligibility_reason
    });
```

### Update Application Status
```javascript
const { error } = await supabase
    .from('applications')
    .update({ status: 'shortlisted' })
    .eq('id', applicationId)
    .eq('student_id', userId);
```

---

**Implementation Complete!** 🎉

The student application flow is fully functional with duplicate prevention, eligibility checking, and comprehensive status tracking.
