import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { prepAPI, companiesAPI, auth } from '../services/api';

function CompanyPrep() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [prepData, setPrepData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrepData();
  }, [companyId]);

  const fetchPrepData = async () => {
    try {
      setLoading(true);
      const [companyData, prepInfo] = await Promise.all([
        companiesAPI.getById(companyId),
        prepAPI.getCompanyInfo(companyId)
      ]);
      
      setCompany(companyData);
      setPrepData(prepInfo);
    } catch (err) {
      setError('Failed to load preparation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (role) => {
    try {
      const data = await prepAPI.getInterviewQuestions(companyId, role);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleLogout = async () => {
    await auth.removeToken();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading preparation materials...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
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
        <div className="prep-container">
          <div className="dashboard-header">
            <h1>{company?.name} - Interview Preparation</h1>
            <p>Complete guide to crack your interview</p>
          </div>

          <div className="prep-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Interview Questions
        </button>
        <button 
          className={`tab ${activeTab === 'coding' ? 'active' : ''}`}
          onClick={() => setActiveTab('coding')}
        >
          Coding Patterns
        </button>
        <button 
          className={`tab ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          Tips & Tricks
        </button>
      </div>

          <div className="prep-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="info-card">
              <h3>Company Overview</h3>
              <p>{prepData?.overview || company?.description}</p>
            </div>

            <div className="info-card">
              <h3>Interview Process</h3>
              <ol className="process-list">
                {prepData?.interviewProcess?.map((step, idx) => (
                  <li key={idx}>
                    <strong>{step.name}</strong>
                    <p>{step.description}</p>
                  </li>
                )) || (
                  <>
                    <li><strong>Online Assessment</strong> - Coding test and aptitude</li>
                    <li><strong>Technical Interview</strong> - DSA and problem solving</li>
                    <li><strong>HR Round</strong> - Behavioral questions</li>
                  </>
                )}
              </ol>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <h4>Difficulty</h4>
                <span className="stat-value">{prepData?.difficulty || 'Medium'}</span>
              </div>
              <div className="stat-card">
                <h4>Avg Interview Duration</h4>
                <span className="stat-value">{prepData?.duration || '3-4 weeks'}</span>
              </div>
              <div className="stat-card">
                <h4>Selection Rate</h4>
                <span className="stat-value">{prepData?.selectionRate || '~15%'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="questions-section">
            <div className="questions-filter">
              <select onChange={(e) => fetchQuestions(e.target.value)} className="filter-select">
                <option value="">Select Role</option>
                <option value="software-engineer">Software Engineer</option>
                <option value="data-analyst">Data Analyst</option>
                <option value="product-manager">Product Manager</option>
              </select>
            </div>

            <div className="questions-list">
              {questions.length === 0 ? (
                <div className="sample-questions">
                  <h4>Common Technical Questions:</h4>
                  <ul>
                    <li>Tell me about yourself and your projects</li>
                    <li>Explain your most challenging project</li>
                    <li>How do you handle tight deadlines?</li>
                    <li>Describe a time you worked in a team</li>
                    <li>What are your strengths and weaknesses?</li>
                  </ul>

                  <h4>Technical Questions:</h4>
                  <ul>
                    <li>Explain difference between abstract class and interface</li>
                    <li>What is database normalization?</li>
                    <li>How does garbage collection work?</li>
                    <li>Explain REST API design principles</li>
                    <li>What is the difference between SQL and NoSQL?</li>
                  </ul>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <h4>{q.question}</h4>
                    <p className="question-hint">{q.hint}</p>
                    {q.answer && (
                      <details>
                        <summary>View Answer</summary>
                        <p>{q.answer}</p>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'coding' && (
          <div className="coding-section">
            <h3>Important Coding Patterns</h3>
            
            <div className="patterns-list">
              {prepData?.codingPatterns?.map((pattern, idx) => (
                <div key={idx} className="pattern-card">
                  <h4>{pattern.name}</h4>
                  <p>{pattern.description}</p>
                  <div className="pattern-problems">
                    <strong>Practice Problems:</strong>
                    <ul>
                      {pattern.problems?.map((problem, pidx) => (
                        <li key={pidx}>{problem}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )) || (
                <>
                  <div className="pattern-card">
                    <h4>Two Pointers</h4>
                    <p>Use two pointers to solve array/string problems efficiently</p>
                    <ul>
                      <li>Container with Most Water</li>
                      <li>Three Sum</li>
                      <li>Remove Duplicates from Sorted Array</li>
                    </ul>
                  </div>
                  <div className="pattern-card">
                    <h4>Sliding Window</h4>
                    <p>Maintain a window of elements and slide it to find optimal solution</p>
                    <ul>
                      <li>Maximum Sum Subarray</li>
                      <li>Longest Substring Without Repeating Characters</li>
                      <li>Minimum Window Substring</li>
                    </ul>
                  </div>
                  <div className="pattern-card">
                    <h4>Dynamic Programming</h4>
                    <p>Break problems into subproblems and build up solutions</p>
                    <ul>
                      <li>Climbing Stairs</li>
                      <li>House Robber</li>
                      <li>Longest Common Subsequence</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="tips-section">
            <div className="tip-card tip-success">
              <h4>✓ Do's</h4>
              <ul>
                <li>Research the company thoroughly</li>
                <li>Practice coding on a whiteboard</li>
                <li>Prepare STAR format answers</li>
                <li>Ask thoughtful questions</li>
                <li>Follow up with a thank you email</li>
              </ul>
            </div>

            <div className="tip-card tip-warning">
              <h4>✗ Don'ts</h4>
              <ul>
                <li>Don't speak negatively about past employers</li>
                <li>Don't give up on a problem too quickly</li>
                <li>Don't lie or exaggerate your skills</li>
                <li>Don't forget to test your code</li>
                <li>Don't arrive late for the interview</li>
              </ul>
            </div>

            <div className="resources-card">
              <h4>📚 Recommended Resources</h4>
              <ul>
                <li>LeetCode - Practice coding problems</li>
                <li>InterviewBit - Company-specific questions</li>
                <li>GeeksforGeeks - Technical concepts</li>
                <li>Glassdoor - Interview experiences</li>
                <li>YouTube - Mock interview videos</li>
              </ul>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyPrep;
