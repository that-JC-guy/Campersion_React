/**
 * View Profile Page.
 *
 * Displays current user's profile information including:
 * - Personal info (name, email, pronouns)
 * - Contact information (phones, address)
 * - Linked OAuth providers
 * - Camp memberships
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile, useDeleteOwnAccount } from '../../hooks/useProfile';
import { useAuth } from '../../contexts/AuthContext';

function ViewProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data, isLoading, error } = useProfile();
  const deleteAccountMutation = useDeleteOwnAccount();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

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
          Failed to load profile. Please try again.
        </div>
      </div>
    );
  }

  const { profile, oauth_providers, camp_memberships } = data;

  // Helper to format display name
  const getDisplayName = () => {
    if (profile.show_full_name && profile.first_name && profile.last_name) {
      const name = `${profile.first_name} ${profile.last_name}`;
      if (profile.preferred_name) {
        return `${name} (${profile.preferred_name})`;
      }
      return name;
    }
    return profile.preferred_name || profile.first_name || profile.name || 'Not set';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = async () => {
    if (confirmationEmail !== profile.email) {
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync();
      // Account deleted successfully, logout and redirect
      logout();
      navigate('/');
    } catch (error) {
      // Error is already handled by the mutation hook
      setShowDeleteModal(false);
      setConfirmationEmail('');
    }
  };

  return (
    <div className="container mt-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item active">Profile</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <img src="/Member.png" alt="Member" style={{ height: '68px', width: 'auto' }} className="me-2" />
          My Profile
        </h2>
        <Link to="/profile/edit" className="btn btn-primary">
          <i className="bi bi-pencil me-2"></i>Edit Profile
        </Link>
      </div>

      {/* Personal Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-person me-2"></i>Personal Information</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Display Name:</div>
            <div className="col-md-9">{getDisplayName()}</div>
          </div>

          {profile.show_full_name && (
            <>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">First Name:</div>
                <div className="col-md-9">{profile.first_name || 'Not set'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Last Name:</div>
                <div className="col-md-9">{profile.last_name || 'Not set'}</div>
              </div>
            </>
          )}

          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Email:</div>
            <div className="col-md-9">
              {profile.email}
              {profile.email_verified ? (
                <span className="badge bg-success ms-2">
                  <i className="bi bi-check-circle me-1"></i>Verified
                </span>
              ) : (
                <span className="badge bg-warning text-dark ms-2">
                  <i className="bi bi-exclamation-circle me-1"></i>Not Verified
                </span>
              )}
              <Link to="/profile/change-email" className="ms-3 btn btn-sm btn-outline-secondary">
                Change Email
              </Link>
            </div>
          </div>

          {profile.show_pronouns && profile.pronouns && (
            <div className="row mb-3">
              <div className="col-md-3 fw-bold">Pronouns:</div>
              <div className="col-md-9">{profile.pronouns}</div>
            </div>
          )}

          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Role:</div>
            <div className="col-md-9">
              <span className="badge bg-info">{profile.role}</span>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Member Since:</div>
            <div className="col-md-9">{formatDate(profile.created_at)}</div>
          </div>

          <div className="row">
            <div className="col-md-3 fw-bold">Last Login:</div>
            <div className="col-md-9">{formatDate(profile.last_login)}</div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {(profile.home_phone || profile.mobile_phone || profile.work_phone) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-telephone me-2"></i>Contact Information</h5>
          </div>
          <div className="card-body">
            {profile.home_phone && (
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Home Phone:</div>
                <div className="col-md-9">{profile.home_phone}</div>
              </div>
            )}
            {profile.mobile_phone && (
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Mobile Phone:</div>
                <div className="col-md-9">{profile.mobile_phone}</div>
              </div>
            )}
            {profile.work_phone && (
              <div className="row">
                <div className="col-md-3 fw-bold">Work Phone:</div>
                <div className="col-md-9">{profile.work_phone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Information */}
      {(profile.address_line1 || profile.city || profile.state || profile.zip_code || profile.country) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-geo-alt me-2"></i>Address</h5>
          </div>
          <div className="card-body">
            {profile.address_line1 && (
              <div className="row mb-2">
                <div className="col-md-12">{profile.address_line1}</div>
              </div>
            )}
            {profile.address_line2 && (
              <div className="row mb-2">
                <div className="col-md-12">{profile.address_line2}</div>
              </div>
            )}
            {(profile.city || profile.state || profile.zip_code) && (
              <div className="row mb-2">
                <div className="col-md-12">
                  {[profile.city, profile.state, profile.zip_code].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
            {profile.country && (
              <div className="row">
                <div className="col-md-12">{profile.country}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication Methods */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-shield-lock me-2"></i>Authentication Methods</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Email/Password:</div>
            <div className="col-md-9">
              {profile.has_password_auth ? (
                <span className="badge bg-success">
                  <i className="bi bi-check-circle me-1"></i>Enabled
                </span>
              ) : (
                <span className="badge bg-secondary">Not set up</span>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-3 fw-bold">OAuth Providers:</div>
            <div className="col-md-9">
              {oauth_providers && oauth_providers.length > 0 ? (
                <div>
                  {oauth_providers.map((provider) => (
                    <div key={provider.id} className="mb-2">
                      <span className="badge bg-primary me-2">
                        <i className={`bi bi-${provider.provider_name === 'google' ? 'google' : 'microsoft'} me-1`}></i>
                        {provider.provider_name.charAt(0).toUpperCase() + provider.provider_name.slice(1)}
                      </span>
                      <small className="text-muted">
                        Linked on {formatDate(provider.created_at)}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="badge bg-secondary">No OAuth providers linked</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camp Memberships */}
      {camp_memberships && (camp_memberships.approved?.length > 0 || camp_memberships.pending?.length > 0) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-people me-2"></i>Camp Memberships</h5>
          </div>
          <div className="card-body">
            {camp_memberships.approved && camp_memberships.approved.length > 0 && (
              <>
                <h6 className="text-success">Approved Camps</h6>
                <ul className="list-group mb-3">
                  {camp_memberships.approved.map((membership) => (
                    <li key={membership.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>
                            <Link to={`/camps/${membership.camp.id}`} className="text-decoration-none">
                              {membership.camp.name}
                            </Link>
                          </strong>
                          <p className="mb-0 small text-muted">{membership.camp.description}</p>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-info me-2">{membership.role}</span>
                          <small className="text-muted d-block">
                            Joined {formatDate(membership.joined_at)}
                          </small>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {camp_memberships.pending && camp_memberships.pending.length > 0 && (
              <>
                <h6 className="text-warning">Pending Requests</h6>
                <ul className="list-group">
                  {camp_memberships.pending.map((membership) => (
                    <li key={membership.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>
                            <Link to={`/camps/${membership.camp.id}`} className="text-decoration-none">
                              {membership.camp.name}
                            </Link>
                          </strong>
                          <p className="mb-0 small text-muted">{membership.camp.description}</p>
                        </div>
                        <span className="badge bg-warning text-dark">Pending</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Section */}
      <div className="card border-danger mb-4">
        <div className="card-header bg-danger text-white">
          <h5 className="mb-0"><i className="bi bi-exclamation-triangle me-2"></i>Danger Zone</h5>
        </div>
        <div className="card-body">
          <h6 className="text-danger">Delete Your Account</h6>
          <p className="text-muted mb-3">
            Once you delete your account, there is no going back. This action will permanently delete:
          </p>
          <ul className="text-muted mb-3">
            <li>Your profile information</li>
            <li>All camp memberships (approved and pending)</li>
            <li>All event registrations</li>
            <li>Your complete inventory</li>
            <li>All linked OAuth providers</li>
          </ul>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="bi bi-trash me-2"></i>Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Account Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmationEmail('');
                  }}
                  disabled={deleteAccountMutation.isPending}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <strong>Warning:</strong> This action cannot be undone!
                </div>
                <p>
                  All of your data will be permanently deleted, including:
                </p>
                <ul>
                  <li>Profile information</li>
                  <li>Camp memberships (approved: {camp_memberships?.approved?.length || 0}, pending: {camp_memberships?.pending?.length || 0})</li>
                  <li>Event registrations</li>
                  <li>Complete inventory</li>
                  <li>OAuth provider links</li>
                </ul>
                <p className="fw-bold mt-3">
                  To confirm, please type your email address: <span className="text-primary">{profile.email}</span>
                </p>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email to confirm"
                  value={confirmationEmail}
                  onChange={(e) => setConfirmationEmail(e.target.value)}
                  disabled={deleteAccountMutation.isPending}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmationEmail('');
                  }}
                  disabled={deleteAccountMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={confirmationEmail !== profile.email || deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Permanently Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewProfile;
