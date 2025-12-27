/**
 * Events List Page.
 *
 * Displays list of events with role-based filtering:
 * - Site admins see all events
 * - Event managers see their own events + all approved events
 * - Regular users see only approved events
 */

import { Link } from 'react-router-dom';
import { useEvents, useApproveEvent, useRejectEvent } from '../../hooks/useEvents';
import { useAuth } from '../../contexts/AuthContext';

function EventsList() {
  const { data, isLoading, error } = useEvents();
  const { user } = useAuth();
  const approveMutation = useApproveEvent();
  const rejectMutation = useRejectEvent();

  // Helper to get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-success',
      'rejected': 'bg-danger',
      'cancelled': 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleApprove = (eventId) => {
    if (window.confirm('Are you sure you want to approve this event?')) {
      approveMutation.mutate(eventId);
    }
  };

  const handleReject = (eventId) => {
    if (window.confirm('Are you sure you want to reject this event?')) {
      rejectMutation.mutate(eventId);
    }
  };

  // Check if user can create events
  const canCreateEvents = user && ['event_manager', 'site_admin', 'global_admin'].includes(user.role);

  // Check if user can approve events
  const canApproveEvents = user && ['site_admin', 'global_admin'].includes(user.role);

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
          Failed to load events. Please try again.
        </div>
      </div>
    );
  }

  const events = data?.events || [];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-calendar-event me-2"></i>Events</h2>
        {canCreateEvents && (
          <Link to="/events/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Create Event
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No events available.</p>
            {canCreateEvents && (
              <Link to="/events/create" className="btn btn-primary mt-2">
                Create First Event
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="row">
          {events.map((event) => (
            <div key={event.id} className="col-12 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h5 className="card-title">
                        <Link to={`/events/${event.id}`} className="text-decoration-none">
                          {event.title}
                        </Link>
                        <span className={`badge ${getStatusBadge(event.status)} ms-2`}>
                          {event.status}
                        </span>
                      </h5>

                      <p className="card-text text-muted mb-2">
                        <i className="bi bi-calendar3 me-1"></i>
                        {formatDate(event.start_date)} - {formatDate(event.end_date)}
                      </p>

                      {event.location && (
                        <p className="card-text text-muted mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="card-text">
                          {event.description.length > 200
                            ? `${event.description.substring(0, 200)}...`
                            : event.description}
                        </p>
                      )}

                      <p className="card-text">
                        <small className="text-muted">
                          Created by {event.creator_name} on {formatDate(event.created_at)}
                        </small>
                      </p>
                    </div>

                    <div className="ms-3">
                      <div className="btn-group-vertical gap-1">
                        <Link
                          to={`/events/${event.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-eye me-1"></i>View
                        </Link>

                        {user && event.creator_id === user.id && event.status === 'pending' && (
                          <Link
                            to={`/events/${event.id}/edit`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            <i className="bi bi-pencil me-1"></i>Edit
                          </Link>
                        )}

                        {canApproveEvents && event.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(event.id)}
                              disabled={approveMutation.isPending}
                            >
                              <i className="bi bi-check-circle me-1"></i>Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(event.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <i className="bi bi-x-circle me-1"></i>Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventsList;
