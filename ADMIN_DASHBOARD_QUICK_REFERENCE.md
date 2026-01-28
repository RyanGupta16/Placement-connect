# Admin Dashboard - Quick Reference

## 🚀 Access Admin Dashboard

1. Go to http://localhost:3001/login
2. Click **"🔐 Admin Login"**
3. Login with admin credentials
4. Navigate admin dashboard

---

## 📋 Quick Actions

### Create Company
```
/admin/companies → + Add New Company → Fill form → Create
```

### Create Job Role
```
/admin/job-roles → Select company → + Add New Job Role → Fill form → Create
```

### Activate/Deactivate
```
Find company/role card → Click Activate/Deactivate button
```

### Edit
```
Find company/role card → Click Edit → Modify → Update
```

### Delete
```
Find company/role card → Click Delete → Confirm
```

---

## 🔑 Required Fields

### Company Form
✅ Name, Description, Industry  
✅ Min CGPA  
✅ Eligible Branches (multi-select)  
✅ Eligible Batches (multi-select)  

### Job Role Form
✅ Company Selection  
✅ Title, Description, Location  
✅ Job Type  

---

## 🎯 Key Features

| Feature | Companies | Job Roles |
|---------|-----------|-----------|
| Create | ✅ | ✅ |
| Edit | ✅ | ✅ |
| Delete | ✅ | ✅ |
| Activate/Deactivate | ✅ | ✅ |
| Status Badge | ✅ | ✅ |
| Form Validation | ✅ | ✅ |
| Multi-Select Fields | ✅ Branches, Batches | ✅ Branches |
| Date Management | ❌ | ✅ Start/End Dates |
| Package Range | ❌ | ✅ Min/Max LPA |

---

## 🗺️ Navigation

```
/admin → Dashboard
/admin/companies → Manage Companies
/admin/job-roles → Manage Job Roles
/admin/applicants → View Applicants
```

**Quick Navigation:**
- Company Card → "Manage Jobs" button → Pre-selects company in Job Roles page

---

## 💡 Pro Tips

1. **Multi-Select**: Hold Ctrl (Windows) or Cmd (Mac) to select multiple branches/batches
2. **Deactivate vs Delete**: Deactivate to hide from students but keep data
3. **Registration Dates**: Set dates to control application windows
4. **Override Eligibility**: Job roles can override company-level criteria
5. **Status Indicators**: Green badge = Active, Red badge = Inactive

---

## 🔒 Security

✅ Only admins can access admin routes  
✅ Students redirected to /admin/login  
✅ Database-level RLS policies enforced  
✅ Admin status checked on every page load  

---

## 📊 Admin API

```javascript
// Companies
await adminAPI.getCompanies()
await adminAPI.createCompany(data)
await adminAPI.updateCompany(id, data)
await adminAPI.deleteCompany(id)

// Job Roles
await adminAPI.getJobRolesByCompany(companyId)
await adminAPI.createJobRole(data)
await adminAPI.updateJobRole(id, data)
await adminAPI.deleteJobRole(id)
```

---

## ✅ Testing Checklist

**Companies:**
- [ ] Create with all fields
- [ ] Edit existing
- [ ] Toggle active/inactive
- [ ] Delete
- [ ] Multi-select branches/batches works

**Job Roles:**
- [ ] Select company
- [ ] Create with all fields
- [ ] Edit existing
- [ ] Set registration dates
- [ ] Toggle active/inactive
- [ ] Delete

**Security:**
- [ ] Admin can access all routes
- [ ] Student cannot access admin routes
- [ ] Logout works correctly

---

## 🚨 Troubleshooting

**Issue**: Form validation fails  
**Fix**: Ensure all required (*) fields are filled

**Issue**: Multi-select not working  
**Fix**: Hold Ctrl/Cmd while clicking options

**Issue**: Cannot create job role  
**Fix**: Select a company first

**Issue**: Changes not visible to students  
**Fix**: Ensure company/role is_active = true

---

## 📁 Key Files

- [ManageCompanies.jsx](src/components/ManageCompanies.jsx)
- [ManageJobRoles.jsx](src/components/ManageJobRoles.jsx)
- [api.js](src/services/api.js) - adminAPI functions
- [App.jsx](src/App.jsx) - Routes

---

## 📖 Full Documentation

See [ADMIN_DASHBOARD_IMPLEMENTATION.md](ADMIN_DASHBOARD_IMPLEMENTATION.md) for complete details.

---

**Status**: ✅ Fully Implemented  
**Server**: http://localhost:3001/  
**Admin Login**: http://localhost:3001/admin/login
