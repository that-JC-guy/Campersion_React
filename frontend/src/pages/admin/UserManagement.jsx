/**
 * User Management Page.
 *
 * Allows admins to view, filter, suspend, and reactivate users.
 * Global admins can also create new users.
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAllUsers, useSuspendUser, useReactivateUser, useDeleteUser } from '../../hooks/useAdmin';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';
import AddUserModal from './AddUserModal';
import { formatNameWithPronouns } from '../../utils/nameFormatter';

function UserManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    role: searchParams.get('role') || '',
    search: searchParams.get('search') || ''
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: usersData, isLoading, error } = useAllUsers(filters);
  const suspendUserMutation = useSuspendUser();
  const reactivateUserMutation = useReactivateUser();
  const deleteUserMutation = useDeleteUser();

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.role) params.set('role', newFilters.role);
    if (newFilters.search) params.set('search', newFilters.search);
    setSearchParams(params);
  };

  const handleSuspendClick = (user) => {
    setConfirmAction({
      type: 'suspend',
      user,
      title: 'Suspend User',
      message: `Are you sure you want to suspend ${user.name} (${user.email})? They will not be able to log in until reactivated.`,
      confirmText: 'Suspend',
      confirmVariant: 'danger'
    });
  };

  const handleReactivateClick = (user) => {
    setConfirmAction({
      type: 'reactivate',
      user,
      title: 'Reactivate User',
      message: `Are you sure you want to reactivate ${user.name} (${user.email})? They will be able to log in again.`,
      confirmText: 'Reactivate',
      confirmVariant: 'success'
    });
  };

  const handleDeleteClick = (user) => {
    setConfirmAction({
      type: 'delete',
      user,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete ${user.name} (${user.email})? This action cannot be undone and will remove all user data.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
      requireReason: false
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'suspend') {
      await suspendUserMutation.mutateAsync(confirmAction.user.id);
    } else if (confirmAction.type === 'reactivate') {
      await reactivateUserMutation.mutateAsync(confirmAction.user.id);
    } else if (confirmAction.type === 'delete') {
      await deleteUserMutation.mutateAsync(confirmAction.user.id);
    }
  };

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {error.response?.data?.error || 'Failed to load users. Please try again.'}
        </div>
      </div>
    );
  }

  const users = usersData?.data?.users || [];
  const isGlobalAdmin = currentUser?.role === 'global admin';

  return (
    <div className="container mt-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin">Admin</Link>
          </li>
          <li className="breadcrumb-item active">User Management</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-people me-2"></i>User Management
        </h2>
        {isGlobalAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddUserModal(true)}
          >
            <i className="bi bi-person-plus me-2"></i>
            Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="member">Member</option>
                <option value="camp manager">Camp Manager</option>
                <option value="event manager">Event Manager</option>
                <option value="site admin">Site Admin</option>
                <option value="global admin">Global Admin</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by email or name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info">
          No users found matching the current filters.
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{formatNameWithPronouns(user, { usePreferredName: false })}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={user.is_active} type="user" />
                    </td>
                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      {user.id === currentUser?.id ? (
                        <span className="text-muted small">You</span>
                      ) : user.is_active ? (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleSuspendClick(user)}
                        >
                          <i className="bi bi-person-x me-1"></i>
                          Suspend
                        </button>
                      ) : (
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleReactivateClick(user)}
                          >
                            <i className="bi bi-person-check me-1"></i>
                            Reactivate
                          </button>
                          {isGlobalAdmin && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        show={showAddUserModal}
        onHide={() => setShowAddUserModal(false)}
      />

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmActionModal
          show={true}
          onHide={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          confirmVariant={confirmAction.confirmVariant}
        />
      )}
    </div>
  );
}

export default UserManagement;
