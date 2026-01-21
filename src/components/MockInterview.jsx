import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import supabase from '../services/supabase';

const MAX_QUESTIONS = 9;
const MAX_SESSIONS_PER_DAY = 3;

const MOCK_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why do you want to work in this field?",
  "What are your greatest strengths?",
  "Describe a challenging situation you faced and how you handled it.",
  "Where do you see yourself in 5 years?",
  "What motivates you in your work or studies?",
  "Tell me about a time when you worked in a team.",
  "What is your biggest weakness and how are you working on it?",
  "Why should we hire you?"
];

function MockInterview() {
  const navigate = useNavigate();
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    checkSessionLimit();
  }, []);

  const checkSessionLimit = async () => {
    try {
      const user = await auth.getUser();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count, error } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('started_at', today.toISOString())
        .lt('started_at', tomorrow.toISOString());

      if (error) throw error;
      setSessionCount(count || 0);
    } catch (error) {
      console.error('Error checking session limit:', error);
    }
  };

  const startInterview = async () => {
    try {
      const user = await auth.getUser();
      
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          conversation: [],
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      setShowStart(false);
      setShowChat(true);
      await askQuestion();
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Error starting interview. Please try again.');
    }
  };

  const askQuestion = async () => {
    if (questionCount >= MAX_QUESTIONS) {
      await endInterview();
      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      const question = MOCK_QUESTIONS[questionCount];
      const newMessage = {
        role: 'ai',
        content: question,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, newMessage]);
      setQuestionCount(prev => prev + 1);
      setIsTyping(false);
    }, 1500);
  };

  const sendAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const answerMessage = {
      role: 'user',
      content: currentAnswer,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, answerMessage]);
    setCurrentAnswer('');

    // Save to database
    try {
      await supabase
        .from('interview_sessions')
        .update({
          conversation: [...conversation, answerMessage]
        })
        .eq('id', currentSessionId);
    } catch (error) {
      console.error('Error saving answer:', error);
    }

    // Ask next question
    setTimeout(() => askQuestion(), 1000);
  };

  const endInterview = async () => {
    try {
      // Calculate simple results
      const avgResponseLength = Math.floor(
        conversation.filter(m => m.role === 'user')
          .reduce((sum, m) => sum + m.content.length, 0) / questionCount
      );

      const resultsData = {
        totalQuestions: questionCount,
        averageResponseLength: avgResponseLength,
        overallScore: Math.min(Math.floor((avgResponseLength / 100) * 10), 10),
        strengths: avgResponseLength > 150 ? ['Detailed responses', 'Good communication'] : ['Clear answers'],
        improvements: avgResponseLength < 100 ? ['Provide more detailed answers', 'Use specific examples'] : ['Keep up the good work']
      };

      await supabase
        .from('interview_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          results: resultsData
        })
        .eq('id', currentSessionId);

      setResults(resultsData);
      setShowChat(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error ending interview:', error);
    }
  };

  const resetInterview = () => {
    setConversation([]);
    setQuestionCount(0);
    setCurrentAnswer('');
    setCurrentSessionId(null);
    setShowStart(true);
    setShowChat(false);
    setShowResults(false);
    setResults(null);
    checkSessionLimit();
  };

  const handleLogout = async () => {
    await auth.removeToken();
    navigate('/login');
  };

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
            <li><Link to="/mock-interview" className="active">Mock Interview</Link></li>
            <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="interview-container">
          <div className="dashboard-header">
            <h1>AI Mock Interview</h1>
            <p>Practice HR questions with AI and get instant feedback</p>
          </div>

          {showStart && (
            <div className="start-screen">
              <div className="start-card">
                <h3>Ready to Practice?</h3>
                <p>The AI interviewer will ask you {MAX_QUESTIONS} common HR questions. Answer naturally and honestly. You'll receive feedback after the session.</p>

                <div className="interview-tips">
                  <h4>Tips for a Good Session:</h4>
                  <ul>
                    <li>Answer in 2-3 sentences minimum</li>
                    <li>Be specific and use examples</li>
                    <li>Stay professional but natural</li>
                    <li>Take your time to think before responding</li>
                  </ul>
                </div>

                <div className="session-limit">
                  <p><strong>Sessions today:</strong> {sessionCount} / {MAX_SESSIONS_PER_DAY}</p>
                </div>

                <button
                  className="btn-primary btn-large"
                  onClick={startInterview}
                  disabled={sessionCount >= MAX_SESSIONS_PER_DAY}
                >
                  {sessionCount >= MAX_SESSIONS_PER_DAY ? 'Daily Limit Reached' : 'Start Interview'}
                </button>
              </div>
            </div>
          )}

          {showChat && (
            <div className="chat-screen">
              <div className="chat-container">
                <div className="chat-header">
                  <h3>Interview in Progress - Question {questionCount}/{MAX_QUESTIONS}</h3>
                </div>

                <div className="chat-messages">
                  {conversation.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role === 'ai' ? 'ai-message' : 'user-message'}`}>
                      <div className="message-content">
                        <strong>{msg.role === 'ai' ? 'AI Interviewer' : 'You'}:</strong>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="message ai-message">
                      <div className="message-content">
                        <strong>AI Interviewer:</strong>
                        <p className="typing-indicator">Typing...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input-area">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows="4"
                    disabled={isTyping || questionCount >= MAX_QUESTIONS}
                  />
                  <div className="chat-actions">
                    <button
                      className="btn-primary"
                      onClick={sendAnswer}
                      disabled={!currentAnswer.trim() || isTyping}
                    >
                      Send Answer
                    </button>
                    <button
                      className="btn-danger"
                      onClick={endInterview}
                    >
                      End Interview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResults && results && (
            <div className="results-screen">
              <div className="results-card">
                <h3>Interview Complete! 🎉</h3>
                <p>Here's your performance summary:</p>

                <div className="results-grid">
                  <div className="result-item">
                    <h4>Questions Answered</h4>
                    <div className="result-value">{results.totalQuestions}</div>
                  </div>
                  <div className="result-item">
                    <h4>Overall Score</h4>
                    <div className="result-value">{results.overallScore}/10</div>
                  </div>
                  <div className="result-item">
                    <h4>Avg Response Length</h4>
                    <div className="result-value">{results.averageResponseLength} chars</div>
                  </div>
                </div>

                <div className="feedback-section">
                  <div className="strengths">
                    <h4>✓ Strengths</h4>
                    <ul>
                      {results.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="improvements">
                    <h4>→ Areas for Improvement</h4>
                    <ul>
                      {results.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="results-actions">
                  <button className="btn-primary" onClick={resetInterview}>
                    Start New Interview
                  </button>
                  <Link to="/dashboard" className="btn-secondary">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MockInterview;
