/**
 * My Camps Page.
 *
 * Displays all camps where the user is a member or has a pending membership request.
 * Shows approved camps and pending requests separately.
 */

import { Link } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';

function MyCamps() {
  const { data: profileData, isLoading, error } = useProfile();

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
          {error.response?.data?.error || 'Failed to load your camps. Please try again.'}
        </div>
        <Link to="/camps" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Browse All Camps
        </Link>
      </div>
    );
  }

  const approvedCamps = profileData?.camp_memberships?.approved || [];
  const pendingCamps = profileData?.camp_memberships?.pending || [];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-flag me-2"></i>My Camps
        </h2>
        <Link to="/camps" className="btn btn-outline-primary">
          <i className="bi bi-search me-2"></i>Browse All Camps
        </Link>
      </div>

      {/* Approved Camps */}
      {approvedCamps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-success mb-3">
            <i className="bi bi-check-circle me-2"></i>My Camps ({approvedCamps.length})
          </h4>
          <div className="row">
            {approvedCamps.map((membership) => (
              <div key={membership.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{membership.camp.name}</h5>
                      {membership.role === 'manager' && (
                        <span className="badge bg-primary">Manager</span>
                      )}
                    </div>
                    {membership.camp.description && (
                      <p className="card-text text-muted small">
                        {membership.camp.description.length > 100
                          ? membership.camp.description.substring(0, 100) + '...'
                          : membership.camp.description}
                      </p>
                    )}
                    {membership.approved_at && (
                      <p className="text-muted small mb-2">
                        <i className="bi bi-calendar-check me-1"></i>
                        Joined: {new Date(membership.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="card-footer bg-transparent">
                    <Link
                      to={`/camps/${membership.camp.id}`}
                      className="btn btn-sm btn-outline-primary w-100"
                    >
                      <i className="bi bi-eye me-1"></i>View Camp
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Membership Requests */}
      {pendingCamps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-warning mb-3">
            <i className="bi bi-clock me-2"></i>Pending Requests ({pendingCamps.length})
          </h4>
          <div className="row">
            {pendingCamps.map((membership) => (
              <div key={membership.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card h-100 shadow-sm border-warning">
                  <div className="card-body">
                    <h5 className="card-title">{membership.camp.name}</h5>
                    {membership.camp.description && (
                      <p className="card-text text-muted small">
                        {membership.camp.description.length > 100
                          ? membership.camp.description.substring(0, 100) + '...'
                          : membership.camp.description}
                      </p>
                    )}
                    <p className="text-muted small mb-0">
                      <i className="bi bi-calendar me-1"></i>
                      Requested: {new Date(membership.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="card-footer bg-transparent">
                    <Link
                      to={`/camps/${membership.camp.id}`}
                      className="btn btn-sm btn-outline-warning w-100"
                    >
                      <i className="bi bi-eye me-1"></i>View Camp
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {approvedCamps.length === 0 && pendingCamps.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-flag" style={{ fontSize: '4rem', color: '#ccc' }}></i>
          <h4 className="mt-3">You're not a member of any camps yet</h4>
          <p className="text-muted">
            Browse available camps and request to join one!
          </p>
          <Link to="/camps" className="btn btn-primary mt-2">
            <i className="bi bi-search me-2"></i>Browse Camps
          </Link>
        </div>
      )}
    </div>
  );
}

export default MyCamps;
