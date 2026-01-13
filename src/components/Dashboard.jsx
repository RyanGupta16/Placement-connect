import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const applications = await applicationsAPI.getMyApplications();
      setStats({
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        shortlistedApplications: applications.filter(app => app.status === 'shortlisted').length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
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
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Welcome to PlacementConnect</h1>
            <p>Your one-stop platform for placement preparation and applications</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Applications</h3>
              <div className="stat-value">{stats.totalApplications}</div>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <div className="stat-value">{stats.pendingApplications}</div>
            </div>
            <div className="stat-card">
              <h3>Shortlisted</h3>
              <div className="stat-value">{stats.shortlistedApplications}</div>
            </div>
          </div>

          <h2 style={{ marginBottom: '20px', color: '#667eea' }}>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/companies" className="action-btn">
              Browse Companies
            </Link>
            <Link to="/my-applications" className="action-btn">
              My Applications
            </Link>
            <Link to="/resume-checker" className="action-btn">
              Check Resume
            </Link>
            <Link to="/company-prep" className="action-btn">
              Prepare for Interview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
