import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import Dashboard from './components/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-[#00E5FF]">Verifying session...</div>;
  }

  const localUser = localStorage.getItem("market_matrix_user") || localStorage.getItem("user");

  if (!user && !localUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AppContent = () => {
  const [appLoading, setAppLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      setTimeout(() => {
        setAppLoading(false);
      }, 500);
    }
  }, [authLoading]);

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00E5FF]/10 rounded-full blur-[40px] animate-pulse"></div>
        <div className="text-[#00E5FF] font-medium tracking-wider animate-pulse relative z-10 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-[#00E5FF]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          INITIALIZING TERMINAL...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="dashboard-container">
              <Dashboard />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
