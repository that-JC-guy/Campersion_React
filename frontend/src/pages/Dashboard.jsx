/**
 * Dashboard Page.
 *
 * Main landing page after login showing:
 * - Welcome message with link to edit profile
 * - Pending requests that the user can approve
 * - User's camp memberships broken down by status
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useUpdateEventRegistration } from '../hooks/useProfile';
import { usePendingMemberRequests } from '../hooks/useCamps';
import { usePendingCampRequests } from '../hooks/useEvents';

function Dashboard() {
  const { user } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: pendingMembers, isLoading: membersLoading } = usePendingMemberRequests();
  const { data: pendingCamps, isLoading: campsLoading } = usePendingCampRequests();

  const approvedCamps = profileData?.camp_memberships?.approved || [];
  const pendingCampRequests = profileData?.camp_memberships?.pending || [];
  const eventRegistrations = profileData?.event_registrations || [];

  const updateRegistrationMutation = useUpdateEventRegistration();

  // Calculate total pending approvals
  const totalPendingApprovals = (pendingMembers?.pending_requests?.length || 0) + (pendingCamps?.pending_requests?.length || 0);
  const hasPendingApprovals = totalPendingApprovals > 0;

  // Handler for updating event registration checkboxes
  const handleRegistrationChange = (registrationId, field, value) => {
    updateRegistrationMutation.mutate({
      registrationId,
      data: { [field]: value }
    });
  };

  // Helper to format event dates
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mt-4">
      {/* Welcome Section */}
      <div className="card mb-4 bg-primary text-white">
        <div className="card-body">
          <h2 className="mb-2">
            Welcome, {user?.preferred_name || user?.first_name || user?.name || 'User'}!
          </h2>
          <p className="mb-2">
            You are logged in as <strong>{user?.email}</strong>
          </p>
          <Link to="/profile/edit" className="btn btn-light btn-sm">
            <i className="bi bi-pencil me-1"></i>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Pending Approvals Section - Only show if there are pending requests */}
      {hasPendingApprovals && (
        <div className="card mb-4 border-warning">
          <div className="card-header bg-warning text-dark">
            <h4 className="mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Pending Approvals ({totalPendingApprovals})
            </h4>
          </div>
          <div className="card-body">
            {/* Pending Camp Member Requests */}
            {pendingMembers?.pending_requests && pendingMembers.pending_requests.length > 0 && (
              <div className="mb-3">
                <h5 className="text-muted">
                  <i className="bi bi-people me-2"></i>
                  Camp Member Requests ({pendingMembers.pending_requests.length})
                </h5>
                <div className="list-group">
                  {pendingMembers.pending_requests.map((request) => (
                    <Link
                      key={request.id}
                      to={`/camps/${request.camp.id}`}
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{request.user.name}</strong> wants to join <strong>{request.camp.name}</strong>
                          <br />
                          <small className="text-muted">
                            Requested: {new Date(request.requested_at).toLocaleDateString()}
                          </small>
                        </div>
                        <i className="bi bi-chevron-right"></i>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Camp-Event Association Requests */}
            {pendingCamps?.pending_requests && pendingCamps.pending_requests.length > 0 && (
              <div>
                <h5 className="text-muted">
                  <i className="bi bi-calendar-event me-2"></i>
                  Camp Event Requests ({pendingCamps.pending_requests.length})
                </h5>
                <div className="list-group">
                  {pendingCamps.pending_requests.map((request) => (
                    <Link
                      key={request.id}
                      to={`/events/${request.event.id}`}
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{request.camp.name}</strong> wants to join <strong>{request.event.title}</strong>
                          <br />
                          <small className="text-muted">
                            Requested: {new Date(request.requested_at).toLocaleDateString()}
                          </small>
                        </div>
                        <i className="bi bi-chevron-right"></i>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Camps Section */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-flag me-2"></i>
              My Camps
            </h4>
            <Link to="/my-camps" className="btn btn-sm btn-outline-primary">
              View All
            </Link>
          </div>
        </div>
        <div className="card-body">
          {profileLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Approved Camps */}
              {approvedCamps.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-success">
                    <i className="bi bi-check-circle me-2"></i>
                    Approved ({approvedCamps.length})
                  </h5>
                  <div className="row">
                    {approvedCamps.slice(0, 3).map((membership) => (
                      <div key={membership.id} className="col-md-4 mb-2">
                        <div className="card h-100 border-success">
                          <div className="card-body p-2">
                            <div className="d-flex justify-content-between align-items-start">
                              <Link
                                to={`/camps/${membership.camp.id}`}
                                className="text-decoration-none fw-bold"
                              >
                                {membership.camp.name}
                              </Link>
                              {membership.role === 'manager' && (
                                <span className="badge bg-primary">Manager</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {approvedCamps.length > 3 && (
                    <p className="text-muted small mb-0 mt-2">
                      And {approvedCamps.length - 3} more...
                    </p>
                  )}
                </div>
              )}

              {/* Pending Camp Requests */}
              {pendingCampRequests.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-warning">
                    <i className="bi bi-clock me-2"></i>
                    Pending ({pendingCampRequests.length})
                  </h5>
                  <div className="row">
                    {pendingCampRequests.slice(0, 3).map((membership) => (
                      <div key={membership.id} className="col-md-4 mb-2">
                        <div className="card h-100 border-warning">
                          <div className="card-body p-2">
                            <Link
                              to={`/camps/${membership.camp.id}`}
                              className="text-decoration-none fw-bold"
                            >
                              {membership.camp.name}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingCampRequests.length > 3 && (
                    <p className="text-muted small mb-0 mt-2">
                      And {pendingCampRequests.length - 3} more...
                    </p>
                  )}
                </div>
              )}

              {/* Empty State */}
              {approvedCamps.length === 0 && pendingCampRequests.length === 0 && (
                <div className="text-center py-4">
                  <i className="bi bi-flag" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <h5 className="mt-3 text-muted">You're not a member of any camps yet</h5>
                  <Link to="/camps" className="btn btn-primary btn-sm mt-2">
                    <i className="bi bi-search me-2"></i>Browse Camps
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* My Events Section */}
      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">
            <img src="/Event.png" alt="Event" style={{ height: '48px', width: 'auto' }} className="me-2" />
            My Events
            {eventRegistrations.length > 0 && (
              <span className="badge bg-secondary ms-2">{eventRegistrations.length}</span>
            )}
          </h4>
        </div>
        <div className="card-body">
          {profileLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {eventRegistrations.length > 0 ? (
                <div className="row g-3">
                  {eventRegistrations.map((registration) => (
                    <div key={registration.id} className="col-md-6">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">
                            <Link to={`/events/${registration.event.id}`} className="text-decoration-none">
                              {registration.event.title}
                            </Link>
                          </h5>
                          <p className="card-text text-muted small mb-2">
                            <i className="bi bi-calendar3 me-1"></i>
                            {formatEventDate(registration.event.start_date)} - {formatEventDate(registration.event.end_date)}
                          </p>
                          {registration.event.location && (
                            <p className="card-text text-muted small mb-3">
                              <i className="bi bi-geo-alt me-1"></i>
                              {registration.event.location}
                            </p>
                          )}

                          {/* Event Access Status */}
                          <div className="mt-3">
                            <h6 className="small fw-bold mb-2">Event Access Status:</h6>

                            {/* Ticket Checkbox */}
                            <div className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`ticket-${registration.id}`}
                                checked={registration.has_ticket}
                                onChange={(e) => handleRegistrationChange(
                                  registration.id,
                                  'has_ticket',
                                  e.target.checked
                                )}
                                disabled={updateRegistrationMutation.isPending}
                              />
                              <label className="form-check-label small" htmlFor={`ticket-${registration.id}`}>
                                <i className="bi bi-ticket-perforated me-1"></i>
                                Ticket
                              </label>
                            </div>

                            {/* Early Arrival - Only show if event has this option */}
                            {registration.event.has_early_arrival && (
                              <div className="form-check mb-2">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`early-arrival-${registration.id}`}
                                  checked={registration.opted_early_arrival}
                                  onChange={(e) => handleRegistrationChange(
                                    registration.id,
                                    'opted_early_arrival',
                                    e.target.checked
                                  )}
                                  disabled={updateRegistrationMutation.isPending}
                                />
                                <label className="form-check-label small" htmlFor={`early-arrival-${registration.id}`}>
                                  <i className="bi bi-sunrise me-1"></i>
                                  Early Arrival
                                  {registration.event.early_arrival_days && (
                                    <span className="text-muted"> ({registration.event.early_arrival_days} {registration.event.early_arrival_days === 1 ? 'day' : 'days'})</span>
                                  )}
                                </label>
                              </div>
                            )}

                            {/* Late Departure - Only show if event has this option */}
                            {registration.event.has_late_departure && (
                              <div className="form-check mb-2">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`late-departure-${registration.id}`}
                                  checked={registration.opted_late_departure}
                                  onChange={(e) => handleRegistrationChange(
                                    registration.id,
                                    'opted_late_departure',
                                    e.target.checked
                                  )}
                                  disabled={updateRegistrationMutation.isPending}
                                />
                                <label className="form-check-label small" htmlFor={`late-departure-${registration.id}`}>
                                  <i className="bi bi-sunset me-1"></i>
                                  Late Departure
                                  {registration.event.late_departure_days && (
                                    <span className="text-muted"> ({registration.event.late_departure_days} {registration.event.late_departure_days === 1 ? 'day' : 'days'})</span>
                                  )}
                                </label>
                              </div>
                            )}

                            {/* Vehicle Access - Only show if event has this option */}
                            {registration.event.has_vehicle_access && (
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`vehicle-access-${registration.id}`}
                                  checked={registration.opted_vehicle_access}
                                  onChange={(e) => handleRegistrationChange(
                                    registration.id,
                                    'opted_vehicle_access',
                                    e.target.checked
                                  )}
                                  disabled={updateRegistrationMutation.isPending}
                                />
                                <label className="form-check-label small" htmlFor={`vehicle-access-${registration.id}`}>
                                  <i className="bi bi-car-front me-1"></i>
                                  Vehicle Access
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <h5 className="mt-3 text-muted">You're not registered for any events yet</h5>
                  <Link to="/events" className="btn btn-primary btn-sm mt-2">
                    <i className="bi bi-search me-2"></i>Browse Events
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
