import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Companies from './components/Companies';
import MyApplications from './components/MyApplications';
import ResumeChecker from './components/ResumeChecker';
import CompanyPrep from './components/CompanyPrep';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './components/AdminDashboard';
import ManageCompanies from './components/ManageCompanies';
import ViewApplicants from './components/ViewApplicants';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login setAuth={setIsAuthenticated} />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Register setAuth={setIsAuthenticated} />
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/companies" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Companies />
          </ProtectedRoute>
        } />
        
        <Route path="/my-applications" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MyApplications />
          </ProtectedRoute>
        } />
        
        <Route path="/resume-checker" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ResumeChecker />
          </ProtectedRoute>
        } />
        
        <Route path="/company-prep" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <CompanyPrep />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        <Route path="/admin/companies" element={
          <AdminRoute>
            <ManageCompanies />
          </AdminRoute>
        } />
        
        <Route path="/admin/companies/:id" element={
          <AdminRoute>
            <ManageCompanies />
          </AdminRoute>
        } />
        
        <Route path="/admin/applicants" element={
          <AdminRoute>
            <ViewApplicants />
          </AdminRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
