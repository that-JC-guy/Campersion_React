/**
 * Camps List Page.
 *
 * Displays list of all camps (public access).
 * Shows camp info, capacity, and amenities.
 */

import { Link } from 'react-router-dom';
import { useCamps } from '../../hooks/useCamps';
import { useAuth } from '../../contexts/AuthContext';

function CampsList() {
  const { data, isLoading, error } = useCamps();
  const { user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAmenities = (camp) => {
    const amenities = [];
    if (camp.has_communal_kitchen) amenities.push('Kitchen');
    if (camp.has_communal_space) amenities.push('Common Space');
    if (camp.has_art_exhibits) amenities.push('Art');
    if (camp.has_member_activities) amenities.push('Member Activities');
    if (camp.has_non_member_activities) amenities.push('Public Activities');
    return amenities;
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
          Failed to load camps. Please try again.
        </div>
      </div>
    );
  }

  const camps = data?.camps || [];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-flag me-2"></i>Camps</h2>
        {user && (
          <Link to="/camps/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Create Camp
          </Link>
        )}
      </div>

      {camps.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-flag-fill" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No camps available yet.</p>
            {user && (
              <Link to="/camps/create" className="btn btn-primary mt-2">
                Create First Camp
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="row">
          {camps.map((camp) => (
            <div key={camp.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    <Link to={`/camps/${camp.id}`} className="text-decoration-none">
                      {camp.name}
                    </Link>
                  </h5>

                  {camp.description && (
                    <p className="card-text text-muted">
                      {camp.description.length > 100
                        ? `${camp.description.substring(0, 100)}...`
                        : camp.description}
                    </p>
                  )}

                  <div className="mb-2">
                    <small className="text-muted">
                      <i className="bi bi-house me-1"></i>
                      Max Sites: {camp.max_sites || 'N/A'}
                    </small>
                    <br />
                    <small className="text-muted">
                      <i className="bi bi-people me-1"></i>
                      Max People: {camp.max_people || 'N/A'}
                    </small>
                  </div>

                  {getAmenities(camp).length > 0 && (
                    <div className="mb-2">
                      {getAmenities(camp).map((amenity, idx) => (
                        <span key={idx} className="badge bg-secondary me-1 mb-1">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  {camp.custom_amenities && (
                    <p className="card-text mb-2">
                      <small className="text-muted">
                        <i className="bi bi-star me-1"></i>
                        {camp.custom_amenities}
                      </small>
                    </p>
                  )}

                  <div className="mt-3">
                    <Link to={`/camps/${camp.id}`} className="btn btn-sm btn-outline-primary w-100">
                      <i className="bi bi-eye me-1"></i>View Details
                    </Link>
                  </div>
                </div>
                <div className="card-footer text-muted">
                  <small>Created {formatDate(camp.created_at)}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CampsList;
