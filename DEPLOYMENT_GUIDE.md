# 🚀 DEPLOYMENT CHECKLIST

## Step 1: Database Setup (Supabase SQL Editor)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xpkpjmnmxwaxopskwwzn
2. Click "SQL Editor" in the left sidebar
3. Copy and paste the entire contents of `supabase/complete-setup.sql`
4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

## Step 2: Verify Admin Access

Run this in SQL Editor:
```sql
SELECT * FROM admin_users WHERE email = 'ryan@gmail.com';
```

**If it returns NO ROWS**, add yourself as admin:
```sql
INSERT INTO admin_users (id, email, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ryan@gmail.com'),
  'ryan@gmail.com',
  'super_admin',
  true
);
```

## Step 3: Deploy Edge Function (Optional - for Excel Export)

```bash
cd /Users/ryangupta/Desktop/Placement-connect
supabase functions deploy export-applicants --no-verify-jwt
```

**OR** use the Supabase dashboard:
1. Go to Edge Functions
2. Create new function named `export-applicants`
3. Copy contents from `supabase/functions/export-applicants/index.ts`
4. Deploy

## Step 4: Test the Flow

### As Admin:
1. Login at http://localhost:3001/admin/login (ryan@gmail.com)
2. Go to "Manage Companies"
3. Click "Add Company"
4. Fill in details:
   - Name: Amazon
   - Industry: IT
   - Description: 6 months internship
   - Min CGPA: 6.0
   - Select branches: Computer Science, IT
   - Select batches: 2026, 2027
   - **Make sure "Active" checkbox is CHECKED**
5. Click "Add Company"

### As Student:
1. Logout from admin
2. Login as student at http://localhost:3001/login
3. Go to "Companies" - you should now SEE Amazon
4. Click on Amazon → View job roles
5. Apply to a role
6. Your application is submitted!

### Back as Admin:
1. Login as admin again
2. Go to "View Applicants"
3. Select company: Amazon
4. You should see the student's application
5. Click "Export to Excel" - downloads a .xlsx file!

## Troubleshooting

### Companies not showing for students?
- Make sure company is marked as "Active" when creating
- Run: `SELECT * FROM companies WHERE is_active = true;` to verify

### "TypeError: Load failed" when creating company?
- RLS policies not applied - rerun `complete-setup.sql`
- Check admin status: `SELECT is_admin(auth.uid());`

### Excel export button not working?
- Edge function not deployed - follow Step 3
- Or use browser console to see error

## Quick SQL Checks

```sql
-- See all companies (admin view)
SELECT name, is_active FROM companies;

-- See all applications
SELECT 
  user_profiles.name as student,
  companies.name as company,
  job_roles.title as role,
  applications.status,
  applications.applied_at
FROM applications
JOIN user_profiles ON applications.student_id = user_profiles.id
JOIN job_roles ON applications.job_id = job_roles.id
JOIN companies ON job_roles.company_id = companies.id;

-- Count applications per company
SELECT 
  companies.name,
  COUNT(applications.id) as application_count
FROM companies
LEFT JOIN job_roles ON companies.id = job_roles.company_id
LEFT JOIN applications ON job_roles.id = applications.job_id
GROUP BY companies.name;
```

## ✅ Success Indicators

- Admin can create companies ✓
- Students can see active companies ✓
- Students can apply to roles ✓
- Admin can view all applications ✓
- Admin can export to Excel ✓
