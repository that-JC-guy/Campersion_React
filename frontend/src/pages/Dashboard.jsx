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
import { useProfile } from '../hooks/useProfile';
import { usePendingMemberRequests } from '../hooks/useCamps';
import { usePendingCampRequests } from '../hooks/useEvents';

function Dashboard() {
  const { user } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: pendingMembers, isLoading: membersLoading } = usePendingMemberRequests();
  const { data: pendingCamps, isLoading: campsLoading } = usePendingCampRequests();

  const approvedCamps = profileData?.camp_memberships?.approved || [];
  const pendingCampRequests = profileData?.camp_memberships?.pending || [];

  // Calculate total pending approvals
  const totalPendingApprovals = (pendingMembers?.pending_requests?.length || 0) + (pendingCamps?.pending_requests?.length || 0);
  const hasPendingApprovals = totalPendingApprovals > 0;

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
                                className="text-decoration-none text-dark fw-bold"
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
                              className="text-decoration-none text-dark fw-bold"
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
    </div>
  );
}

export default Dashboard;
