/**
 * Camp-Event Associations Page.
 *
 * Allows admins to view and revoke camp-event associations.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAllAssociations, useRevokeAssociation, useCancelAssociationRejection } from '../../hooks/useAdmin';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';

function CampEventAssociations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || ''
  });
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: associationsData, isLoading, error } = useAllAssociations(filters);
  const revokeAssociationMutation = useRevokeAssociation();
  const cancelRejectionMutation = useCancelAssociationRejection();

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
    setSearchParams(params);
  };

  const handleRevokeClick = (association) => {
    setConfirmAction({
      type: 'revoke',
      association,
      title: 'Revoke Camp-Event Association',
      message: `Are you sure you want to revoke the association between "${association.camp.name}" and "${association.event.title}"?`
    });
  };

  const handleCancelRejectionClick = (association) => {
    setConfirmAction({
      type: 'cancel-rejection',
      association,
      title: 'Cancel Association Rejection',
      message: `Are you sure you want to cancel the rejection and revert "${association.camp.name}" for "${association.event.title}" back to pending status?`
    });
  };

  const handleConfirmAction = async (reason) => {
    if (!confirmAction) return;

    if (confirmAction.type === 'revoke') {
      await revokeAssociationMutation.mutateAsync({
        associationId: confirmAction.association.id,
        data: { reason }
      });
    } else if (confirmAction.type === 'cancel-rejection') {
      await cancelRejectionMutation.mutateAsync(confirmAction.association.id);
    }
  };

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {error.response?.data?.error || 'Failed to load associations. Please try again.'}
        </div>
      </div>
    );
  }

  const associations = associationsData?.data?.associations || [];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-link-45deg me-2"></i>Camp-Event Associations
        </h2>
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
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Associations Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : associations.length === 0 ? (
        <div className="alert alert-info">
          No associations found matching the current filters.
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Camp</th>
                  <th>Event</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {associations.map((association) => (
                  <tr key={association.id}>
                    <td>{association.camp.name}</td>
                    <td>{association.event.title}</td>
                    <td>{association.event.location}</td>
                    <td>
                      <StatusBadge status={association.status} type="association" />
                    </td>
                    <td>
                      {association.requested_at
                        ? new Date(association.requested_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {association.approved_at
                        ? new Date(association.approved_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {association.status === 'approved' ? (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRevokeClick(association)}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Revoke
                        </button>
                      ) : association.status === 'rejected' ? (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleCancelRejectionClick(association)}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1"></i>
                          Cancel Rejection
                        </button>
                      ) : (
                        <span className="text-muted small">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmActionModal
          show={true}
          onHide={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.type === 'revoke' ? 'Revoke' : 'Cancel Rejection'}
          confirmVariant={confirmAction.type === 'revoke' ? 'danger' : 'warning'}
          requireReason={confirmAction.type === 'revoke'}
          reasonLabel={confirmAction.type === 'revoke' ? 'Reason for revocation' : undefined}
        />
      )}
    </div>
  );
}

export default CampEventAssociations;
