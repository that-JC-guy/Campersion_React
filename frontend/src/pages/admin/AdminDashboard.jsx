/**
 * Admin Dashboard Page.
 *
 * Main landing page for admin area showing statistics and quick links.
 */

import { Link } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useAdmin';
import StatsCard from '../../components/admin/StatsCard';

function AdminDashboard() {
  const { data: statsData, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {error.response?.data?.error || 'Failed to load admin dashboard. Please try again.'}
        </div>
      </div>
    );
  }

  const stats = statsData?.data || {};

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-shield-lock me-2"></i>Admin Dashboard
        </h2>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <StatsCard
            title="Total Users"
            value={stats.total_users || 0}
            icon="bi-people"
            color="primary"
            link="/admin/users?status=all"
          />
        </div>
        <div className="col-md-4 mb-3">
          <StatsCard
            title="Active Users"
            value={stats.active_users || 0}
            icon="bi-person-check"
            color="success"
            link="/admin/users?status=active"
          />
        </div>
        <div className="col-md-4 mb-3">
          <StatsCard
            title="Suspended Users"
            value={stats.suspended_users || 0}
            icon="bi-person-x"
            color="danger"
            link="/admin/users?status=suspended"
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <StatsCard
            title="Pending Events"
            value={stats.pending_events || 0}
            icon="bi-calendar-event"
            color="warning"
            link="/admin/events?status=pending"
          />
        </div>
        <div className="col-md-6 mb-3">
          <StatsCard
            title="Pending Camp Associations"
            value={stats.pending_associations || 0}
            icon="bi-link-45deg"
            color="info"
            link="/admin/associations?status=pending"
          />
        </div>
      </div>

      {/* Quick Links */}
      <h4 className="mb-3">Quick Links</h4>
      <div className="row">
        <div className="col-md-4 mb-3">
          <Link to="/admin/users" className="text-decoration-none">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-people" style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
                <h5 className="card-title mt-3">User Management</h5>
                <p className="card-text text-muted">
                  View, create, suspend, and reactivate user accounts
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4 mb-3">
          <Link to="/admin/events" className="text-decoration-none">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-calendar-event" style={{ fontSize: '3rem', color: '#ffc107' }}></i>
                <h5 className="card-title mt-3">Event Management</h5>
                <p className="card-text text-muted">
                  Review and change event approval status
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4 mb-3">
          <Link to="/admin/associations" className="text-decoration-none">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center">
                <i className="bi bi-link-45deg" style={{ fontSize: '3rem', color: '#0dcaf0' }}></i>
                <h5 className="card-title mt-3">Camp-Event Associations</h5>
                <p className="card-text text-muted">
                  Manage camp-event associations and revoke approvals
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
