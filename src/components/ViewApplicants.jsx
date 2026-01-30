import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, adminAuthAPI } from '../services/api';

const ViewApplicants = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({
    company: '',
    role: '',
    status: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const companiesData = await adminAPI.getCompanies();
      setCompanies(companiesData);
      
      if (companiesData.length > 0) {
        const rolesData = await adminAPI.getRolesByCompany(companiesData[0].id);
        setRoles(rolesData);
      }
      
      await fetchApplicants();
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    try {
      const data = await adminAPI.getApplicants(filters);
      setApplicants(data);
    } catch (error) {
      setError('Failed to fetch applicants');
    }
  };

  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    
    // If company changes, fetch roles for that company
    if (name === 'company' && value) {
      try {
        const rolesData = await adminAPI.getRolesByCompany(value);
        setRoles(rolesData);
        newFilters.role = ''; // Reset role filter
      } catch (error) {
        console.error('Failed to fetch roles');
      }
    }
    
    setFilters(newFilters);
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(applicationId, newStatus);
      setSuccess('Status updated successfully!');
      fetchApplicants();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExportToExcel = async () => {
    if (!filters.company && !filters.role) {
      setError('Please select a company or job role to export');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setExporting(true);
      setError('');
      
      const exportParams = {};
      if (filters.role) {
        exportParams.job_role_id = filters.role;
      } else if (filters.company) {
        exportParams.company_id = filters.company;
      }

      console.log('Exporting with params:', exportParams);

      const result = await adminAuthAPI.exportApplicantsToExcel(exportParams);
      
      setSuccess(`Successfully downloaded ${result.filename}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setError(error.message || 'Failed to export applicants. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setExporting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading applicants...</div>;
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
            <h1>View Applicants</h1>
            <p>Review applications and update status</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="filters-section" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Filter by Company</label>
                <select 
                name="company" 
                value={filters.company} 
                onChange={handleFilterChange}
              >
                <option value="">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Filter by Role</label>
              <select 
                name="role" 
                value={filters.role} 
                onChange={handleFilterChange}
                disabled={!filters.company}
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Filter by Status</label>
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <button 
                onClick={handleExportToExcel}
                className="btn-primary"
                disabled={exporting || (!filters.company && !filters.role)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: exporting ? '#ccc' : '#4caf50',
                  cursor: exporting || (!filters.company && !filters.role) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  borderRadius: '5px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
                title={(!filters.company && !filters.role) ? 'Select a company or role to export' : 'Export to Excel'}
              >
                {exporting ? (
                  <>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Export to Excel</span>
                  </>
                )}
              </button>
            </div>
            </div>
          </div>

          <div className="applicants-table-container"
            style={{ marginTop: '20px' }}
          >
            <table className="applicants-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Resume Score</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                      No applicants found
                    </td>
                  </tr>
                ) : (
                  applicants.map(applicant => (
                    <tr key={applicant.id}>
                      <td><strong>{applicant.student_name}</strong></td>
                      <td>{applicant.email}</td>
                      <td>{applicant.company_name}</td>
                      <td>{applicant.role_title}</td>
                      <td>
                        {applicant.resume_score ? (
                          <span 
                            className="score-indicator"
                            style={{ 
                              color: getScoreColor(applicant.resume_score),
                              fontWeight: 'bold'
                            }}
                          >
                            {applicant.resume_score}%
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>N/A</span>
                        )}
                      </td>
                      <td>{new Date(applicant.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge status-${applicant.status}`}>
                          {applicant.status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={applicant.status}
                          onChange={(e) => handleStatusUpdate(applicant.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {applicants.length > 0 && (
            <div className="applicants-summary">
              <h3>Summary</h3>
              <p>Total Applicants: <strong>{applicants.length}</strong></p>
              <p>Average Resume Score: <strong>
                {Math.round(
                  applicants.reduce((sum, app) => sum + (app.resume_score || 0), 0) / 
                  applicants.filter(app => app.resume_score).length
                )}%
              </strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewApplicants;
