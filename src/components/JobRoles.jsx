import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { companiesAPI, jobsAPI, auth } from '../services/api';

function JobRoles() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobRoles();
  }, [companyId]);

  const fetchJobRoles = async () => {
    try {
      setLoading(true);
      
      if (companyId) {
        // Fetch company-specific jobs
        const companyData = await companiesAPI.getById(companyId);
        setCompany(companyData);
        
        // For now, create sample jobs if none exist
        const sampleJobs = [
          {
            id: 1,
            title: 'Software Engineer',
            location: companyData.location || 'Multiple Locations',
            package: '10-15 LPA',
            experience: 'Freshers',
            type: 'Full-time',
            requirements: 'Strong programming skills in Java/Python, understanding of DSA, good communication',
            skills: ['Java', 'Python', 'DSA', 'SQL'],
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'Active'
          },
          {
            id: 2,
            title: 'Data Analyst',
            location: companyData.location || 'Bangalore',
            package: '8-12 LPA',
            experience: 'Freshers',
            type: 'Full-time',
            requirements: 'Proficiency in SQL, Excel, data visualization tools like Tableau/Power BI',
            skills: ['SQL', 'Excel', 'Tableau', 'Python'],
            deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            status: 'Active'
          }
        ];
        setJobs(sampleJobs);
      } else {
        // Fetch all jobs from API
        const jobsData = await jobsAPI.getAll();
        setJobs(jobsData || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job roles');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId) => {
    // For now, just show alert - can be extended to actual application
    alert('Application feature coming soon! Job ID: ' + jobId);
  };

  const handleLogout = async () => {
    await auth.removeToken();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading job roles...</div>;
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
        <div className="jobs-container">
          <div className="dashboard-header">
            {company ? (
              <>
                <Link to="/companies" className="back-link">← Back to Companies</Link>
                <h1>{company.name} - Job Openings</h1>
                <p>{company.description}</p>
              </>
            ) : (
              <>
                <h1>All Job Roles</h1>
                <p>Browse all available opportunities</p>
              </>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="jobs-list">
            {jobs.length === 0 ? (
              <div className="no-data">
                <p>No job openings available at the moment</p>
                <Link to="/companies" className="btn-primary">Browse Companies</Link>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div>
                      <h3>{job.title}</h3>
                      {!company && job.company_name && (
                        <p className="job-company">{job.company_name}</p>
                      )}
                    </div>
                    <span className={`job-status status-active`}>
                      {job.status || 'Active'}
                    </span>
                  </div>

                  <div className="job-details">
                    <div className="job-detail-item">
                      <span className="label">📍 Location:</span>
                      <span>{job.location}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="label">💰 Package:</span>
                      <span>{job.package}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="label">📊 Experience:</span>
                      <span>{job.experience || 'Freshers'}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="label">⏰ Type:</span>
                      <span>{job.type || 'Full-time'}</span>
                    </div>
                  </div>

                  <div className="job-description">
                    <h4>Requirements:</h4>
                    <p>{job.requirements || job.description}</p>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="job-skills">
                      <strong>Required Skills:</strong>
                      {job.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="job-footer">
                    <span className="job-deadline">
                      📅 Apply by: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                    <button 
                      className="btn-primary"
                      onClick={() => handleApply(job.id)}
                      disabled={job.applied}
                    >
                      {job.applied ? 'Already Applied' : 'Apply Now'}
                    </button>
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

export default JobRoles;

