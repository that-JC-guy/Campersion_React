/**
 * Verify Email Change Page.
 *
 * Handles email change verification from token link.
 * Auto-verifies on component mount.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVerifyEmailChange } from '../../hooks/useProfile';

function VerifyEmailChange() {
  const { token } = useParams();
  const verifyMutation = useVerifyEmailChange();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token, {
        onSettled: () => {
          setVerifying(false);
        }
      });
    }
  }, [token]);

  if (verifying || verifyMutation.isPending) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card text-center">
              <div className="card-body py-5">
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Verifying...</span>
                </div>
                <h4>Verifying Email Change...</h4>
                <p className="text-muted">Please wait while we update your email address.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verifyMutation.isError) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card text-center">
              <div className="card-body py-5">
                <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Verification Failed</h4>
                <p className="text-muted mb-4">
                  {verifyMutation.error?.response?.data?.error ||
                   'The verification link is invalid or has expired. Please request a new email change.'}
                </p>
                <div className="d-grid gap-2">
                  <Link to="/profile/change-email" className="btn btn-primary">
                    Request New Email Change
                  </Link>
                  <Link to="/profile" className="btn btn-outline-secondary">
                    Back to Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verifyMutation.isSuccess) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card text-center">
              <div className="card-body py-5">
                <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Email Changed Successfully!</h4>
                <p className="text-muted mb-4">
                  Your email address has been updated. You can now use your new email to log in.
                </p>
                <Link to="/profile" className="btn btn-primary">
                  <i className="bi bi-person-circle me-2"></i>
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default VerifyEmailChange;
