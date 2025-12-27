/**
 * Camp Detail Page.
 *
 * Displays camp details including:
 * - Amenities and capacity
 * - Shared inventory from members
 * - Member management (for managers)
 * - Event associations
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useCamp,
  useRequestCampMembership,
  useApproveCampMember,
  useRejectCampMember,
  usePromoteCampMember,
  useDemoteCampManager,
  useRequestEventAssociation
} from '../../hooks/useCamps';
import { useAuth } from '../../contexts/AuthContext';

function CampDetail() {
  const { campId } = useParams();
  const { data: camp, isLoading, error } = useCamp(parseInt(campId));
  const { user } = useAuth();

  const requestMembershipMutation = useRequestCampMembership();
  const approveMemberMutation = useApproveCampMember();
  const rejectMemberMutation = useRejectCampMember();
  const promoteMutation = usePromoteCampMember();
  const demoteMutation = useDemoteCampManager();
  const requestEventMutation = useRequestEventAssociation();

  const [selectedEvent, setSelectedEvent] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRequestMembership = () => {
    if (window.confirm('Request to join this camp?')) {
      requestMembershipMutation.mutate(parseInt(campId));
    }
  };

  const handleApproveMember = (userId, userName) => {
    if (window.confirm(`Approve ${userName}'s membership?`)) {
      approveMemberMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleRejectMember = (userId, userName) => {
    if (window.confirm(`Reject ${userName}'s membership request?`)) {
      rejectMemberMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handlePromote = (userId, userName) => {
    if (window.confirm(`Promote ${userName} to camp manager?`)) {
      promoteMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleDemote = (userId, userName) => {
    if (window.confirm(`Demote ${userName} to regular member?`)) {
      demoteMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleRequestEvent = () => {
    if (!selectedEvent) return;
    if (window.confirm('Request to join this event?')) {
      requestEventMutation.mutate(
        { campId: parseInt(campId), eventId: parseInt(selectedEvent) },
        {
          onSuccess: () => setSelectedEvent('')
        }
      );
    }
  };

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
          {error.response?.data?.error || 'Failed to load camp. Please try again.'}
        </div>
        <Link to="/camps" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to Camps
        </Link>
      </div>
    );
  }

  if (!camp) return null;

  const isManager = camp.user_membership?.role === 'manager';
  const isMember = camp.user_membership?.status === 'approved';
  const isPending = camp.user_membership?.status === 'pending';
  const canManage = isManager || (user && ['site_admin', 'global_admin'].includes(user.role));

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-flag me-2"></i>{camp.name}</h2>
        <div className="btn-group">
          <Link to="/camps" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
          {user && camp.creator_id === user.id && (
            <Link to={`/camps/${campId}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
        </div>
      </div>

      {/* Membership Actions */}
      {user && !isMember && !isPending && (
        <div className="alert alert-info">
          <button
            className="btn btn-primary"
            onClick={handleRequestMembership}
            disabled={requestMembershipMutation.isPending}
          >
            <i className="bi bi-person-plus me-2"></i>
            Request to Join Camp
          </button>
        </div>
      )}

      {isPending && (
        <div className="alert alert-warning">
          <i className="bi bi-clock me-2"></i>
          Your membership request is pending approval.
        </div>
      )}

      {/* Camp Details */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Camp Details</h5>
        </div>
        <div className="card-body">
          {camp.description && (
            <div className="row mb-3">
              <div className="col-md-3 fw-bold">Description:</div>
              <div className="col-md-9">{camp.description}</div>
            </div>
          )}

          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Capacity:</div>
            <div className="col-md-9">
              <i className="bi bi-house me-2"></i>
              {camp.max_sites || 'N/A'} sites
              <span className="ms-3">
                <i className="bi bi-people me-2"></i>
                {camp.max_people || 'N/A'} people
              </span>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Amenities:</div>
            <div className="col-md-9">
              {camp.has_communal_kitchen && <span className="badge bg-success me-1 mb-1">Communal Kitchen</span>}
              {camp.has_communal_space && <span className="badge bg-success me-1 mb-1">Common Space</span>}
              {camp.has_art_exhibits && <span className="badge bg-success me-1 mb-1">Art Exhibits</span>}
              {camp.has_member_activities && <span className="badge bg-success me-1 mb-1">Member Activities</span>}
              {camp.has_non_member_activities && <span className="badge bg-success me-1 mb-1">Public Activities</span>}
              {camp.custom_amenities && (
                <div className="mt-1">
                  <small className="text-muted">{camp.custom_amenities}</small>
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-3 fw-bold">Created:</div>
            <div className="col-md-9">{formatDate(camp.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Shared Inventory */}
      {camp.shared_inventory && camp.shared_inventory.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-box me-2"></i>Shared Inventory</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Total Quantity</th>
                    <th>Owners</th>
                  </tr>
                </thead>
                <tbody>
                  {camp.shared_inventory.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <div className="small text-muted">{item.description}</div>
                        )}
                      </td>
                      <td>{item.total_quantity}</td>
                      <td><small className="text-muted">{item.owners}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Members - Only show to members */}
      {(isMember || canManage) && camp.members && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>Members
              {canManage && camp.pending_member_count > 0 && (
                <span className="badge bg-warning text-dark ms-2">{camp.pending_member_count} Pending</span>
              )}
            </h5>
          </div>
          <div className="card-body">
            {/* Managers */}
            {camp.members.managers && camp.members.managers.length > 0 && (
              <>
                <h6 className="text-primary">Managers</h6>
                <div className="list-group mb-3">
                  {camp.members.managers.map((member) => (
                    <div key={member.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{member.user.name}</strong>
                          <br />
                          <small className="text-muted">{member.user.email}</small>
                        </div>
                        {canManage && member.user.id !== user?.id && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleDemote(member.user.id, member.user.name)}
                            disabled={demoteMutation.isPending}
                          >
                            <i className="bi bi-arrow-down-circle me-1"></i>Demote
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Regular Members */}
            {camp.members.regular_members && camp.members.regular_members.length > 0 && (
              <>
                <h6 className="text-success">Members</h6>
                <div className="list-group mb-3">
                  {camp.members.regular_members.map((member) => (
                    <div key={member.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{member.user.name}</strong>
                          <br />
                          <small className="text-muted">{member.user.email}</small>
                        </div>
                        {canManage && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handlePromote(member.user.id, member.user.name)}
                            disabled={promoteMutation.isPending}
                          >
                            <i className="bi bi-arrow-up-circle me-1"></i>Promote
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pending Members */}
            {canManage && camp.members.pending && camp.members.pending.length > 0 && (
              <>
                <h6 className="text-warning">Pending Requests</h6>
                <div className="list-group">
                  {camp.members.pending.map((member) => (
                    <div key={member.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{member.user.name}</strong>
                          <br />
                          <small className="text-muted">{member.user.email}</small>
                        </div>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveMember(member.user.id, member.user.name)}
                            disabled={approveMemberMutation.isPending}
                          >
                            <i className="bi bi-check-circle me-1"></i>Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectMember(member.user.id, member.user.name)}
                            disabled={rejectMemberMutation.isPending}
                          >
                            <i className="bi bi-x-circle me-1"></i>Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Event Associations - For managers */}
      {canManage && camp.event_associations && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-calendar-event me-2"></i>Event Associations</h5>
          </div>
          <div className="card-body">
            {/* Request Event Form */}
            {camp.available_events && camp.available_events.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-bold">Request to Join Event</label>
                <div className="input-group">
                  <select
                    className="form-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                  >
                    <option value="">Select an event...</option>
                    {camp.available_events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {formatDate(event.start_date)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleRequestEvent}
                    disabled={!selectedEvent || requestEventMutation.isPending}
                  >
                    Request
                  </button>
                </div>
              </div>
            )}

            {/* Approved Events */}
            {camp.event_associations.approved && camp.event_associations.approved.length > 0 && (
              <>
                <h6 className="text-success">Approved Events</h6>
                <div className="list-group mb-3">
                  {camp.event_associations.approved.map((assoc) => (
                    <div key={assoc.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{assoc.event.title}</strong>
                          <br />
                          <small className="text-muted">
                            {formatDate(assoc.event.start_date)} - {formatDate(assoc.event.end_date)}
                          </small>
                          {assoc.location && (
                            <p className="mb-0 mt-1">
                              <i className="bi bi-geo-alt me-1"></i>
                              <small>Location: {assoc.location}</small>
                            </p>
                          )}
                        </div>
                        <span className="badge bg-success">Approved</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pending Events */}
            {camp.event_associations.pending && camp.event_associations.pending.length > 0 && (
              <>
                <h6 className="text-warning">Pending Requests</h6>
                <div className="list-group mb-3">
                  {camp.event_associations.pending.map((assoc) => (
                    <div key={assoc.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{assoc.event.title}</strong>
                          <br />
                          <small className="text-muted">
                            {formatDate(assoc.event.start_date)} - {formatDate(assoc.event.end_date)}
                          </small>
                        </div>
                        <span className="badge bg-warning text-dark">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {camp.event_associations.approved?.length === 0 &&
             camp.event_associations.pending?.length === 0 &&
             camp.event_associations.rejected?.length === 0 && (
              <p className="text-muted mb-0">No event associations yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Public Event List - For approved events, non-managers */}
      {!canManage && camp.event_associations?.approved && camp.event_associations.approved.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-calendar-event me-2"></i>Participating in Events</h5>
          </div>
          <div className="card-body">
            <div className="list-group">
              {camp.event_associations.approved.map((assoc) => (
                <div key={assoc.id} className="list-group-item">
                  <strong>{assoc.event.title}</strong>
                  <br />
                  <small className="text-muted">
                    {formatDate(assoc.event.start_date)} - {formatDate(assoc.event.end_date)}
                  </small>
                  {assoc.location && (
                    <p className="mb-0 mt-1">
                      <i className="bi bi-geo-alt me-1"></i>
                      <small>Location: {assoc.location}</small>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampDetail;
