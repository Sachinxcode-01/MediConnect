import React, { useContext, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPassword from './pages/ForgotPassword';
import AIChatbot from './components/AIChatbot';
import { Toaster } from 'react-hot-toast';

// Lazy load dashboards for better initial load performance
const PatientDashboard = React.lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const VideoConsultation = React.lazy(() => import('./pages/VideoConsultation'));
const MedicalRecords = React.lazy(() => import('./pages/MedicalRecords'));

// Error Boundary for graceful error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-themeLight flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-3d border border-themeMedium/30 max-w-md text-center">
            <h1 className="text-3xl font-black text-themeDeep mb-4">Something went wrong</h1>
            <p className="text-themeDark/70 mb-6">Our systems encountered an unexpected error. Please try refreshing or contact support.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-themePrimary text-white rounded-xl font-bold shadow-neon hover:shadow-neon-hover transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-themeLight">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-themePrimary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-themeDeep font-black text-lg animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-themeLight">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-themePrimary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-themeDeep font-bold">Loading dashboard...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/patient/*" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <Suspense fallback={<LoadingFallback />}><PatientDashboard /></Suspense>
        </ProtectedRoute>
      } />

      <Route path="/doctor/*" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Suspense fallback={<LoadingFallback />}><DoctorDashboard /></Suspense>
        </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>
        </ProtectedRoute>
      } />

      <Route path="/telehealth" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor']}>
          <Suspense fallback={<LoadingFallback />}><VideoConsultation /></Suspense>
        </ProtectedRoute>
      } />

      <Route path="/records" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
          <Suspense fallback={<LoadingFallback />}><MedicalRecords /></Suspense>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <AIChatbot />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
