import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardClient from './pages/DashboardClient';
import DashboardAdmin from './pages/DashboardAdmin';
import DriverPortal from './pages/DriverPortal';
import BookAppointment from './pages/BookAppointment';
import Cart from './pages/Cart';
import FaceShapeGuide from './components/FaceShapeGuide';
import { useTheme } from './context/ThemeContext';

function ProtectedRoute({ children, adminOnly = false, driverOnly = false, clientOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (driverOnly && user.role !== 'driver') return <Navigate to="/" replace />;
  if (clientOnly && user.role === 'admin') return <Navigate to="/admin" replace />;
  if (clientOnly && user.role === 'driver') return <Navigate to="/driver" replace />;

  return children;
}

function AppRoutes() {
  const { isDark } = useTheme();

  return (
    <>
      <Navbar />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? 'dark' : 'light'}
        toastStyle={{
          background: isDark ? '#1a1a1e' : '#ffffff',
          color: isDark ? '#E8E8E9' : '#1a1a1a',
          border: `1px solid ${isDark ? 'rgba(212,175,55,0.2)' : '#e5e7eb'}`,
        }}
      />
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/face-guide" element={
          <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
            <FaceShapeGuide />
          </div>
        } />

        {/* Cart & Checkout - blocked for admin/driver roles */}
        <Route path="/cart" element={
          <ProtectedRoute clientOnly><Cart /></ProtectedRoute>
        } />

        {/* Appointments - blocked for admin/driver roles */}
        <Route path="/appointments" element={
          <ProtectedRoute clientOnly><BookAppointment /></ProtectedRoute>
        } />

        {/* Client Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardClient /></ProtectedRoute>
        } />

        {/* Admin Dashboard - admin only */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><DashboardAdmin /></ProtectedRoute>
        } />

        {/* Driver Portal - driver only */}
        <Route path="/driver" element={
          <ProtectedRoute driverOnly><DriverPortal /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <AppRoutes />
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </Router>
  );
}
