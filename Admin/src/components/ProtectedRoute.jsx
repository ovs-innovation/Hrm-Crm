import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { canAccessRoute } from '../utils/roleAccess';

const ProtectedRoute = ({ children }) => {
  const adminInfo = useSelector((state) => state.auth.adminInfo);
  const location = useLocation();

  if (!adminInfo?._id && !adminInfo?.email) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessRoute(adminInfo.role, location.pathname)) {
    const role = (adminInfo.role || 'admin').toLowerCase();
    const fallback = role === 'hr' ? '/hrm/employees' : role === 'sales' ? '/crm/leads' : '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
