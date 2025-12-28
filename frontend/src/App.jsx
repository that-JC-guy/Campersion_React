/**
 * Main App Component.
 *
 * Sets up React Router with all application routes including
 * public routes (auth) and protected routes (dashboard, profile, etc.)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthCallback from './pages/auth/OAuthCallback';

// Protected components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import InventoryList from './pages/inventory/InventoryList';

// Profile pages
import ViewProfile from './pages/profile/ViewProfile';
import EditProfile from './pages/profile/EditProfile';
import ChangeEmail from './pages/profile/ChangeEmail';
import VerifyEmailChange from './pages/profile/VerifyEmailChange';

// Event pages
import EventsList from './pages/events/EventsList';
import EventDetail from './pages/events/EventDetail';
import EventForm from './pages/events/EventForm';

// Camp pages
import CampsList from './pages/camps/CampsList';
import CampDetail from './pages/camps/CampDetail';
import CampForm from './pages/camps/CampForm';
import MyCamps from './pages/camps/MyCamps';

// Placeholder for dashboard
function Dashboard() {
  return (
    <div className="container mt-4">
      <h2>Dashboard</h2>
      <p>Welcome! Authentication is working. Check out your inventory page to see the full CRUD functionality.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verify-email-change/:token" element={<VerifyEmailChange />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Feature routes */}
          <Route path="profile" element={<ViewProfile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="profile/change-email" element={<ChangeEmail />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="my-camps" element={<MyCamps />} />
          <Route path="events" element={<EventsList />} />
          <Route path="events/create" element={<EventForm />} />
          <Route path="events/:eventId" element={<EventDetail />} />
          <Route path="events/:eventId/edit" element={<EventForm />} />
          <Route path="camps" element={<CampsList />} />
          <Route path="camps/create" element={<CampForm />} />
          <Route path="camps/:campId" element={<CampDetail />} />
          <Route path="camps/:campId/edit" element={<CampForm />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
