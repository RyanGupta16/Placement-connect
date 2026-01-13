import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companiesAPI, jobsAPI } from '../services/api';

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
      const [companyData, jobsData] = await Promise.all([
        companyId ? companiesAPI.getById(companyId) : Promise.resolve(null),
        companyId ? companiesAPI.getJobRoles(companyId) : jobsAPI.getAll()
      ]);
      
      setCompany(companyData);
      setJobs(jobsData.jobs || []);
    } catch (err) {
      setError('Failed to load job roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`);
  };

  if (loading) {
    return <div className="loading">Loading job roles...</div>;
  }

  return (
    <div className="jobs-container">
      <div className="page-header">
        {company ? (
          <>
            <button className="btn-back" onClick={() => navigate('/companies')}>
              ← Back to Companies
            </button>
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
          <div className="no-data">No job openings available</div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div>
                  <h3>{job.title}</h3>
                  {!company && <p className="job-company">{job.companyName}</p>}
                </div>
                <span className={`job-status status-${job.status?.toLowerCase()}`}>
                  {job.status || 'Active'}
                </span>
              </div>

              <div className="job-details">
                <div className="job-detail-item">
                  <span className="label">Location:</span>
                  <span>{job.location}</span>
                </div>
                <div className="job-detail-item">
                  <span className="label">Package:</span>
                  <span>{job.package}</span>
                </div>
                <div className="job-detail-item">
                  <span className="label">Experience:</span>
                  <span>{job.experience || 'Freshers'}</span>
                </div>
                <div className="job-detail-item">
                  <span className="label">Type:</span>
                  <span>{job.type || 'Full-time'}</span>
                </div>
              </div>

              <div className="job-description">
                <h4>Requirements:</h4>
                <p>{job.requirements || job.description}</p>
              </div>

              {job.skills && (
                <div className="job-skills">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              )}

              <div className="job-footer">
                <span className="job-deadline">
                  Apply by: {new Date(job.deadline).toLocaleDateString() || 'TBD'}
                </span>
                <button 
                  className="btn btn-primary"
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
  );
}

export default JobRoles;
