import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Decode JWT to check role
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role === 'admin');
      } catch (error) {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
