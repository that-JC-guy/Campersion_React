/**
 * Verify Email Page.
 *
 * Verify email address using token from email link.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { verifyEmail } from '../../api/services/auth';

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully! You can now log in.');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5 text-center">
                {status === 'verifying' && (
                  <>
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Verifying...</span>
                    </div>
                    <h3 className="fw-bold">Verifying Email...</h3>
                    <p className="text-muted">Please wait while we verify your email address.</p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div className="mb-4">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold mb-3">Email Verified!</h3>
                    <p className="text-muted mb-4">{message}</p>
                    <Link to="/login" className="btn btn-primary btn-lg">
                      Go to Login
                    </Link>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <div className="mb-4">
                      <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold mb-3">Verification Failed</h3>
                    <p className="text-muted mb-4">{message}</p>
                    <Link to="/login" className="btn btn-primary">
                      Back to Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
