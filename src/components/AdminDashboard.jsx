import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, adminAuthAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalStudents: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, applicationsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentApplications(5)
      ]);
      setStats(statsData);
      setRecentApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminAuthAPI.logout();
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/admin" className="nav-brand">PlacementConnect Admin</Link>
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
            <h1>Admin Dashboard</h1>
            <p>Manage companies, applications, and students</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Companies</h3>
              <div className="stat-value">{stats.totalCompanies}</div>
            </div>
            <div className="stat-card">
              <h3>Total Applications</h3>
              <div className="stat-value">{stats.totalApplications}</div>
            </div>
            <div className="stat-card">
              <h3>Pending Reviews</h3>
              <div className="stat-value">{stats.pendingApplications}</div>
            </div>
            <div className="stat-card">
              <h3>Registered Students</h3>
              <div className="stat-value">{stats.totalStudents}</div>
            </div>
          </div>

          <div className="quick-actions">
            <Link to="/admin/companies" className="action-btn">
              Manage Companies
            </Link>
            <Link to="/admin/applicants" className="action-btn">
              View Applicants
            </Link>
            <Link to="/admin/companies/new" className="action-btn">
              Add New Company
            </Link>
          </div>

          <div className="recent-section">
            <h2>Recent Applications</h2>
            <div className="applications-list">
              {recentApplications.map(app => (
                <div key={app.id} className="application-card">
                  <div className="application-info">
                    <h3>{app.student_name}</h3>
                    <p>{app.company_name} - {app.role_title}</p>
                    <small>Applied: {new Date(app.applied_at).toLocaleDateString()}</small>
                  </div>
                  <div>
                    <span className={`status-badge status-${app.status}`}>
                      {app.status}
                    </span>
                    {app.resume_score && (
                      <div className="score-badge">
                        Score: {app.resume_score}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
