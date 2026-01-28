import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminAPI, adminAuthAPI } from '../services/api';

const ManageCompanies = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    logo_url: '',
    min_cgpa: '6.0',
    max_active_backlogs: 0,
    max_total_backlogs: 0,
    eligible_branches: [],
    eligible_batches: [],
    required_skills: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const branchOptions = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Other'];
  const currentYear = new Date().getFullYear();
  const batchOptions = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

  useEffect(() => {
    fetchCompanies();
    if (id) {
      setShowForm(true);
      fetchCompanyDetails(id);
    }
  }, [id]);

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

  const fetchCompanyDetails = async (companyId) => {
    try {
      const data = await adminAPI.getCompanyById(companyId);
      setEditingCompany(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        website: data.website || '',
        industry: data.industry || '',
        logo_url: data.logo_url || '',
        min_cgpa: data.min_cgpa || '6.0',
        max_active_backlogs: data.max_active_backlogs || 0,
        max_total_backlogs: data.max_total_backlogs || 0,
        eligible_branches: data.eligible_branches || [],
        eligible_batches: data.eligible_batches || [],
        required_skills: Array.isArray(data.required_skills) ? data.required_skills.join(', ') : '',
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    } catch (error) {
      setError('Failed to fetch company details: ' + error.message);
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
    if (!formData.name || !formData.description) {
      setError('Name and description are required');
      return;
    }

    if (formData.eligible_branches.length === 0) {
      setError('Please select at least one eligible branch');
      return;
    }

    if (formData.eligible_batches.length === 0) {
      setError('Please select at least one eligible batch');
      return;
    }

    try {
      const submitData = {
        ...formData,
        min_cgpa: parseFloat(formData.min_cgpa),
        max_active_backlogs: parseInt(formData.max_active_backlogs),
        max_total_backlogs: parseInt(formData.max_total_backlogs),
        eligible_batches: formData.eligible_batches.map(b => parseInt(b)),
        required_skills: formData.required_skills
          ? formData.required_skills.split(',').map(s => s.trim()).filter(s => s)
          : []
      };

      if (editingCompany) {
        await adminAPI.updateCompany(editingCompany.id, submitData);
        setSuccess('Company updated successfully!');
      } else {
        await adminAPI.createCompany(submitData);
        setSuccess('Company created successfully!');
      }
      
      resetForm();
      fetchCompanies();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to save company');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      industry: '',
      logo_url: '',
      min_cgpa: '6.0',
      max_active_backlogs: 0,
      max_total_backlogs: 0,
      eligible_branches: [],
      eligible_batches: [],
      required_skills: '',
      is_active: true
    });
    setEditingCompany(null);
    setShowForm(false);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      description: company.description || '',
      website: company.website || '',
      industry: company.industry || '',
      logo_url: company.logo_url || '',
      min_cgpa: company.min_cgpa || '6.0',
      max_active_backlogs: company.max_active_backlogs || 0,
      max_total_backlogs: company.max_total_backlogs || 0,
      eligible_branches: company.eligible_branches || [],
      eligible_batches: company.eligible_batches || [],
      required_skills: Array.isArray(company.required_skills) ? company.required_skills.join(', ') : '',
      is_active: company.is_active !== undefined ? company.is_active : true
    });
    setShowForm(true);
  };

  const handleToggleActive = async (company) => {
    try {
      await adminAPI.updateCompany(company.id, {
        is_active: !company.is_active
      });
      setSuccess(`Company ${!company.is_active ? 'activated' : 'deactivated'} successfully!`);
      fetchCompanies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update company status: ' + error.message);
    }
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This will also delete all associated job roles.')) return;

    try {
      await adminAPI.deleteCompany(companyId);
      setSuccess('Company deleted successfully!');
      fetchCompanies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete company: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await adminAuthAPI.logout();
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="loading">Loading companies...</div>;
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
            <h1>Manage Companies</h1>
            <button 
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              {showForm ? 'Cancel' : '+ Add New Company'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {showForm && (
            <div className="company-form-card">
              <h2>{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Industry *</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="IT Services, Product, FMCG, etc."
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Logo URL</label>
                    <input
                      type="url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Eligibility Criteria</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Minimum CGPA *</label>
                    <input
                      type="number"
                      name="min_cgpa"
                      value={formData.min_cgpa}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="10"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Active Backlogs</label>
                    <input
                      type="number"
                      name="max_active_backlogs"
                      value={formData.max_active_backlogs}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Total Backlogs</label>
                    <input
                      type="number"
                      name="max_total_backlogs"
                      value={formData.max_total_backlogs}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Eligible Branches * (Hold Ctrl/Cmd to select multiple)</label>
                    <select
                      multiple
                      value={formData.eligible_branches}
                      onChange={(e) => handleArrayChange(e, 'eligible_branches')}
                      style={{ height: '120px' }}
                      required
                    >
                      {branchOptions.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Selected: {formData.eligible_branches.join(', ') || 'None'}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Eligible Batches * (Hold Ctrl/Cmd to select multiple)</label>
                    <select
                      multiple
                      value={formData.eligible_batches}
                      onChange={(e) => handleArrayChange(e, 'eligible_batches')}
                      style={{ height: '120px' }}
                      required
                    >
                      {batchOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Selected: {formData.eligible_batches.join(', ') || 'None'}
                    </small>
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
                    {editingCompany ? 'Update Company' : 'Create Company'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="companies-grid">
            {companies.map(company => (
              <div key={company.id} className="company-card" style={{ 
                opacity: company.is_active ? 1 : 0.6,
                border: company.is_active ? '1px solid #ddd' : '1px solid #f99'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3>{company.name}</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: company.is_active ? '#d4edda' : '#f8d7da',
                    color: company.is_active ? '#155724' : '#721c24'
                  }}>
                    {company.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p>{company.description}</p>
                <div className="company-info">
                  <div className="info-item">
                    <strong>Industry:</strong> {company.industry}
                  </div>
                  <div className="info-item">
                    <strong>Min CGPA:</strong> {company.min_cgpa}
                  </div>
                  <div className="info-item">
                    <strong>Branches:</strong> {company.eligible_branches?.join(', ') || 'N/A'}
                  </div>
                  <div className="info-item">
                    <strong>Batches:</strong> {company.eligible_batches?.join(', ') || 'N/A'}
                  </div>
                </div>
                <div className="card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleEdit(company)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleActive(company)}
                    style={{
                      padding: '8px 16px',
                      background: company.is_active ? '#ffc107' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {company.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/job-roles?company=${company.id}`)}
                    className="btn-primary"
                  >
                    Manage Jobs
                  </button>
                  <button 
                    onClick={() => handleDelete(company.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {companies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No companies yet. Click "Add New Company" to create one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCompanies;
