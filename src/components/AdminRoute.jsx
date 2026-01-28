import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAuthAPI } from '../services/api';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await adminAuthAPI.isAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    // Redirect non-admin users to admin login page
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
