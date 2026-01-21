import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsAPI, auth } from '../services/api';

function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationsAPI.getMyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      await applicationsAPI.withdraw(applicationId);
      setApplications(applications.filter(app => app.id !== applicationId));
    } catch (err) {
      alert('Failed to withdraw application');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'applied': 'blue',
      'under_review': 'orange',
      'shortlisted': 'green',
      'interview_scheduled': 'purple',
      'selected': 'success',
      'rejected': 'red',
      'withdrawn': 'gray'
    };
    return statusMap[status?.toLowerCase()] || 'gray';
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status?.toLowerCase() === filter;
  });

  const handleLogout = async () => {
    await auth.removeToken();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading your applications...</div>;
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
            <li><Link to="/mock-interview">Mock Interview</Link></li>
            <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="applications-container">
          <div className="dashboard-header">
            <h1>My Applications</h1>
            <p>Track your job applications and their status</p>
          </div>

          <div className="applications-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({applications.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'applied' ? 'active' : ''}`}
              onClick={() => setFilter('applied')}
            >
              Applied
            </button>
            <button 
              className={`filter-btn ${filter === 'shortlisted' ? 'active' : ''}`}
              onClick={() => setFilter('shortlisted')}
            >
              Shortlisted
            </button>
            <button 
              className={`filter-btn ${filter === 'selected' ? 'active' : ''}`}
              onClick={() => setFilter('selected')}
            >
              Selected
            </button>
            <button 
              className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="applications-list">
            {filteredApplications.length === 0 ? (
              <div className="no-data">
                {filter === 'all' ? (
                  <>
                    <p>You haven't applied to any jobs yet</p>
                    <button className="btn-primary" onClick={() => navigate('/companies')}>
                      Browse Companies
                    </button>
                  </>
                ) : (
                  <p>No applications with status: {filter}</p>
                )}
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <div className="application-company">
                      <h3>{app.jobTitle}</h3>
                      <p>{app.companyName}</p>
                    </div>
                    <span className={`status-badge status-${getStatusColor(app.status)}`}>
                      {app.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="application-details">
                    <div className="detail-item">
                      <span className="label">Applied On:</span>
                      <span>{new Date(app.appliedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Location:</span>
                      <span>{app.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Package:</span>
                      <span>{app.package}</span>
                    </div>
                  </div>

                  {app.interviewDate && (
                    <div className="interview-info">
                      <strong>Interview Scheduled:</strong> {new Date(app.interviewDate).toLocaleString()}
                    </div>
                  )}

                  {app.feedback && (
                    <div className="feedback-section">
                      <strong>Feedback:</strong>
                      <p>{app.feedback}</p>
                    </div>
                  )}

                  <div className="application-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => navigate(`/company-prep/${app.companyId}`)}
                    >
                      Prepare for Interview
                    </button>
                    {(app.status === 'applied' || app.status === 'under_review') && (
                      <button 
                        className="btn-danger"
                        onClick={() => handleWithdraw(app.id)}
                      >
                        Withdraw Application
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyApplications;
