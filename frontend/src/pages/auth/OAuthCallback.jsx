/**
 * OAuth Callback Page.
 *
 * Landing page after OAuth redirect. Checks authentication status
 * and redirects to dashboard or login based on success/error.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const callbackHandled = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (callbackHandled.current) {
      return;
    }
    callbackHandled.current = true;

    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      if (error) {
        // OAuth failed
        let errorMessage = 'OAuth authentication failed. Please try again.';

        if (error === 'invalid_provider') {
          errorMessage = 'Invalid OAuth provider.';
        } else if (error === 'missing_user_data') {
          errorMessage = 'Failed to retrieve user information from OAuth provider.';
        } else if (error === 'oauth_failed') {
          errorMessage = 'OAuth authentication failed. Please try again.';
        }

        toast.error(errorMessage);
        navigate('/login');
        return;
      }

      if (success === 'true') {
        // OAuth succeeded, check auth status to get user data
        await checkAuth();
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } else {
        // No success or error parameter, something went wrong
        toast.error('Authentication status unknown. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5 text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Processing...</span>
                </div>
                <h3 className="fw-bold">Completing Sign In...</h3>
                <p className="text-muted">Please wait while we complete your authentication.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OAuthCallback;
