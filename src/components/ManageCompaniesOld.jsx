import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../services/api';

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
    min_cgpa: '',
    max_active_backlogs: 0,
    max_total_backlogs: 0,
    eligible_branches: [],
    eligible_batches: [],
    required_skills: [],
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId) => {
    try {
      const data = await adminAPI.getCompanyById(companyId);
      setEditingCompany(data);
      setFormData({
        name: data.name,
        description: data.description,
        website: data.website,
        industry: data.industry,
        location: data.location
      });
    } catch (error) {
      setError('Failed to fetch company details');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCompany) {
        await adminAPI.updateCompany(editingCompany.id, formData);
        setSuccess('Company updated successfully!');
      } else {
        await adminAPI.createCompany(formData);
        setSuccess('Company created successfully!');
      }
      
      setFormData({ name: '', description: '', website: '', industry: '', location: '' });
      setEditingCompany(null);
      setShowForm(false);
      fetchCompanies();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to save company');
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description,
      website: company.website,
      industry: company.industry,
      location: company.location
    });
    setShowForm(true);
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      await adminAPI.deleteCompany(companyId);
      setSuccess('Company deleted successfully!');
      fetchCompanies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete company');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/admin" className="nav-brand">PlacementConnect Admin</Link>
          <ul className="nav-links">
            <li><Link to="/admin">Dashboard</Link></li>
            <li><Link to="/admin/companies">Manage Companies</Link></li>
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
                setShowForm(!showForm);
                setEditingCompany(null);
                setFormData({ name: '', description: '', website: '', industry: '', location: '' });
              }}
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              {showForm ? 'Cancel' : 'Add New Company'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {showForm && (
            <div className="company-form-card">
              <h2>{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
              <form onSubmit={handleSubmit}>
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
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  />
                </div>
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
                  <label>Industry *</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
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
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </form>
            </div>
          )}

          <div className="companies-grid">
            {companies.map(company => (
              <div key={company.id} className="company-card">
                <h3>{company.name}</h3>
                <p>{company.description}</p>
                <div className="company-info">
                  <div className="info-item">
                    <strong>Industry</strong>
                    {company.industry}
                  </div>
                  <div className="info-item">
                    <strong>Location</strong>
                    {company.location}
                  </div>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(company)}
                    className="btn-edit"
                  >
                    Edit
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
        </div>
      </div>
    </div>
  );
};

export default ManageCompanies;
