/**
 * Event Detail Page.
 *
 * Displays event details and manages camp associations.
 * Shows pending, approved, and rejected camps.
 */

import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEvent, useCancelEvent, useApproveCampForEvent, useRejectCampForEvent } from '../../hooks/useEvents';
import { useAuth } from '../../contexts/AuthContext';

function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(parseInt(eventId));
  const { user } = useAuth();
  const cancelMutation = useCancelEvent();
  const approveCampMutation = useApproveCampForEvent();
  const rejectCampMutation = useRejectCampForEvent();

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-success',
      'rejected': 'bg-danger',
      'cancelled': 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this event?')) {
      cancelMutation.mutate(parseInt(eventId), {
        onSuccess: () => {
          navigate('/events');
        }
      });
    }
  };

  const handleApproveCamp = (campId) => {
    if (window.confirm('Approve this camp for the event?')) {
      approveCampMutation.mutate({ eventId: parseInt(eventId), campId });
    }
  };

  const handleRejectCamp = (campId) => {
    if (window.confirm('Reject this camp request?')) {
      rejectCampMutation.mutate({ eventId: parseInt(eventId), campId });
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
          {error.response?.data?.error || 'Failed to load event. Please try again.'}
        </div>
        <Link to="/events" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to Events
        </Link>
      </div>
    );
  }

  if (!event) return null;

  const isCreator = user && event.creator_id === user.id;
  const canManageCamps = isCreator || (user && ['site_admin', 'global_admin'].includes(user.role));

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-calendar-event me-2"></i>{event.title}</h2>
        <div className="btn-group">
          <Link to="/events" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
          {isCreator && event.status === 'pending' && (
            <Link to={`/events/${eventId}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {isCreator && event.status === 'approved' && (
            <button
              className="btn btn-warning"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              <i className="bi bi-x-circle me-2"></i>Cancel Event
            </button>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            Event Details
            <span className={`badge ${getStatusBadge(event.status)} ms-2`}>
              {event.status}
            </span>
          </h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Dates:</div>
            <div className="col-md-9">
              <i className="bi bi-calendar3 me-2"></i>
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </div>
          </div>

          {event.location && (
            <div className="row mb-3">
              <div className="col-md-3 fw-bold">Location:</div>
              <div className="col-md-9">
                <i className="bi bi-geo-alt me-2"></i>
                {event.location}
              </div>
            </div>
          )}

          {event.description && (
            <div className="row mb-3">
              <div className="col-md-3 fw-bold">Description:</div>
              <div className="col-md-9">{event.description}</div>
            </div>
          )}

          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Created By:</div>
            <div className="col-md-9">{event.creator_name}</div>
          </div>

          <div className="row">
            <div className="col-md-3 fw-bold">Created On:</div>
            <div className="col-md-9">{formatDate(event.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {(event.event_manager_email || event.safety_manager_email || event.business_manager_email || event.board_email) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-people me-2"></i>Contact Information</h5>
          </div>
          <div className="card-body">
            {event.event_manager_email && (
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Event Manager:</div>
                <div className="col-md-9">
                  <a href={`mailto:${event.event_manager_email}`}>{event.event_manager_email}</a>
                  {event.event_manager_phone && <span className="ms-3">{event.event_manager_phone}</span>}
                </div>
              </div>
            )}

            {event.safety_manager_email && (
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Safety Manager:</div>
                <div className="col-md-9">
                  <a href={`mailto:${event.safety_manager_email}`}>{event.safety_manager_email}</a>
                  {event.safety_manager_phone && <span className="ms-3">{event.safety_manager_phone}</span>}
                </div>
              </div>
            )}

            {event.business_manager_email && (
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Business Manager:</div>
                <div className="col-md-9">
                  <a href={`mailto:${event.business_manager_email}`}>{event.business_manager_email}</a>
                  {event.business_manager_phone && <span className="ms-3">{event.business_manager_phone}</span>}
                </div>
              </div>
            )}

            {event.board_email && (
              <div className="row">
                <div className="col-md-3 fw-bold">Board Contact:</div>
                <div className="col-md-9">
                  <a href={`mailto:${event.board_email}`}>{event.board_email}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camp Associations */}
      {event.camps && canManageCamps && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-flag me-2"></i>Camp Associations</h5>
          </div>
          <div className="card-body">
            {/* Pending Camps */}
            {event.camps.pending && event.camps.pending.length > 0 && (
              <>
                <h6 className="text-warning">Pending Requests ({event.camps.pending.length})</h6>
                <div className="list-group mb-3">
                  {event.camps.pending.map((assoc) => (
                    <div key={assoc.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{assoc.camp.name}</h6>
                          <p className="mb-1 text-muted small">{assoc.camp.description}</p>
                          <small className="text-muted">
                            Max Sites: {assoc.camp.max_sites} | Max People: {assoc.camp.max_people}
                          </small>
                        </div>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveCamp(assoc.camp.id)}
                            disabled={approveCampMutation.isPending}
                          >
                            <i className="bi bi-check-circle me-1"></i>Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectCamp(assoc.camp.id)}
                            disabled={rejectCampMutation.isPending}
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

            {/* Approved Camps */}
            {event.camps.approved && event.camps.approved.length > 0 && (
              <>
                <h6 className="text-success">Approved Camps ({event.camps.approved.length})</h6>
                <div className="list-group mb-3">
                  {event.camps.approved.map((assoc) => (
                    <div key={assoc.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{assoc.camp.name}</h6>
                          <p className="mb-1 text-muted small">{assoc.camp.description}</p>
                          <small className="text-muted">
                            Max Sites: {assoc.camp.max_sites} | Max People: {assoc.camp.max_people}
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

            {/* Rejected Camps */}
            {event.camps.rejected && event.camps.rejected.length > 0 && (
              <>
                <h6 className="text-danger">Rejected Camps ({event.camps.rejected.length})</h6>
                <div className="list-group">
                  {event.camps.rejected.map((assoc) => (
                    <div key={assoc.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{assoc.camp.name}</h6>
                          <p className="mb-1 text-muted small">{assoc.camp.description}</p>
                        </div>
                        <span className="badge bg-danger">Rejected</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(!event.camps.pending || event.camps.pending.length === 0) &&
             (!event.camps.approved || event.camps.approved.length === 0) &&
             (!event.camps.rejected || event.camps.rejected.length === 0) && (
              <p className="text-muted mb-0">No camp associations yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Public Camp List (for approved events, non-managers) */}
      {event.camps && event.status === 'approved' && !canManageCamps && event.camps.approved && event.camps.approved.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-flag me-2"></i>Participating Camps</h5>
          </div>
          <div className="card-body">
            <div className="list-group">
              {event.camps.approved.map((assoc) => (
                <div key={assoc.id} className="list-group-item">
                  <h6 className="mb-1">{assoc.camp.name}</h6>
                  <p className="mb-1 text-muted small">{assoc.camp.description}</p>
                  {assoc.location && (
                    <p className="mb-0">
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

export default EventDetail;
