import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminAPI, adminAuthAPI } from '../services/api';

const ManageJobRoles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const preselectedCompanyId = searchParams.get('company');

  const [companies, setCompanies] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(preselectedCompanyId || '');
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    company_id: preselectedCompanyId || '',
    title: '',
    description: '',
    location: '',
    package_min: '',
    package_max: '',
    min_cgpa: '',
    eligible_branches: [],
    required_skills: '',
    job_type: 'Full-Time',
    registration_start_date: '',
    registration_end_date: '',
    is_active: true,
    total_positions: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const branchOptions = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Other'];

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchJobRoles(selectedCompany);
    } else {
      setJobRoles([]);
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const data = await adminAPI.getCompanies();
      setCompanies(data);
    } catch (error) {
      setError('Failed to fetch companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobRoles = async (companyId) => {
    try {
      const data = await adminAPI.getJobRolesByCompany(companyId);
      setJobRoles(data);
    } catch (error) {
      setError('Failed to fetch job roles: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleArrayChange = (e, field) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      [field]: selected
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.company_id) {
      setError('Please select a company');
      return;
    }

    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        package_min: formData.package_min ? parseFloat(formData.package_min) : null,
        package_max: formData.package_max ? parseFloat(formData.package_max) : null,
        min_cgpa: formData.min_cgpa ? parseFloat(formData.min_cgpa) : null,
        total_positions: formData.total_positions ? parseInt(formData.total_positions) : null,
        registration_start_date: formData.registration_start_date || null,
        registration_end_date: formData.registration_end_date || null,
        eligible_branches: formData.eligible_branches.length > 0 ? formData.eligible_branches : null,
        required_skills: formData.required_skills
          ? formData.required_skills.split(',').map(s => s.trim()).filter(s => s)
          : []
      };

      if (editingRole) {
        await adminAPI.updateJobRole(editingRole.id, submitData);
        setSuccess('Job role updated successfully!');
      } else {
        await adminAPI.createJobRole(submitData);
        setSuccess('Job role created successfully!');
      }
      
      resetForm();
      if (selectedCompany) {
        fetchJobRoles(selectedCompany);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to save job role');
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: selectedCompany,
      title: '',
      description: '',
      location: '',
      package_min: '',
      package_max: '',
      min_cgpa: '',
      eligible_branches: [],
      required_skills: '',
      job_type: 'Full-Time',
      registration_start_date: '',
      registration_end_date: '',
      is_active: true,
      total_positions: ''
    });
    setEditingRole(null);
    setShowForm(false);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      company_id: role.company_id,
      title: role.title || '',
      description: role.description || '',
      location: role.location || '',
      package_min: role.package_min || '',
      package_max: role.package_max || '',
      min_cgpa: role.min_cgpa || '',
      eligible_branches: role.eligible_branches || [],
      required_skills: Array.isArray(role.required_skills) ? role.required_skills.join(', ') : '',
      job_type: role.job_type || 'Full-Time',
      registration_start_date: role.registration_start_date ? role.registration_start_date.split('T')[0] : '',
      registration_end_date: role.registration_end_date ? role.registration_end_date.split('T')[0] : '',
      is_active: role.is_active !== undefined ? role.is_active : true,
      total_positions: role.total_positions || ''
    });
    setShowForm(true);
  };

  const handleToggleActive = async (role) => {
    try {
      await adminAPI.updateJobRole(role.id, {
        is_active: !role.is_active
      });
      setSuccess(`Job role ${!role.is_active ? 'activated' : 'deactivated'} successfully!`);
      if (selectedCompany) {
        fetchJobRoles(selectedCompany);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update job role status: ' + error.message);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this job role?')) return;

    try {
      await adminAPI.deleteJobRole(roleId);
      setSuccess('Job role deleted successfully!');
      if (selectedCompany) {
        fetchJobRoles(selectedCompany);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete job role: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await adminAuthAPI.logout();
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/admin" className="nav-brand">PlacementIQ Admin</Link>
          <ul className="nav-links">
            <li><Link to="/admin">Dashboard</Link></li>
            <li><Link to="/admin/companies">Manage Companies</Link></li>
            <li><Link to="/admin/job-roles">Manage Job Roles</Link></li>
            <li><Link to="/admin/applicants">View Applicants</Link></li>
            <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Manage Job Roles</h1>
            <button 
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  if (!selectedCompany) {
                    setError('Please select a company first');
                    setTimeout(() => setError(''), 3000);
                    return;
                  }
                  setFormData({ ...formData, company_id: selectedCompany });
                  setShowForm(true);
                }
              }}
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              {showForm ? 'Cancel' : '+ Add New Job Role'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Select Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{ maxWidth: '400px' }}
            >
              <option value="">-- Select a company --</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name} {!company.is_active && '(Inactive)'}
                </option>
              ))}
            </select>
          </div>

          {showForm && (
            <div className="company-form-card">
              <h2>{editingRole ? 'Edit Job Role' : 'Add New Job Role'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Job Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Bangalore, Hyderabad, Remote"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Job Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  />
                </div>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Package & Type</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Min Package (LPA)</label>
                    <input
                      type="number"
                      name="package_min"
                      value={formData.package_min}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="e.g., 4.0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Package (LPA)</label>
                    <input
                      type="number"
                      name="package_max"
                      value={formData.package_max}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="e.g., 8.0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Job Type *</label>
                    <select
                      name="job_type"
                      value={formData.job_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Eligibility (Optional - overrides company defaults)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Minimum CGPA (optional)</label>
                    <input
                      type="number"
                      name="min_cgpa"
                      value={formData.min_cgpa}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="Leave empty to use company default"
                    />
                  </div>

                  <div className="form-group">
                    <label>Eligible Branches (optional, Ctrl/Cmd for multiple)</label>
                    <select
                      multiple
                      value={formData.eligible_branches}
                      onChange={(e) => handleArrayChange(e, 'eligible_branches')}
                      style={{ height: '100px' }}
                    >
                      {branchOptions.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Leave empty to use company defaults
                    </small>
                  </div>
                </div>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Application Timeline</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Registration Start Date</label>
                    <input
                      type="date"
                      name="registration_start_date"
                      value={formData.registration_start_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Registration End Date</label>
                    <input
                      type="date"
                      name="registration_end_date"
                      value={formData.registration_end_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Positions</label>
                    <input
                      type="number"
                      name="total_positions"
                      value={formData.total_positions}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    name="required_skills"
                    value={formData.required_skills}
                    onChange={handleInputChange}
                    placeholder="JavaScript, React, Node.js, etc."
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      style={{ width: 'auto' }}
                    />
                    <span>Active (visible to students)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn-primary">
                    {editingRole ? 'Update Job Role' : 'Create Job Role'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {!selectedCompany && !showForm && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Select a company above to view and manage its job roles.</p>
            </div>
          )}

          {selectedCompany && jobRoles.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No job roles for this company yet. Click "Add New Job Role" to create one.</p>
            </div>
          )}

          {selectedCompany && jobRoles.length > 0 && (
            <div className="companies-grid">
              {jobRoles.map(role => (
                <div key={role.id} className="company-card" style={{ 
                  opacity: role.is_active ? 1 : 0.6,
                  border: role.is_active ? '1px solid #ddd' : '1px solid #f99'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3>{role.title}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: role.is_active ? '#d4edda' : '#f8d7da',
                      color: role.is_active ? '#155724' : '#721c24'
                    }}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p>{role.description}</p>
                  <div className="company-info">
                    <div className="info-item">
                      <strong>Location:</strong> {role.location}
                    </div>
                    <div className="info-item">
                      <strong>Package:</strong> {role.package_min && role.package_max ? `${role.package_min} - ${role.package_max} LPA` : 'Not specified'}
                    </div>
                    <div className="info-item">
                      <strong>Type:</strong> {role.job_type}
                    </div>
                    <div className="info-item">
                      <strong>Positions:</strong> {role.total_positions || 'N/A'}
                    </div>
                    {role.registration_end_date && (
                      <div className="info-item">
                        <strong>Apply By:</strong> {new Date(role.registration_end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleEdit(role)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleActive(role)}
                      style={{
                        padding: '8px 16px',
                        background: role.is_active ? '#ffc107' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {role.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDelete(role.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageJobRoles;
