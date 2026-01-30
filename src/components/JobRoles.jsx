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
        
        // Fetch actual job roles from database
        const jobsData = await companiesAPI.getJobRoles(companyId);
        // Filter only active job roles
        const activeJobs = (jobsData || []).filter(job => job.is_active);
        setJobs(activeJobs);
      } else {
        // Fetch all jobs from API
        const jobsData = await jobsAPI.getAll();
        // Filter only active job roles
        const activeJobs = (jobsData || []).filter(job => job.is_active);
        setJobs(activeJobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job roles');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job) => {
    try {
      // Get current user profile
      const user = await auth.getUser();
      if (!user || !user.id) {
        alert('Please login to apply');
        navigate('/login');
        return;
      }

      // Check eligibility
      const userCGPA = user.cgpa || 0;
      const userActiveBacklogs = user.active_backlogs || 0;
      const userTotalBacklogs = user.total_backlogs || 0;
      const userBranch = user.branch || '';
      const userBatch = user.batch || 0;

      // Use job-specific criteria if available, otherwise use company criteria
      const minCGPA = job.min_cgpa || company?.min_cgpa || 0;
      const maxActiveBacklogs = company?.max_active_backlogs !== undefined ? company.max_active_backlogs : 999;
      const maxTotalBacklogs = company?.max_total_backlogs !== undefined ? company.max_total_backlogs : 999;
      const eligibleBranches = job.eligible_branches || company?.eligible_branches || [];
      const eligibleBatches = company?.eligible_batches || [];

      // Perform eligibility checks
      const eligibilityErrors = [];
      
      if (userCGPA < minCGPA) {
        eligibilityErrors.push(`Minimum CGPA required: ${minCGPA}, Your CGPA: ${userCGPA}`);
      }
      
      if (userActiveBacklogs > maxActiveBacklogs) {
        eligibilityErrors.push(`Maximum active backlogs allowed: ${maxActiveBacklogs}, You have: ${userActiveBacklogs}`);
      }
      
      if (userTotalBacklogs > maxTotalBacklogs) {
        eligibilityErrors.push(`Maximum total backlogs allowed: ${maxTotalBacklogs}, You have: ${userTotalBacklogs}`);
      }
      
      if (eligibleBranches.length > 0 && !eligibleBranches.includes(userBranch)) {
        eligibilityErrors.push(`Your branch (${userBranch}) is not eligible. Eligible branches: ${eligibleBranches.join(', ')}`);
      }
      
      if (eligibleBatches.length > 0 && !eligibleBatches.includes(userBatch)) {
        eligibilityErrors.push(`Your batch (${userBatch}) is not eligible. Eligible batches: ${eligibleBatches.join(', ')}`);
      }

      if (eligibilityErrors.length > 0) {
        alert('You are not eligible to apply for this role:\n\n' + eligibilityErrors.join('\n'));
        return;
      }

      // Apply to the job
      const confirmed = window.confirm(`Apply to ${job.title} at ${company?.name || ''}?`);
      if (!confirmed) return;

      await jobsAPI.apply(job.id, {
        resume_url: user.resume_url,
        cover_letter: ''
      });

      alert('Application submitted successfully!');
      fetchJobRoles(); // Refresh to show updated application status
    } catch (error) {
      console.error('Error applying:', error);
      alert(error.message || 'Failed to apply. Please try again.');
    }
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
                      <span>{job.location || 'Not specified'}</span>
                    </div>
                    {(job.package_min || job.package_max) && (
                      <div className="job-detail-item">
                        <span className="label">💰 Package:</span>
                        <span>
                          {job.package_min && job.package_max 
                            ? `${job.package_min} - ${job.package_max} LPA`
                            : job.package_min 
                            ? `${job.package_min}+ LPA`
                            : `Up to ${job.package_max} LPA`
                          }
                        </span>
                      </div>
                    )}
                    {job.min_cgpa && (
                      <div className="job-detail-item">
                        <span className="label">📊 Min CGPA:</span>
                        <span>{job.min_cgpa}</span>
                      </div>
                    )}
                    <div className="job-detail-item">
                      <span className="label">⏰ Type:</span>
                      <span>{job.job_type || 'Full-Time'}</span>
                    </div>
                    {job.total_positions && (
                      <div className="job-detail-item">
                        <span className="label">👥 Positions:</span>
                        <span>{job.total_positions}</span>
                      </div>
                    )}
                  </div>

                  <div className="job-description">
                    <h4>Job Description:</h4>
                    <p>{job.description || 'No description available'}</p>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="job-skills">
                      <strong>Required Skills:</strong>
                      {job.required_skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}
                  
                  {job.eligible_branches && job.eligible_branches.length > 0 && (
                    <div className="job-skills" style={{marginTop: '10px'}}>
                      <strong>Eligible Branches:</strong>
                      {job.eligible_branches.map((branch, idx) => (
                        <span key={idx} className="skill-tag" style={{background: '#e3f2fd'}}>{branch}</span>
                      ))}
                    </div>
                  )}

                  <div className="job-footer">
                    {job.registration_end_date && (
                      <span className="job-deadline">
                        📅 Apply by: {new Date(job.registration_end_date).toLocaleDateString()}
                      </span>
                    )}
                    <button 
                      className="btn-primary"
                      onClick={() => handleApply(job)}
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

