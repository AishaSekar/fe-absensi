import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/user/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

interface User {
  role: 'admin' | 'peserta';
}

// Inner component that has access to useNavigate (must be inside <Router>)
function AppRoutes() {
  const navigate = useNavigate();

  // Listen for 401 unauthorized events from the API interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="peserta">
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedRoute({
  children,
  allowedRole
}: {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'peserta';
}) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userStr) {
    try {
      const user: User = JSON.parse(userStr);

      if (user.role !== allowedRole) {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        return <Navigate to={redirectPath} replace />;
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user: User = JSON.parse(userStr);

      if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
