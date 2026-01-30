# Excel Export Feature - Deployment Guide

## Overview
Admin-only feature to export applicant data as Excel (.xlsx) files with complete student information, application status, and interview/test dates.

---

## 🚀 Deployment Steps

### 1. Deploy the Edge Function

```bash
# Navigate to your project directory
cd /Users/ryangupta/Desktop/Placement-connect

# Login to Supabase CLI (if not already logged in)
supabase login

# Link your project
supabase link --project-ref xpkpjmnmxwaxopskwwzn

# Deploy the export-applicants function
supabase functions deploy export-applicants

# Verify deployment
supabase functions list
```

### 2. Set Environment Variables (Already configured)
The function uses these environment variables which are automatically available:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

### 3. Test the Edge Function

You can test the function directly:

```bash
# Test with company_id
curl -X POST \
  https://xpkpjmnmxwaxopskwwzn.supabase.co/functions/v1/export-applicants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"company_id": "YOUR_COMPANY_ID"}' \
  --output test_export.xlsx

# Test with job_role_id
curl -X POST \
  https://xpkpjmnmxwaxopskwwzn.supabase.co/functions/v1/export-applicants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"job_role_id": "YOUR_JOB_ROLE_ID"}' \
  --output test_export.xlsx
```

---

## 📊 Feature Details

### What Gets Exported

The Excel file contains the following columns:

1. **Student Name** - Full name from user_profiles
2. **Email** - Contact email
3. **Phone** - Contact phone number
4. **Branch** - Academic branch (CS, IT, ECE, etc.)
5. **Batch** - Graduation year
6. **CGPA** - Current CGPA
7. **Resume URL** - Link to uploaded resume
8. **Status** - Application status (pending, shortlisted, rejected)
9. **Applied Date** - When the application was submitted
10. **Company** - Company name
11. **Job Role** - Position title
12. **Package** - Salary range in LPA
13. **Interview Date** - Scheduled interview date (if any)
14. **Test Date** - Scheduled test date (if any)
15. **Remarks** - Admin notes/comments

### File Naming Convention
```
{CompanyName}_Applicants_{YYYY-MM-DD}.xlsx
Example: Amazon_Applicants_2026-01-30.xlsx
```

---

## 🔒 Security Implementation

### 1. Admin-Only Access
- Function verifies JWT token
- Checks `admin_users` table for active admin status
- Returns 403 Forbidden if user is not an admin

### 2. RLS Policies
The existing RLS policies already protect the data:
```sql
-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
    ON applications FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));
```

### 3. Student Protection
Students **cannot** access this functionality because:
- The Edge Function validates admin status
- Students don't have the "Export to Excel" button in the UI
- Protected routes prevent unauthorized access

---

## 💡 Usage Instructions

### For Admins:

1. **Login to Admin Panel**
   - Navigate to `/admin/login`
   - Use your admin credentials

2. **Go to View Applicants**
   - Click "View Applicants" in the navigation

3. **Filter Applicants**
   - Select a **Company** OR
   - Select a specific **Job Role** (after selecting company)
   - Optionally filter by Status

4. **Export to Excel**
   - Click the "📊 Export to Excel" button
   - File downloads automatically
   - Opens in Excel, Google Sheets, or any spreadsheet app

### Button States:
- **Disabled** (gray) - No company/role selected
- **Enabled** (green) - Company or role selected, ready to export
- **Exporting...** - Download in progress

---

## 🛠️ Troubleshooting

### Issue: "Access denied. Admin privileges required"
**Solution:** 
- Verify you're logged in as an admin
- Check the `admin_users` table has your user ID
- Ensure `is_active = true` in admin_users

### Issue: "No applicants found"
**Solution:**
- Verify there are applications for the selected company/role
- Check the applications table has data
- Ensure job roles are linked to the company

### Issue: "Failed to export applicants"
**Solution:**
- Check browser console for detailed errors
- Verify Edge Function is deployed: `supabase functions list`
- Check Supabase logs: Dashboard → Edge Functions → Logs

### Issue: Download doesn't start
**Solution:**
- Check browser popup blocker settings
- Ensure browser allows downloads from localhost/your domain
- Try a different browser

---

## 📝 Database Queries Used

The Edge Function joins multiple tables:

```sql
SELECT 
  applications.*,
  user_profiles (name, email, phone, branch, batch, cgpa, resume_url),
  job_roles (title, package_min, package_max, companies(name))
FROM applications
WHERE job_id = ? OR job_id IN (SELECT id FROM job_roles WHERE company_id = ?)
ORDER BY applied_at DESC
```

---

## 🔄 Future Enhancements

Potential improvements:
1. **Custom Column Selection** - Let admins choose which columns to export
2. **Date Range Filter** - Export applications from specific date range
3. **Multiple Companies** - Export data for multiple companies at once
4. **CSV Format** - Option to download as CSV instead of Excel
5. **Email Reports** - Schedule automated email reports
6. **Charts/Graphs** - Include visual analytics in the Excel file
7. **Batch Export** - Export all companies data in separate sheets

---

## 📚 API Reference

### Edge Function Endpoint
```
POST https://xpkpjmnmxwaxopskwwzn.supabase.co/functions/v1/export-applicants
```

### Request Headers
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json",
  "apikey": "<SUPABASE_ANON_KEY>"
}
```

### Request Body
```json
{
  "company_id": "uuid",  // Optional: Export all roles for this company
  "job_role_id": "uuid"  // Optional: Export specific role only
}
```

**Note:** Provide either `company_id` OR `job_role_id`, not both.

### Response
- **Success (200)**: Binary Excel file (.xlsx)
- **Error (401)**: Not authenticated
- **Error (403)**: Not an admin
- **Error (404)**: No applicants found
- **Error (500)**: Server error

---

## ✅ Testing Checklist

- [ ] Edge Function deployed successfully
- [ ] Admin can see "Export to Excel" button
- [ ] Button is disabled when no filter selected
- [ ] Button is enabled when company/role selected
- [ ] Excel file downloads correctly
- [ ] Excel file opens in spreadsheet software
- [ ] All data columns are present and populated
- [ ] Student users cannot access the feature
- [ ] Non-admin users get 403 error
- [ ] File naming convention is correct
- [ ] Large datasets (100+ applicants) export successfully

---

## 🎯 Success Criteria

✅ **Feature is working when:**
1. Admins can export applicant data
2. Excel file downloads automatically
3. All student data is correctly formatted
4. Students cannot access the feature
5. Performance is good (< 10 seconds for 1000 records)

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase Edge Function logs
3. Verify admin_users table configuration
4. Test with a small dataset first

---

**Last Updated:** January 30, 2026
**Version:** 1.0.0
