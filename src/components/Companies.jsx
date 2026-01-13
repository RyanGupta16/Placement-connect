import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { companiesAPI, auth } from '../services/api';

function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    sector: '',
    location: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companiesAPI.getAll(filters);
      setCompanies(data.companies || []);
    } catch (err) {
      setError('Failed to load companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  const viewCompanyDetails = (companyId) => {
    navigate(`/companies/${companyId}/jobs`);
  };

  const handleLogout = async () => {
    await auth.removeToken();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/dashboard" className="nav-brand">PlacementConnect</Link>
          <ul className="nav-links">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/companies">Companies</Link></li>
            <li><Link to="/my-applications">My Applications</Link></li>
            <li><Link to="/resume-checker">Resume Checker</Link></li>
            <li><Link to="/company-prep">Company Prep</Link></li>
            <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="companies-container">
          <div className="dashboard-header">
            <h1>Browse Companies</h1>
            <p>Explore top companies hiring through campus placements</p>
          </div>

          <div className="filters-section">
            <form onSubmit={handleSearch} className="filters-form">
              <input
                type="text"
                name="search"
                placeholder="Search companies..."
                value={filters.search}
                onChange={handleFilterChange}
                className="search-input"
              />
              
              <select
                name="sector"
                value={filters.sector}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Sectors</option>
                <option value="IT">IT/Software</option>
                <option value="Finance">Finance</option>
                <option value="Consulting">Consulting</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Healthcare">Healthcare</option>
              </select>

              <select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Locations</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi/NCR</option>
                <option value="Pune">Pune</option>
              </select>

              <button type="submit" className="btn-primary">Search</button>
            </form>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="companies-grid">
            {companies.length === 0 ? (
              <div className="no-data">No companies found</div>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="company-card">
                  <div className="company-logo">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} />
                    ) : (
                      <div className="logo-placeholder">{company.name.charAt(0)}</div>
                    )}
                  </div>
                  
                  <div className="company-info">
                    <h3>{company.name}</h3>
                    <p className="company-sector">{company.sector}</p>
                    <p className="company-description">{company.description}</p>
                    
                    <div className="company-stats">
                      <span className="stat">
                        <strong>{company.openRoles || 0}</strong> Open Roles
                      </span>
                      <span className="stat">
                        <strong>{company.avgPackage || 'N/A'}</strong> Avg. Package
                      </span>
                    </div>

                    <div className="company-tags">
                      {company.locations?.map((loc, idx) => (
                        <span key={idx} className="tag">{loc}</span>
                      ))}
                    </div>
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={() => viewCompanyDetails(company.id)}
                  >
                    View Openings
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Companies;
